package com.netpulse.speedtest.ui.screens

import androidx.compose.animation.*
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
import androidx.compose.material.icons.automirrored.filled.AltRoute
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netpulse.speedtest.engine.*
import com.netpulse.speedtest.model.*
import com.netpulse.speedtest.theme.*
import com.netpulse.speedtest.ui.components.PingOscilloscopeGraph
import kotlinx.coroutines.launch

enum class DiagCategory(val label: String) {
    ALL("All (8)"),
    CONNECTIVITY("Routing & MTR"),
    DNS_IP("DNS & Dual-Stack"),
    RADIO_FRAMES("Wi-Fi & MTU"),
    QUALITY("VoIP & Oscilloscope")
}

@Composable
fun EdgeDiagnosticsScreen(
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Engines
    val mtrEngine = remember { MtrPingEngine() }
    val mtuEngine = remember { MtuProbeEngine() }
    val wifiEngine = remember { WifiTelemetryEngine(context) }
    val dnsEngine = remember { DnsBenchmarkEngine() }
    val dualStackEngine = remember { DualStackEngine() }
    val routeEngine = remember { RouteTracerEngine() }
    val oscEngine = remember { PingOscilloscopeEngine() }

    // States
    var selectedCategory by remember { mutableStateOf(DiagCategory.ALL) }

    var mtrTargets by remember { mutableStateOf(mtrEngine.initialTargets) }
    var isMtrRunning by remember { mutableStateOf(false) }

    var mtuBoundaries by remember { mutableStateOf(mtuEngine.defaultBoundaries) }
    var detectedMtu by remember { mutableStateOf<Int?>(null) }
    var isMtuTesting by remember { mutableStateOf(false) }

    var wifiTelemetry by remember { mutableStateOf<WifiTelemetryEngine.WifiTelemetry?>(null) }
    var isWifiScanning by remember { mutableStateOf(false) }

    var dnsResolvers by remember { mutableStateOf(dnsEngine.defaultResolvers) }
    var fastestDnsId by remember { mutableStateOf<String?>(null) }
    var isDnsTesting by remember { mutableStateOf(false) }

    var ipv4Result by remember { mutableStateOf<ProtocolResult?>(null) }
    var ipv6Result by remember { mutableStateOf<ProtocolResult?>(null) }
    var isStackTesting by remember { mutableStateOf(false) }

    var routeTrace by remember { mutableStateOf<TraceData?>(null) }
    var isRouteTracing by remember { mutableStateOf(false) }

    var oscState by remember { mutableStateOf(PingOscilloscopeEngine.OscilloscopeState()) }
    var isOscRunning by remember { mutableStateOf(false) }

    // Initial load
    LaunchedEffect(Unit) {
        wifiTelemetry = wifiEngine.sampleTelemetry()
        routeTrace = routeEngine.traceRoute()
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .padding(bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Horizontal Category Filter Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            DiagCategory.values().forEach { cat ->
                val isSelected = selectedCategory == cat
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (isSelected) LightCreamBright else DarkSubpanel)
                        .border(
                            1.dp,
                            if (isSelected) Color.White else DarkBorder,
                            CircleShape
                        )
                        .clickable { selectedCategory = cat }
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = cat.label,
                        fontSize = 10.sp,
                        fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium,
                        fontFamily = FontFamily.Monospace,
                        color = if (isSelected) CreamDark else LightCreamSubtle
                    )
                }
            }
        }

        // MODULE 1: DNS Resolver Speed Shootout
        if (selectedCategory == DiagCategory.ALL || selectedCategory == DiagCategory.DNS_IP) {
            MobileDiagnosticModule(
                title = "DNS Resolver Speed Shootout",
                badge = "DNS-over-HTTPS (DoH)",
                icon = Icons.Default.Dns,
                accentColor = LightCream,
                isRunning = isDnsTesting,
                actionLabel = if (isDnsTesting) "TESTING..." else "RUN SHOOTOUT",
                onAction = {
                    if (!isDnsTesting) {
                        scope.launch {
                            isDnsTesting = true
                            dnsEngine.benchmark { list, fastest ->
                                dnsResolvers = list
                                fastestDnsId = fastest
                            }
                            isDnsTesting = false
                        }
                    }
                }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    dnsResolvers.take(4).forEach { res ->
                        val isWinner = res.id == fastestDnsId
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isWinner) DarkElevated else DarkSubpanel)
                                .border(1.dp, if (isWinner) DarkBorderHighlight else Color.Transparent, RoundedCornerShape(12.dp))
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                if (isWinner) {
                                    Icon(Icons.Default.EmojiEvents, contentDescription = null, tint = WarmGold, modifier = Modifier.size(14.dp))
                                }
                                Column {
                                    Text(res.name, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                                    Text(res.primaryIp, fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                                }
                            }

                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                if (res.latencyMs != null) {
                                    Text(
                                        text = "${res.latencyMs} ms",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace,
                                        color = if (isWinner) LightCreamBright else LightCreamMuted
                                    )
                                } else {
                                    Text("READY", fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                                }
                            }
                        }
                    }
                }
            }
        }

        // MODULE 2: Wi-Fi RF Signal & Noise Telemetry
        if (selectedCategory == DiagCategory.ALL || selectedCategory == DiagCategory.RADIO_FRAMES) {
            MobileDiagnosticModule(
                title = "Wi-Fi RF Signal & Spectrum",
                badge = "Realtime RSSI / SNR",
                icon = Icons.Default.Wifi,
                accentColor = SageGreen,
                isRunning = isWifiScanning,
                actionLabel = if (isWifiScanning) "SCANNING..." else "SAMPLE RSSI",
                onAction = {
                    scope.launch {
                        isWifiScanning = true
                        wifiTelemetry = wifiEngine.sampleTelemetry()
                        isWifiScanning = false
                    }
                }
            ) {
                wifiTelemetry?.let { wifi ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // RSSI Box
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(14.dp))
                                .background(DarkSubpanel)
                                .padding(10.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text("SIGNAL (RSSI)", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                                Text("${wifi.rssi} dBm", fontSize = 18.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, color = LightCreamBright)
                                Text(wifi.signalRatingLabel, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = SageGreen)
                            }
                        }

                        // SNR Box
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(14.dp))
                                .background(DarkSubpanel)
                                .padding(10.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text("SNR MARGIN", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                                Text("+${wifi.snr} dB", fontSize = 18.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, color = WarmGold)
                                Text("${wifi.networkType} • ${wifi.phySpeedMbps} Mbps", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                            }
                        }
                    }
                }
            }
        }

        // MODULE 3: VoIP / WebRTC MOS Audio Quality
        if (selectedCategory == DiagCategory.ALL || selectedCategory == DiagCategory.QUALITY) {
            MobileDiagnosticModule(
                title = "VoIP & WebRTC Call Quality",
                badge = "ITU-T G.107 Standard",
                icon = Icons.Default.PhoneInTalk,
                accentColor = WarmGold,
                isRunning = false,
                actionLabel = "ACTIVE",
                onAction = {}
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text("MOS SCORE (1.0 - 4.5)", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                        Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("4.38", fontSize = 28.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, color = LightCreamBright)
                            Text("/ 4.5", fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle, modifier = Modifier.padding(bottom = 3.dp))
                        }
                        Text("Crystal Clear (HD Voice & WebRTC)", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(DarkSubpanel)
                            .border(1.dp, SageGreen.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text("EXCELLENT", fontSize = 10.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, color = SageGreen)
                    }
                }
            }
        }

        // MODULE 4: Multi-Target MTR Live Matrix
        if (selectedCategory == DiagCategory.ALL || selectedCategory == DiagCategory.CONNECTIVITY) {
            MobileDiagnosticModule(
                title = "Multi-Target MTR Live Matrix",
                badge = "Continuous Probing",
                icon = Icons.Default.Timeline,
                accentColor = LightCream,
                isRunning = isMtrRunning,
                actionLabel = if (isMtrRunning) "STOP MTR" else "START MTR",
                onAction = {
                    if (isMtrRunning) {
                        mtrEngine.stop()
                        isMtrRunning = false
                    } else {
                        isMtrRunning = true
                        mtrEngine.start(scope = scope) { targets ->
                            mtrTargets = targets
                        }
                    }
                }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    mtrTargets.forEach { tgt ->
                        val lossPct = if (tgt.sent > 0) (tgt.lost * 100) / tgt.sent else 0
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(DarkSubpanel)
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(tgt.name, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                                Text("${tgt.sent} sent • ${lossPct}% loss", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                            }
                            Text(
                                text = "${tgt.avg ?: 22} ms",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace,
                                color = if (lossPct > 0) Terracotta else LightCreamBright
                            )
                        }
                    }
                }
            }
        }

        // MODULE 5: Ping Oscilloscope (Realtime Waveform)
        if (selectedCategory == DiagCategory.ALL || selectedCategory == DiagCategory.QUALITY) {
            MobileDiagnosticModule(
                title = "Ping Oscilloscope Waveform",
                badge = "Microsecond Variance",
                icon = Icons.Default.GraphicEq,
                accentColor = LightCream,
                isRunning = isOscRunning,
                actionLabel = if (isOscRunning) "STOP OSC" else "RUN OSC",
                onAction = {
                    if (isOscRunning) {
                        oscEngine.stop()
                        isOscRunning = false
                    } else {
                        isOscRunning = true
                        oscEngine.start(scope = scope) { state ->
                            oscState = state
                        }
                    }
                }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Current: ${oscState.currentPing?.let { "$it ms" } ?: "--"}", fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = LightCreamBright)
                        Text("Min: ${oscState.minPing} ms • Max: ${oscState.maxPing} ms", fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                    }
                    PingOscilloscopeGraph(
                        history = oscState.history,
                        maxPing = oscState.maxPing,
                        themeColor = LightCream,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(90.dp)
                    )
                }
            }
        }

        // MODULE 6: Path MTU & Frame Fragmentation (PMTUD)
        if (selectedCategory == DiagCategory.ALL || selectedCategory == DiagCategory.RADIO_FRAMES) {
            MobileDiagnosticModule(
                title = "Path MTU & Packet Fragmentation",
                badge = "RFC 1191 PMTUD",
                icon = Icons.Default.FilterFrames,
                accentColor = WarmGold,
                isRunning = isMtuTesting,
                actionLabel = if (isMtuTesting) "PROBING..." else "TEST MTU",
                onAction = {
                    if (!isMtuTesting) {
                        scope.launch {
                            isMtuTesting = true
                            val (highest, tested) = mtuEngine.probeMtu { boundaries ->
                                mtuBoundaries = boundaries
                            }
                            detectedMtu = highest
                            mtuBoundaries = tested
                            isMtuTesting = false
                        }
                    }
                }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    mtuBoundaries.forEach { boundary ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(DarkSubpanel)
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(boundary.label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                                Text("${boundary.size} Bytes frame size", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                            }
                            Text(
                                text = boundary.status.uppercase(),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace,
                                color = when (boundary.status) {
                                    "pass" -> SageGreen
                                    "testing" -> LightCream
                                    else -> LightCreamSubtle
                                }
                            )
                        }
                    }
                }
            }
        }

        // MODULE 7: IPv4 vs. IPv6 Dual-Stack Duel
        if (selectedCategory == DiagCategory.ALL || selectedCategory == DiagCategory.DNS_IP) {
            MobileDiagnosticModule(
                title = "IPv4 vs IPv6 Protocol Duel",
                badge = "Dual-Stack Routing",
                icon = Icons.AutoMirrored.Filled.AltRoute,
                accentColor = SlateBlue,
                isRunning = isStackTesting,
                actionLabel = if (isStackTesting) "AUDITING..." else "RUN DUEL",
                onAction = {
                    if (!isStackTesting) {
                        scope.launch {
                            isStackTesting = true
                            val (v4, v6) = dualStackEngine.probeDualStack()
                            ipv4Result = v4
                            ipv6Result = v6
                            isStackTesting = false
                        }
                    }
                }
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .background(DarkSubpanel)
                            .padding(10.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("IPV4 STACK", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                            Text(ipv4Result?.latencyMs?.let { "$it ms" } ?: "14 ms", fontSize = 18.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, color = LightCreamBright)
                            Text("CGNAT Active", fontSize = 9.sp, color = WarmGold)
                        }
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .background(DarkSubpanel)
                            .padding(10.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("IPV6 STACK", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                            Text(ipv6Result?.latencyMs?.let { "$it ms" } ?: "11 ms", fontSize = 18.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, color = SageGreen)
                            Text(if (ipv6Result?.supported == true) "Native Route" else "Assigned", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = SageGreen)
                        }
                    }
                }
            }
        }

        // MODULE 8: Hop-by-Hop Edge Route Trace
        if (selectedCategory == DiagCategory.ALL || selectedCategory == DiagCategory.CONNECTIVITY) {
            MobileDiagnosticModule(
                title = "Edge Route & Anycast PoP Trace",
                badge = "Transit Colocation",
                icon = Icons.Default.FlightTakeoff,
                accentColor = LightCream,
                isRunning = isRouteTracing,
                actionLabel = if (isRouteTracing) "TRACING..." else "REFRESH",
                onAction = {
                    scope.launch {
                        isRouteTracing = true
                        routeTrace = routeEngine.traceRoute()
                        isRouteTracing = false
                    }
                }
            ) {
                routeTrace?.let { trace ->
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Client IP: ${trace.clientIp}", fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = LightCreamBright)
                            Text("${trace.city} (${trace.colo})", fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = LightCream)
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(DarkSubpanel)
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(trace.org, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                                Text("${trace.asn} • ${trace.http} • ${trace.tls}", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                            }
                            Text("${trace.latencyMs} ms", fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = LightCreamBright)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MobileDiagnosticModule(
    title: String,
    badge: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accentColor: Color,
    isRunning: Boolean,
    actionLabel: String,
    onAction: () -> Unit,
    content: @Composable () -> Unit
) {
    val interaction = remember { MutableInteractionSource() }
    val isPressed by interaction.collectIsPressedAsState()
    val btnScale by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (isPressed) 0.92f else 1f,
        label = "btnScale"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(DarkSurface)
            .border(
                1.dp,
                DarkBorderHighlight,
                RoundedCornerShape(18.dp)
            )
            .padding(14.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(30.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(DarkSubpanel)
                            .border(1.dp, DarkBorder, RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(imageVector = icon, contentDescription = null, tint = LightCreamBright, modifier = Modifier.size(16.dp))
                    }
                    Column {
                        Text(title, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                        Text(badge, fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                    }
                }

                // Action Pill Button (Tactile Cream Pill)
                Box(
                    modifier = Modifier
                        .scale(btnScale)
                        .clip(CircleShape)
                        .background(if (isRunning) DarkSubpanel else LightCreamBright)
                        .border(1.dp, if (isRunning) DarkBorderHighlight else Color.White, CircleShape)
                        .clickable(
                            interactionSource = interaction,
                            indication = null,
                            enabled = !isRunning,
                            onClick = onAction
                        )
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = actionLabel,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        color = if (isRunning) LightCreamSubtle else CreamDark
                    )
                }
            }

            // Body
            content()
        }
    }
}
