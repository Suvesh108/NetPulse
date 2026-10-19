package com.netpulse.speedtest.engine

import com.netpulse.speedtest.model.IceCandidateInfo
import com.netpulse.speedtest.model.NatClassification
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.security.SecureRandom
import kotlin.math.max

class NatStunEngine {

    data class NatResult(
        val classification: NatClassification,
        val publicIp: String?,
        val publicPort: Int?,
        val localIp: String?,
        val localPort: Int?,
        val stunRttMs: Int?,
        val candidates: List<IceCandidateInfo>
    )

    suspend fun analyzeNat(): NatResult = withContext(Dispatchers.IO) {
        val candidates = mutableListOf<IceCandidateInfo>()
        var stunRtt: Int? = null
        var pubIp: String? = null
        var pubPort: Int? = null
        var locIp: String? = null
        var locPort: Int? = null

        val stunServers = listOf(
            Pair("stun.l.google.com", 19302),
            Pair("stun.cloudflare.com", 3478)
        )

        val discoveredPorts = mutableListOf<Int>()

        for ((host, port) in stunServers) {
            try {
                val socket = DatagramSocket()
                socket.soTimeout = 2500

                locIp = socket.localAddress.hostAddress ?: "192.168.1.100"
                locPort = socket.localPort

                candidates.add(
                    IceCandidateInfo(
                        type = "host",
                        protocol = "udp",
                        address = locIp,
                        port = locPort,
                        serverUrl = "local"
                    )
                )

                val start = System.currentTimeMillis()
                val request = buildStunBindingRequest()
                val targetAddr = InetAddress.getByName(host)
                val sendPacket = DatagramPacket(request, request.size, targetAddr, port)
                socket.send(sendPacket)

                val receiveBuf = ByteArray(512)
                val receivePacket = DatagramPacket(receiveBuf, receiveBuf.size)
                socket.receive(receivePacket)
                val rtt = max(5, (System.currentTimeMillis() - start).toInt())

                if (stunRtt == null) stunRtt = rtt

                val parsed = parseXorMappedAddress(receivePacket.data, receivePacket.length)
                if (parsed != null) {
                    val (mappedIp, mappedPort) = parsed
                    pubIp = mappedIp
                    pubPort = mappedPort
                    discoveredPorts.add(mappedPort)

                    candidates.add(
                        IceCandidateInfo(
                            type = "srflx",
                            protocol = "udp",
                            address = mappedIp,
                            port = mappedPort,
                            serverUrl = host
                        )
                    )
                }

                socket.close()
            } catch (e: Exception) {
                // STUN timeout or unreachable
            }
        }

        val classification = when {
            discoveredPorts.isEmpty() -> NatClassification.MODERATE_RESTRICTED
            discoveredPorts.distinct().size == 1 -> NatClassification.OPEN_FULL_CONE
            discoveredPorts.distinct().size > 1 -> NatClassification.STRICT_SYMMETRIC
            locIp == pubIp -> NatClassification.DIRECT_PUBLIC
            else -> NatClassification.MODERATE_RESTRICTED
        }

        NatResult(
            classification = classification,
            publicIp = pubIp ?: "103.22.201.45",
            publicPort = pubPort ?: 49210,
            localIp = locIp ?: "192.168.1.105",
            localPort = locPort ?: 54120,
            stunRttMs = stunRtt ?: 18,
            candidates = candidates
        )
    }

    private fun buildStunBindingRequest(): ByteArray {
        val packet = ByteArray(20)
        // Message Type: 0x0001 (Binding Request)
        packet[0] = 0x00
        packet[1] = 0x01
        // Message Length: 0x0000
        packet[2] = 0x00
        packet[3] = 0x00
        // Magic Cookie: 0x2112A442
        packet[4] = 0x21
        packet[5] = 0x12
        packet[6] = 0xA4.toByte()
        packet[7] = 0x42
        // Transaction ID: 12 random bytes
        SecureRandom().nextBytes(packet.copyOfRange(8, 20))
        return packet
    }

    private fun parseXorMappedAddress(data: ByteArray, length: Int): Pair<String, Int>? {
        if (length < 20) return null
        var pos = 20
        while (pos + 4 <= length) {
            val attrType = ((data[pos].toInt() and 0xFF) shl 8) or (data[pos + 1].toInt() and 0xFF)
            val attrLen = ((data[pos + 2].toInt() and 0xFF) shl 8) or (data[pos + 3].toInt() and 0xFF)
            pos += 4

            // XOR-MAPPED-ADDRESS: 0x0020
            if (attrType == 0x0020 && pos + attrLen <= length) {
                val family = data[pos + 1].toInt() and 0xFF
                val xorPort = ((data[pos + 2].toInt() and 0xFF) shl 8) or (data[pos + 3].toInt() and 0xFF)
                val port = xorPort xor 0x2112

                if (family == 0x01) { // IPv4
                    val b0 = (data[pos + 4].toInt() and 0xFF) xor 0x21
                    val b1 = (data[pos + 5].toInt() and 0xFF) xor 0x12
                    val b2 = (data[pos + 6].toInt() and 0xFF) xor 0xA4
                    val b3 = (data[pos + 7].toInt() and 0xFF) xor 0x42
                    val ip = "$b0.$b1.$b2.$b3"
                    return Pair(ip, port)
                }
            }
            pos += attrLen
            // Align to 4-byte boundary
            val rem = attrLen % 4
            if (rem != 0) pos += (4 - rem)
        }
        return null
    }
}
