package com.netpulse.speedtest.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
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

    val activeSpeed = when (engineState.status) {
        TestStatus.DOWNLOADING -> engineState.downloadMbps ?: engineState.currentSpeedMbps
        TestStatus.UPLOADING -> engineState.uploadMbps ?: engineState.currentSpeedMbps
        TestStatus.COMPLETED -> engineState.downloadMbps ?: 0.0
        else -> 0.0
    }

    fun startSpeedTest() {
        if (isRunning) return
        engine.startTest(
            scope = scope,
            settings = settings.copy(connectionMode = connectionMode),
            onUpdate = { state -> engineState = state },
            onComplete = { result ->
                latestResult = result
                onTestComplete(result)
            }
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .padding(bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Sleek Floating Edge Capsule (Server + Mode + Unit)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(CircleShape)
                .background(DarkSurface)
                .border(
                    width = 1.dp,
                    color = DarkBorderHighlight,
                    shape = CircleShape
                )
                .padding(horizontal = 14.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Edge Node Indicator
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(if (isRunning) LightCream else SageGreen)
                )
                Column {
                    Text(
                        text = "Cloudflare Edge • Anycast",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.SansSerif,
                        color = LightCreamBright
                    )
                    Text(
                        text = "AS13335 • HTTP/3 QUIC",
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace,
                        color = LightCreamSubtle
                    )
                }
            }

            // Connection Mode & Unit Switchers
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Multi / Single toggle
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (connectionMode == "multi") DarkSubpanel else Color.Transparent)
                        .border(1.dp, if (connectionMode == "multi") DarkBorderHighlight else DarkBorder, CircleShape)
                        .clickable(enabled = !isRunning) {
                            connectionMode = if (connectionMode == "multi") "single" else "multi"
                        }
                        .padding(horizontal = 9.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = connectionMode.uppercase(),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        color = if (connectionMode == "multi") LightCream else LightCreamSubtle
                    )
                }

                // Unit Toggle: Mbps vs MB/s
                Row(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(DarkSubpanel)
                        .border(1.dp, DarkBorder, CircleShape)
                        .padding(2.dp)
                ) {
                    listOf("Mbps", "MB/s").forEach { u ->
                        val isSelected = unit == u
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(if (isSelected) LightCreamBright else Color.Transparent)
                                .clickable { onUnitChanged(u) }
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = u,
                                fontSize = 9.sp,
                                fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium,
                                fontFamily = FontFamily.Monospace,
                                color = if (isSelected) CreamDark else LightCreamSubtle
                            )
                        }
                    }
                }
            }
        }

        // 2. Hero Kinetic Speedometer with Integrated Central START Trigger
        SpeedGauge(
            speed = activeSpeed,
            unit = unit,
            phaseLabel = currentPhase,
            isRunning = isRunning,
            onStartTest = { startSpeedTest() }
        )

        // 3. Four-Card Telemetry Grid (Instant Metrics Glance)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Row 1: Download & Upload Peak Cards
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Download Card
                val dlVal = (engineState.downloadMbps ?: engineState.currentSpeedMbps) / factor
                TelemetryMetricCard(
                    modifier = Modifier.weight(1f),
                    title = "DOWNLOAD",
                    icon = Icons.Default.ArrowDownward,
                    accentColor = LightCream,
                    primaryValue = String.format(java.util.Locale.US, "%.1f", dlVal),
                    unit = unit,
                    subtitle = engineState.downloadLoadedLatencyMs?.let { "+${it}ms load" } ?: "Active saturation"
                )

                // Upload Card
                val ulVal = (engineState.uploadMbps ?: if (engineState.status == TestStatus.UPLOADING) engineState.currentSpeedMbps else 0.0) / factor
                TelemetryMetricCard(
                    modifier = Modifier.weight(1f),
                    title = "UPLOAD",
                    icon = Icons.Default.ArrowUpward,
                    accentColor = SlateBlue,
                    primaryValue = String.format(java.util.Locale.US, "%.1f", ulVal),
                    unit = unit,
                    subtitle = engineState.uploadLoadedLatencyMs?.let { "+${it}ms load" } ?: "Reverse bandwidth"
                )
            }

            // Row 2: Latency & Bufferbloat Grade Cards
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Ping & Jitter Card
                val pingVal = engineState.pingMs ?: 0
                val jitterVal = engineState.jitterMs ?: 0.0
                TelemetryMetricCard(
                    modifier = Modifier.weight(1f),
                    title = "PING / JITTER",
                    icon = Icons.Default.NetworkPing,
                    accentColor = WarmGold,
                    primaryValue = "$pingVal ms",
                    unit = "",
                    subtitle = "Jitter: ${String.format(java.util.Locale.US, "%.1f", jitterVal)} ms"
                )

                // Bufferbloat Letter Grade Card
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(18.dp))
                        .background(DarkSurface)
                        .border(1.dp, DarkBorderHighlight, RoundedCornerShape(18.dp))
                        .padding(13.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "BUFFERBLOAT",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                color = LightCreamSubtle,
                                letterSpacing = 0.6.sp
                            )
                            Icon(
                                imageVector = Icons.Default.Speed,
                                contentDescription = null,
                                tint = LightCreamMuted,
                                modifier = Modifier.size(14.dp)
                            )
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Grade Letter Box
                            val gradeColor = when (engineState.bufferbloatGrade) {
                                "A+", "A" -> SageGreen
                                "B" -> LightCream
                                "C" -> WarmGold
                                else -> Terracotta
                            }

                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(9.dp))
                                    .background(DarkSubpanel)
                                    .border(1.dp, gradeColor.copy(alpha = 0.5f), RoundedCornerShape(9.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = engineState.bufferbloatGrade,
                                    fontSize = 17.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace,
                                    color = gradeColor
                                )
                            }

                            Column {
                                Text(
                                    text = if (engineState.bufferbloatGrade in listOf("A+", "A")) "Minimal Bloat" else "Grade ${engineState.bufferbloatGrade}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.SansSerif,
                                    color = LightCreamBright
                                )
                                Text(
                                    text = "Loss: ${String.format(java.util.Locale.US, "%.1f", engineState.packetLossPct ?: 0.0)}%",
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = LightCreamSubtle
                                )
                            }
                        }
                    }
                }
            }
        }

        // 4. Real-Time Spline Spectrum Deck
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(DarkSurface)
                .border(1.dp, DarkBorderHighlight, RoundedCornerShape(18.dp))
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                RealtimeSplineGraph(
                    title = if (engineState.status == TestStatus.UPLOADING) "Upload Spectrum" else "Download Spectrum",
                    streamTag = if (engineState.status == TestStatus.UPLOADING) "TX Socket" else "RX Socket",
                    themeColor = if (engineState.status == TestStatus.UPLOADING) SlateBlue else LightCream,
                    history = if (engineState.status == TestStatus.UPLOADING) engineState.uploadSpeedHistory else engineState.downloadSpeedHistory,
                    unit = unit,
                    modifier = Modifier.fillMaxWidth().height(105.dp)
                )
            }
        }

        // 5. Test Completion Certificate Quick Launch Card
        AnimatedVisibility(
            visible = latestResult != null && !isRunning,
            enter = fadeIn(animationSpec = spring()) + expandVertically(animationSpec = spring()),
            exit = fadeOut() + shrinkVertically()
        ) {
            latestResult?.let { res ->
                val interaction = remember { MutableInteractionSource() }
                val isBtnPressed by interaction.collectIsPressedAsState()
                val btnScale by androidx.compose.animation.core.animateFloatAsState(
                    targetValue = if (isBtnPressed) 0.96f else 1f,
                    label = "certBtnScale"
                )

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .scale(btnScale)
                        .clip(RoundedCornerShape(18.dp))
                        .background(LightCreamBright)
                        .border(1.dp, Color.White.copy(alpha = 0.8f), RoundedCornerShape(18.dp))
                        .clickable(
                            interactionSource = interaction,
                            indication = null
                        ) { onOpenCertificate(res) }
                        .padding(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(DarkBackground),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.Verified,
                                    contentDescription = null,
                                    tint = LightCreamBright,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Column {
                                Text(
                                    "Verified Speed Certificate",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.SansSerif,
                                    color = CreamDark
                                )
                                Text(
                                    "Download: ${String.format(java.util.Locale.US, "%.1f", res.downloadMbps / factor)} $unit • Grade ${res.bufferbloatGrade}",
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = CreamDark.copy(alpha = 0.7f)
                                )
                            }
                        }

                        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = CreamDark)
                    }
                }
            }
        }
    }
}

@Composable
fun TelemetryMetricCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accentColor: Color,
    primaryValue: String,
    unit: String,
    subtitle: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(DarkSurface)
            .border(1.dp, DarkBorderHighlight, RoundedCornerShape(18.dp))
            .padding(13.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = LightCreamSubtle,
                    letterSpacing = 0.6.sp
                )
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(14.dp)
                )
            }

            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = primaryValue,
                    fontSize = 21.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.SansSerif,
                    color = LightCreamBright
                )
                if (unit.isNotEmpty()) {
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = unit,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = accentColor,
                        modifier = Modifier.padding(bottom = 2.dp)
                    )
                }
            }

            Text(
                text = subtitle,
                fontSize = 9.sp,
                fontFamily = FontFamily.Monospace,
                color = LightCreamSubtle
            )
        }
    }
}
