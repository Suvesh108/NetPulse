package com.netpulse.speedtest.engine

import com.netpulse.speedtest.model.MtrTarget
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit
import kotlin.math.abs
import kotlin.math.max

class MtrPingEngine(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(3, TimeUnit.SECONDS)
        .readTimeout(3, TimeUnit.SECONDS)
        .build()
) {
    private var job: Job? = null
    var isRunning: Boolean = false
        private set

    val initialTargets = listOf(
        MtrTarget(
            id = "cloudflare",
            name = "Cloudflare Anycast Fabric",
            ip = "1.1.1.1",
            url = "https://speed.cloudflare.com/__down?bytes=0",
            colorHex = 0xFF00D2FF
        ),
        MtrTarget(
            id = "google",
            name = "Google Edge Backbone",
            ip = "8.8.8.8",
            url = "https://dns.google/resolve?name=google.com&type=A",
            colorHex = 0xFF10B981
        ),
        MtrTarget(
            id = "quad9",
            name = "Quad9 Security Edge",
            ip = "9.9.9.9",
            url = "https://dns.quad9.net/dns-query?name=example.com",
            colorHex = 0xFFA855F7
        ),
        MtrTarget(
            id = "aws",
            name = "AWS CloudFront PoP",
            ip = "Global Edge",
            url = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
            colorHex = 0xFFF59E0B
        )
    )

    fun start(
        scope: CoroutineScope,
        onUpdate: (List<MtrTarget>) -> Unit
    ) {
        if (isRunning) return
        isRunning = true
        var currentTargets = initialTargets

        job = scope.launch(Dispatchers.IO) {
            while (isActive) {
                val updated = currentTargets.map { target ->
                    val start = System.currentTimeMillis()
                    var rtt: Int? = null
                    try {
                        val sep = if (target.url.contains("?")) "&" else "?"
                        val req = Request.Builder()
                            .url("${target.url}${sep}_r=${System.currentTimeMillis()}_${(1..1000).random()}")
                            .header("Cache-Control", "no-store")
                            .build()
                        val resp = client.newCall(req).execute()
                        resp.close()
                        rtt = max(2, (System.currentTimeMillis() - start).toInt())
                    } catch (e: Exception) {
                        rtt = null
                    }

                    val newSent = target.sent + 1
                    val isLoss = rtt == null
                    val newLost = if (isLoss) target.lost + 1 else target.lost
                    val newHistory = (target.history.takeLast(19) + (rtt ?: 0))
                    val valid = newHistory.filter { it > 0 }
                    val minVal = if (valid.isNotEmpty()) valid.minOrNull() else target.min
                    val maxVal = if (valid.isNotEmpty()) valid.maxOrNull() else target.max
                    val avgVal = if (valid.isNotEmpty()) valid.average().toInt() else target.avg
                    val jitterVal = if (valid.size > 1) {
                        val diffs = (1 until valid.size).map { abs(valid[it] - valid[it - 1]) }
                        Math.round(diffs.average() * 10.0) / 10.0
                    } else target.jitter

                    target.copy(
                        history = newHistory,
                        sent = newSent,
                        lost = newLost,
                        min = minVal,
                        max = maxVal,
                        avg = avgVal,
                        jitter = jitterVal,
                        current = rtt
                    )
                }
                currentTargets = updated
                withContext(Dispatchers.Main) { onUpdate(currentTargets) }
                delay(1200)
            }
        }
    }

    fun stop() {
        job?.cancel()
        isRunning = false
    }
}
