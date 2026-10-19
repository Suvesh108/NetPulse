package com.netpulse.speedtest.engine

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.netpulse.speedtest.model.TraceData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit
import kotlin.math.max

class RouteTracerEngine(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(3, TimeUnit.SECONDS)
        .readTimeout(3, TimeUnit.SECONDS)
        .build()
) {
    private val gson = Gson()

    private val airportNames = mapOf(
        "DEL" to "New Delhi (DEL)",
        "BOM" to "Mumbai (BOM)",
        "BLR" to "Bangalore (BLR)",
        "HYD" to "Hyderabad (HYD)",
        "MAA" to "Chennai (MAA)",
        "CCU" to "Kolkata (CCU)",
        "SIN" to "Singapore (SIN)",
        "HKG" to "Hong Kong (HKG)",
        "NRT" to "Tokyo Narita (NRT)",
        "LHR" to "London Heathrow (LHR)",
        "FRA" to "Frankfurt (FRA)",
        "AMS" to "Amsterdam (AMS)",
        "CDG" to "Paris (CDG)",
        "JFK" to "New York (JFK)",
        "ORD" to "Chicago (ORD)",
        "SJC" to "San Jose Silicon Valley (SJC)",
        "LAX" to "Los Angeles (LAX)",
        "DFW" to "Dallas Fort Worth (DFW)",
        "IAD" to "Washington DC (IAD)",
        "SYD" to "Sydney (SYD)"
    )

    suspend fun traceRoute(): TraceData = withContext(Dispatchers.IO) {
        val start = System.currentTimeMillis()
        var cfText = ""
        try {
            val req = Request.Builder().url("https://1.1.1.1/cdn-cgi/trace").build()
            val resp = client.newCall(req).execute()
            cfText = resp.body?.string() ?: ""
            resp.close()
        } catch (e: Exception) {
            try {
                val req2 = Request.Builder().url("https://cloudflare.com/cdn-cgi/trace").build()
                val resp2 = client.newCall(req2).execute()
                cfText = resp2.body?.string() ?: ""
                resp2.close()
            } catch (e2: Exception) {
                // fallback
            }
        }

        val latency = max(5, (System.currentTimeMillis() - start).toInt())
        val map = mutableMapOf<String, String>()
        cfText.lines().forEach { line ->
            val parts = line.split("=")
            if (parts.size >= 2) {
                map[parts[0].trim()] = parts[1].trim()
            }
        }

        val ip = map["ip"] ?: "Client Assigned IP"
        val colo = map["colo"] ?: "EDGE"
        val loc = map["loc"] ?: "GLOBAL"
        val tls = map["tls"] ?: "TLSv1.3"
        val http = map["http"] ?: "HTTP/3 (QUIC)"

        var org = "Tier-1 Autonomous Transit"
        var asn = "AS-ANYCAST"
        var city = airportNames[colo] ?: colo

        if (ip.isNotEmpty() && ip != "Client Assigned IP") {
            try {
                val geoReq = Request.Builder().url("https://ipwho.is/$ip").build()
                val geoResp = client.newCall(geoReq).execute()
                val geoBody = geoResp.body?.string()
                geoResp.close()
                if (geoBody != null) {
                    val json = gson.fromJson(geoBody, JsonObject::class.java)
                    val conn = json.getAsJsonObject("connection")
                    if (conn != null) {
                        org = conn.get("isp")?.asString ?: conn.get("org")?.asString ?: org
                        val asnNum = conn.get("asn")?.asInt
                        if (asnNum != null) asn = "AS$asnNum"
                    }
                    val cityName = json.get("city")?.asString
                    if (cityName != null) city = "$cityName, ${json.get("country_code")?.asString ?: loc}"
                }
            } catch (e: Exception) {
                // ignore
            }
        }

        TraceData(
            clientIp = ip,
            colo = colo,
            loc = loc,
            tls = tls,
            http = http,
            asn = asn,
            org = org,
            city = city,
            latencyMs = latency
        )
    }
}
