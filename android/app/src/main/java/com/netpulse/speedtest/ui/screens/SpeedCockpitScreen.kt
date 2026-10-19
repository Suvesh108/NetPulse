package com.netpulse.speedtest.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netpulse.speedtest.engine.SpeedTestEngine
import com.netpulse.speedtest.model.SimulationSettings
import com.netpulse.speedtest.model.SpeedTestResult
import com.netpulse.speedtest.model.TestStatus
import com.netpulse.speedtest.theme.*
import com.netpulse.speedtest.ui.components.RealtimeSplineGraph
import com.netpulse.speedtest.ui.components.SpeedGauge
import kotlinx.coroutines.launch

@Composable
fun SpeedCockpitScreen(
    settings: SimulationSettings,
    unit: String,
    onUnitChanged: (String) -> Unit,
    onOpenCertificate: (SpeedTestResult) -> Unit,
    onTestComplete: (SpeedTestResult) -> Unit,
    modifier: Modifier = Modifier
) {
    val scope = rememberCoroutineScope()
    val engine = remember { SpeedTestEngine() }
    var engineState by remember { mutableStateOf(SpeedTestEngine.SpeedState()) }
    var latestResult by remember { mutableStateOf<SpeedTestResult?>(null) }
    var connectionMode by remember { mutableStateOf(settings.connectionMode) }

    val factor = if (unit == "MB/s") 8.0 else 1.0

    val isRunning = engineState.status != TestStatus.IDLE && engineState.status != TestStatus.COMPLETED

    val currentPhase = when (engineState.status) {
        TestStatus.PINGING -> "Unloaded Ping"
        TestStatus.JITTERING -> "Jitter Analysis"
        TestStatus.DOWNLOADING -> "Download Stream"
        TestStatus.UPLOADING -> "Upload Stream"
        TestStatus.COMPLETED -> "Test Complete"
        TestStatus.IDLE -> "Standby"
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 14.dp, vertical = 10.dp)
            .padding(bottom = 90.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // 1. Top Command Ribbon
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(DarkSurface)
                .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                .padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Left: Node status
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(NeonEmerald)
                )
                Column {
                    Text(
                        text = "Cloudflare Anycast Backbone",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "AS13335 • HTTP/3 QUIC Active",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Medium,
                        fontFamily = FontFamily.Monospace,
                        color = Color.White.copy(alpha = 0.5f)
                    )
                }
            }

            // Right: Multi/Single toggle & Unit selector
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                // Multi / Single toggle
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (connectionMode == "multi") NeonCyan.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.05f))
                        .border(1.dp, if (connectionMode == "multi") NeonCyan.copy(alpha = 0.3f) else Color.Transparent, RoundedCornerShape(8.dp))
                        .clickable(enabled = !isRunning) {
                            connectionMode = if (connectionMode == "multi") "single" else "multi"
                        }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = connectionMode.uppercase(),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = if (connectionMode == "multi") NeonCyan else Color.White.copy(alpha = 0.5f)
                    )
                }

                // Unit Toggle: Mbps vs MB/s
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color.White.copy(alpha = 0.05f))
                        .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                        .padding(2.dp)
                ) {
                    listOf("Mbps", "MB/s").forEach { u ->
                        val isSelected = unit == u
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isSelected) NeonCyan.copy(alpha = 0.2f) else Color.Transparent)
                                .clickable { onUnitChanged(u) }
                                .padding(horizontal = 7.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = u,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                color = if (isSelected) NeonCyan else Color.White.copy(alpha = 0.5f)
                            )
                        }
                    }
                }
            }
        }

        // 2. Speed Gauge Hero Arena
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(DarkSurface)
                .border(1.dp, DarkBorder, RoundedCornerShape(20.dp))
                .padding(top = 16.dp, bottom = 10.dp),
            contentAlignment = Alignment.Center
        ) {
            SpeedGauge(
                speed = engineState.currentSpeedMbps,
                unit = unit,
                phaseLabel = currentPhase
            )
        }

        // 3. Main Action Trigger Button (START TEST / STOPPING)
        Button(
            onClick = {
                if (isRunning) {
                    engine.stopTest()
                } else {
                    val runSettings = settings.copy(connectionMode = connectionMode)
                    engine.startTest(
                        scope = scope,
                        settings = runSettings,
                        onUpdate = { engineState = it },
                        onComplete = {
                            latestResult = it
                            onTestComplete(it)
                        }
                    )
                }
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isRunning) NeonRose else NeonCyan,
                contentColor = Color.Black
            ),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
        ) {
            Icon(
                imageVector = if (isRunning) Icons.Default.Stop else Icons.Default.PlayArrow,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (isRunning) "STOP TEST (${engineState.status})" else "START CARRIER TEST",
                fontSize = 14.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.sp
            )
        }

        // 4. Bento Telemetry Matrix (4 Primary Cards)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Card 1: Download
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(DarkSurface)
                    .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                    .padding(10.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("DOWNLOAD", fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = NeonCyan)
                        Icon(Icons.Default.ArrowDownward, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(12.dp))
                    }
                    val dlVal = engineState.downloadMbps?.let { String.format(java.util.Locale.US, "%.1f", it / factor) } ?: "--"
                    Text(
                        text = dlVal,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = engineState.downloadLoadedLatencyMs?.let { "+${it}ms loaded" } ?: "0-RTT wire",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Medium,
                        fontFamily = FontFamily.Monospace,
                        color = Color.White.copy(alpha = 0.45f)
                    )
                }
            }

            // Card 2: Upload
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(DarkSurface)
                    .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                    .padding(10.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("UPLOAD", fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = NeonViolet)
                        Icon(Icons.Default.ArrowUpward, contentDescription = null, tint = NeonViolet, modifier = Modifier.size(12.dp))
                    }
                    val upVal = engineState.uploadMbps?.let { String.format(java.util.Locale.US, "%.1f", it / factor) } ?: "--"
                    Text(
                        text = upVal,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = engineState.uploadLoadedLatencyMs?.let { "+${it}ms loaded" } ?: "0-RTT wire",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Medium,
                        fontFamily = FontFamily.Monospace,
                        color = Color.White.copy(alpha = 0.45f)
                    )
                }
            }

            // Card 3: Ping
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(DarkSurface)
                    .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                    .padding(10.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("PING", fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = NeonEmerald)
                        Icon(Icons.Default.Bolt, contentDescription = null, tint = NeonEmerald, modifier = Modifier.size(12.dp))
                    }
                    val pVal = engineState.pingMs?.let { "$it ms" } ?: "--"
                    Text(
                        text = pVal,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = "Idle RTT wire",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Medium,
                        fontFamily = FontFamily.Monospace,
                        color = Color.White.copy(alpha = 0.45f)
                    )
                }
            }

            // Card 4: Jitter
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(DarkSurface)
                    .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                    .padding(10.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("JITTER", fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = NeonAmber)
                        Icon(Icons.Default.ShowChart, contentDescription = null, tint = NeonAmber, modifier = Modifier.size(12.dp))
                    }
                    val jVal = engineState.jitterMs?.let { "$it ms" } ?: "--"
                    Text(
                        text = jVal,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = "Variance RFC",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Medium,
                        fontFamily = FontFamily.Monospace,
                        color = Color.White.copy(alpha = 0.45f)
                    )
                }
            }
        }

        // 5. Realtime Spline Graphs (Download & Upload)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(DarkSurface)
                .border(1.dp, DarkBorder, RoundedCornerShape(18.dp))
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                RealtimeSplineGraph(
                    title = "Download Stream Spline",
                    streamTag = if (connectionMode == "multi") "Multi-Socket Pipe" else "Single Stream Pipe",
                    themeColor = NeonCyan,
                    history = engineState.downloadSpeedHistory,
                    unit = unit
                )

                HorizontalDivider(color = Color.White.copy(alpha = 0.06f))

                RealtimeSplineGraph(
                    title = "Upload Stream Spline",
                    streamTag = "HTTP Streaming POST",
                    themeColor = NeonViolet,
                    history = engineState.uploadSpeedHistory,
                    unit = unit
                )
            }
        }

        // 6. Carrier Quality Indicators: Bufferbloat & VoIP MOS
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Bufferbloat Badge
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(DarkSurface)
                    .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("BUFFERBLOAT GRADE", fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = Color.White.copy(alpha = 0.5f))
                        Text(
                            text = "Grade ${engineState.bufferbloatGrade}",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = if (engineState.bufferbloatGrade.startsWith("A")) NeonEmerald else NeonAmber
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(NeonEmerald.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = engineState.bufferbloatGrade,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black,
                            color = NeonEmerald
                        )
                    }
                }
            }

            // VoIP MOS Badge
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(DarkSurface)
                    .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("VOIP MOS SCORE", fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = Color.White.copy(alpha = 0.5f))
                        Text(
                            text = "${engineState.voipMos ?: 4.35} / 4.5",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = NeonCyan
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(NeonCyan.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.PhoneInTalk, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }

        // 7. Verified Speed Certificate Banner
        latestResult?.let { res ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(NeonCyan.copy(alpha = 0.08f))
                    .border(1.dp, NeonCyan.copy(alpha = 0.35f), RoundedCornerShape(16.dp))
                    .clickable { onOpenCertificate(res) }
                    .padding(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Icon(Icons.Default.Verified, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(24.dp))
                        Column {
                            Text("Verified Speed Certificate Available", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text("Click to view cryptographic proof and export badge", fontSize = 10.sp, color = Color.White.copy(alpha = 0.6f))
                        }
                    }
                    Icon(Icons.Default.ArrowForward, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}
