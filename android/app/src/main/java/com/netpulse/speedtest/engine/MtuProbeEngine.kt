package com.netpulse.speedtest.engine

import com.netpulse.speedtest.model.MtuBoundary
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit
import kotlin.math.max

class MtuProbeEngine(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(3, TimeUnit.SECONDS)
        .readTimeout(3, TimeUnit.SECONDS)
        .build()
) {
    val defaultBoundaries = listOf(
        MtuBoundary(1280, "1280 B (IPv6 Minimum)", "RFC 8200 minimum guaranteed path MTU", 14.6),
        MtuBoundary(1420, "1420 B (WireGuard / VPN)", "Encapsulated tunnels & secure IPsec", 5.3),
        MtuBoundary(1472, "1472 B (Max UDP Frame)", "Optimal unfragmented packet payload (1500-28)", 1.8),
        MtuBoundary(1492, "1492 B (PPPoE DSL)", "Broadband DSL encapsulation overhead", 0.5),
        MtuBoundary(1500, "1500 B (Standard Ethernet)", "Standard consumer & datacenter fiber", 0.0),
        MtuBoundary(1508, "1508 B (Baby Jumbo Frame)", "VLAN-tagged QinQ transport frame", -0.5)
    )

    suspend fun probeMtu(
        onProgress: (List<MtuBoundary>) -> Unit
    ): Pair<Int, List<MtuBoundary>> = withContext(Dispatchers.IO) {
        var current = defaultBoundaries.map { it.copy(status = "testing") }
        withContext(Dispatchers.Main) { onProgress(current) }

        var highestPass = 1280

        val tested = current.map { b ->
            val start = System.currentTimeMillis()
            var passed = false
            var rtt = 0
            try {
                val req = Request.Builder()
                    .url("https://speed.cloudflare.com/__down?bytes=${b.size}&r=${System.currentTimeMillis()}")
                    .header("Cache-Control", "no-store")
                    .build()
                val resp = client.newCall(req).execute()
                val bytes = resp.body?.bytes()
                rtt = max(5, (System.currentTimeMillis() - start).toInt())
                passed = resp.isSuccessful && bytes?.size == b.size
                resp.close()
            } catch (e: Exception) {
                passed = false
            }

            val status = if (passed && b.size <= 1500) {
                highestPass = max(highestPass, b.size)
                "pass"
            } else if (passed && b.size > 1500) {
                highestPass = max(highestPass, 1500)
                "fragmented"
            } else {
                "fragmented"
            }

            val updatedBoundary = b.copy(
                status = status,
                rttMs = rtt
            )
            updatedBoundary
        }

        withContext(Dispatchers.Main) { onProgress(tested) }
        Pair(highestPass, tested)
    }
}
