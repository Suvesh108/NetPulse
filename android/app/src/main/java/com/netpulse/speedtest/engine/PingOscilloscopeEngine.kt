package com.netpulse.speedtest.engine

import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit
import kotlin.math.abs
import kotlin.math.max

class PingOscilloscopeEngine(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(2, TimeUnit.SECONDS)
        .readTimeout(2, TimeUnit.SECONDS)
        .build()
) {
    private var job: Job? = null
    var isRunning: Boolean = false
        private set

    data class OscilloscopeState(
        val history: List<Int> = emptyList(),
        val currentPing: Int? = null,
        val minPing: Int = 999,
        val maxPing: Int = 0,
        val avgPing: Double? = null,
        val currentJitter: Double? = null,
        val packetDrops: Int = 0,
        val totalSamples: Int = 0,
        val stabilityPct: Double = 100.0,
        val p25: Int = 100,
        val p50: Int = 0,
        val p100: Int = 0,
        val spike: Int = 0
    )

    fun start(
        scope: CoroutineScope,
        targetUrl: String = "https://speed.cloudflare.com/__down?bytes=0",
        intervalMs: Long = 500L,
        onUpdate: (OscilloscopeState) -> Unit
    ) {
        if (isRunning) return
        isRunning = true

        job = scope.launch(Dispatchers.IO) {
            val history = mutableListOf<Int>()
            var minP = 999
            var maxP = 0
            var drops = 0
            var samples = 0

            while (isActive) {
                val start = System.currentTimeMillis()
                var latency: Int? = null
                try {
                    val sep = if (targetUrl.contains("?")) "&" else "?"
                    val req = Request.Builder()
                        .url("$targetUrl${sep}_r=${System.currentTimeMillis()}")
                        .header("Cache-Control", "no-store")
                        .build()
                    val resp = client.newCall(req).execute()
                    resp.close()
                    latency = max(2, (System.currentTimeMillis() - start).toInt())
                } catch (e: Exception) {
                    drops++
                }
                samples++

                if (latency != null) {
                    if (latency < minP) minP = latency
                    if (latency > maxP) maxP = latency
                    history.add(latency)
                    if (history.size > 40) history.removeAt(0)
                }

                val avgP = if (history.isNotEmpty()) history.average() else null
                val jitter = if (history.size > 1) {
                    val diffs = (1 until history.size).map { abs(history[it] - history[it - 1]) }
                    Math.round(diffs.average() * 10.0) / 10.0
                } else null

                val stab = if (samples > 0) {
                    val dropPenalty = (drops.toDouble() / samples) * 100.0
                    val jitterPenalty = (jitter ?: 0.0) * 1.5
                    max(0.0, Math.round((100.0 - dropPenalty - jitterPenalty) * 10.0) / 10.0)
                } else 100.0

                val total = max(1, history.size)
                val p25 = (history.count { it < 25 } * 100) / total
                val p50 = (history.count { it in 25..49 } * 100) / total
                val p100 = (history.count { it in 50..99 } * 100) / total
                val spike = max(0, 100 - p25 - p50 - p100)

                val state = OscilloscopeState(
                    history = history.toList(),
                    currentPing = latency,
                    minPing = if (minP == 999) 0 else minP,
                    maxPing = maxP,
                    avgPing = avgP?.let { Math.round(it * 10.0) / 10.0 },
                    currentJitter = jitter,
                    packetDrops = drops,
                    totalSamples = samples,
                    stabilityPct = stab,
                    p25 = p25,
                    p50 = p50,
                    p100 = p100,
                    spike = spike
                )

                withContext(Dispatchers.Main) { onUpdate(state) }
                delay(intervalMs)
            }
        }
    }

    fun stop() {
        job?.cancel()
        isRunning = false
    }
}
