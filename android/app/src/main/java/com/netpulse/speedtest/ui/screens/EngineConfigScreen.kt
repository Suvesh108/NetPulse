package com.netpulse.speedtest.ui.screens

import android.widget.Toast
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import com.netpulse.speedtest.data.SettingsRepository
import com.netpulse.speedtest.model.EngineBackend
import com.netpulse.speedtest.model.RoutingProtocol
import com.netpulse.speedtest.model.SimulationSettings
import com.netpulse.speedtest.theme.*

@Composable
fun EngineConfigScreen(
    repository: SettingsRepository,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val settings by repository.settingsFlow.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 14.dp, vertical = 10.dp)
            .padding(bottom = 90.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Section 1: Measurement Engine Backend
        ConfigSectionHeader(title = "Engine Backend Infrastructure", subtitle = "Select global edge CDN endpoint")
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            EngineBackend.values().forEach { backend ->
                val isSelected = settings.engineBackend == backend
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (isSelected) NeonCyan.copy(alpha = 0.1f) else DarkSurface)
                        .border(1.dp, if (isSelected) NeonCyan else DarkBorder, RoundedCornerShape(14.dp))
                        .clickable { repository.updateSettings(settings.copy(engineBackend = backend)) }
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(backend.displayName, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Text(backend.badge, fontSize = 8.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, color = NeonCyan)
                            }
                            Text(backend.pops, fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = Color.White.copy(alpha = 0.5f))
                        }
                        RadioButton(
                            selected = isSelected,
                            onClick = { repository.updateSettings(settings.copy(engineBackend = backend)) },
                            colors = RadioButtonDefaults.colors(selectedColor = NeonCyan)
                        )
                    }
                }
            }
        }

        // Section 2: Routing Protocol Layer
        ConfigSectionHeader(title = "Transport & Routing Protocol", subtitle = "Network layer handshake and stream multiplexing")
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            RoutingProtocol.values().forEach { proto ->
                val isSelected = settings.routingProtocol == proto
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (isSelected) NeonViolet.copy(alpha = 0.1f) else DarkSurface)
                        .border(1.dp, if (isSelected) NeonViolet else DarkBorder, RoundedCornerShape(14.dp))
                        .clickable { repository.updateSettings(settings.copy(routingProtocol = proto)) }
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(proto.icon, fontSize = 14.sp)
                                Text(proto.displayName, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                            Text(proto.speedTag, fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = NeonViolet)
                        }
                        RadioButton(
                            selected = isSelected,
                            onClick = { repository.updateSettings(settings.copy(routingProtocol = proto)) },
                            colors = RadioButtonDefaults.colors(selectedColor = NeonViolet)
                        )
                    }
                }
            }
        }

        // Section 3: Telemetry Stream Parameters
        ConfigSectionHeader(title = "Stream Concurrency & Telemetry", subtitle = "Configure measurement probe density")
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(DarkSurface)
                .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                // Connection Mode Toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Connection Mode", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text(if (settings.connectionMode == "multi") "Multi-Socket Parallel Streaming" else "Single Persistent TCP Stream", fontSize = 10.sp, color = Color.White.copy(alpha = 0.5f))
                    }
                    Switch(
                        checked = settings.connectionMode == "multi",
                        onCheckedChange = { isMulti ->
                            repository.updateSettings(settings.copy(connectionMode = if (isMulti) "multi" else "single"))
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = NeonCyan, checkedTrackColor = NeonCyan.copy(alpha = 0.3f))
                    )
                }

                HorizontalDivider(color = Color.White.copy(alpha = 0.06f))

                // Measure Download Loaded Latency
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Measure Download Bufferbloat", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("Continuously probe RTT under max download saturation", fontSize = 10.sp, color = Color.White.copy(alpha = 0.5f))
                    }
                    Switch(
                        checked = settings.measureDownloadLoadedLatency,
                        onCheckedChange = { checked ->
                            repository.updateSettings(settings.copy(measureDownloadLoadedLatency = checked))
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = NeonCyan, checkedTrackColor = NeonCyan.copy(alpha = 0.3f))
                    )
                }

                HorizontalDivider(color = Color.White.copy(alpha = 0.06f))

                // Measure Upload Loaded Latency
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Measure Upload Bufferbloat", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("Track queue delays while uploading chunks", fontSize = 10.sp, color = Color.White.copy(alpha = 0.5f))
                    }
                    Switch(
                        checked = settings.measureUploadLoadedLatency,
                        onCheckedChange = { checked ->
                            repository.updateSettings(settings.copy(measureUploadLoadedLatency = checked))
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = NeonViolet, checkedTrackColor = NeonViolet.copy(alpha = 0.3f))
                    )
                }
            }
        }

        // Section 4: Automated Background Watchdog
        ConfigSectionHeader(title = "Automated Carrier SLA Watchdog", subtitle = "Background network health auditing & degradation alerts")
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(DarkSurface)
                .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Enable Scheduled Watchdog", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("Periodic background audits every ${settings.scheduledIntervalHours} hours", fontSize = 10.sp, color = Color.White.copy(alpha = 0.5f))
                    }
                    Switch(
                        checked = settings.autoScheduled,
                        onCheckedChange = { checked ->
                            repository.updateSettings(settings.copy(autoScheduled = checked))
                            if (checked) {
                                Toast.makeText(context, "Carrier Watchdog Enabled", Toast.LENGTH_SHORT).show()
                            }
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = NeonEmerald, checkedTrackColor = NeonEmerald.copy(alpha = 0.3f))
                    )
                }

                Text(
                    text = "MINIMUM SPEED SLA THRESHOLD: ${settings.scheduledThresholdMbps} Mbps",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = NeonAmber
                )
            }
        }

        // Section 5: In-App OTA Engine Update
        ConfigSectionHeader(title = "In-App OTA Engine Update", subtitle = "Direct background firmware and speed engine updates")
        var isCheckingUpdate by remember { mutableStateOf(false) }
        var isDownloadingUpdate by remember { mutableStateOf(false) }
        var updateProgress by remember { mutableStateOf(0) }
        var updateInfo by remember { mutableStateOf<com.netpulse.speedtest.updater.AppUpdater.UpdateInfo?>(null) }
        var updateStatusMsg by remember { mutableStateOf("NetPulse v1.1.0 is up to date") }
        val updateScope = rememberCoroutineScope()

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(DarkSurface)
                .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Current Version: v1.1.0", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text(updateStatusMsg, fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = if (updateInfo?.hasUpdate == true) NeonCyan else Color.White.copy(alpha = 0.5f))
                    }

                    if (!isDownloadingUpdate) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(NeonCyan.copy(alpha = 0.15f))
                                .border(1.dp, NeonCyan.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                                .clickable(enabled = !isCheckingUpdate) {
                                    updateScope.launch {
                                        isCheckingUpdate = true
                                        updateStatusMsg = "Checking GitHub release channel..."
                                        val info = com.netpulse.speedtest.updater.AppUpdater.checkForUpdate("v1.1")
                                        updateInfo = info
                                        isCheckingUpdate = false
                                        updateStatusMsg = if (info.hasUpdate) {
                                            "New update available: ${info.latestVersion}"
                                        } else {
                                            "NetPulse v1.1.0 is up to date"
                                        }
                                    }
                                }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = if (isCheckingUpdate) "CHECKING..." else "CHECK UPDATE",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                color = NeonCyan
                            )
                        }
                    }
                }

                // Download & Install Action when update is found
                if (updateInfo?.hasUpdate == true || isDownloadingUpdate) {
                    HorizontalDivider(color = Color.White.copy(alpha = 0.06f))
                    if (isDownloadingUpdate) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Downloading latest update...", fontSize = 10.sp, color = Color.White.copy(alpha = 0.7f))
                                Text("$updateProgress%", fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = NeonCyan)
                            }
                            LinearProgressIndicator(
                                progress = { updateProgress / 100f },
                                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                                color = NeonCyan,
                                trackColor = Color.White.copy(alpha = 0.1f)
                            )
                        }
                    } else {
                        Button(
                            onClick = {
                                updateScope.launch {
                                    isDownloadingUpdate = true
                                    com.netpulse.speedtest.updater.AppUpdater.downloadAndInstall(
                                        context = context,
                                        apkUrl = updateInfo!!.downloadUrl,
                                        onProgress = { updateProgress = it },
                                        onError = {
                                            isDownloadingUpdate = false
                                            updateStatusMsg = "Update failed: $it"
                                        }
                                    )
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = NeonCyan, contentColor = Color.Black),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth().height(42.dp)
                        ) {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("DOWNLOAD & INSTALL LATEST UPDATE", fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ConfigSectionHeader(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text(subtitle, fontSize = 10.sp, color = Color.White.copy(alpha = 0.5f))
    }
}
