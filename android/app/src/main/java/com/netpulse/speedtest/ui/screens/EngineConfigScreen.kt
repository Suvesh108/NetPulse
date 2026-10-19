package com.netpulse.speedtest.ui.screens

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netpulse.speedtest.data.SettingsRepository
import com.netpulse.speedtest.model.EngineBackend
import com.netpulse.speedtest.model.RoutingProtocol
import com.netpulse.speedtest.theme.*
import kotlinx.coroutines.launch

@Composable
fun EngineConfigScreen(
    repository: SettingsRepository,
    unit: String,
    onUnitChanged: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val settings by repository.settingsFlow.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .padding(bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Section 1: Engine Backend Infrastructure
        ConfigGroup(title = "Engine Infrastructure", subtitle = "Global edge Anycast backbone endpoints") {
            EngineBackend.values().forEach { backend ->
                val isSelected = settings.engineBackend == backend
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (isSelected) DarkElevated else DarkSubpanel)
                        .border(1.dp, if (isSelected) DarkBorderHighlight else Color.Transparent, RoundedCornerShape(14.dp))
                        .clickable { repository.updateSettings(settings.copy(engineBackend = backend)) }
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(backend.displayName, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                            Text(backend.badge, fontSize = 8.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, color = LightCream)
                        }
                        Text(backend.pops, fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                    }

                    RadioButton(
                        selected = isSelected,
                        onClick = { repository.updateSettings(settings.copy(engineBackend = backend)) },
                        colors = RadioButtonDefaults.colors(selectedColor = LightCreamBright, unselectedColor = LightCreamSubtle)
                    )
                }
            }
        }

        // Section 2: Transport & Routing Protocol
        ConfigGroup(title = "Transport Protocol", subtitle = "Socket multiplexing and TLS handshake layers") {
            RoutingProtocol.values().forEach { proto ->
                val isSelected = settings.routingProtocol == proto
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (isSelected) DarkElevated else DarkSubpanel)
                        .border(1.dp, if (isSelected) DarkBorderHighlight else Color.Transparent, RoundedCornerShape(14.dp))
                        .clickable { repository.updateSettings(settings.copy(routingProtocol = proto)) }
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(proto.displayName, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                            Text(proto.speedTag, fontSize = 8.sp, fontFamily = FontFamily.Monospace, color = WarmGold)
                        }
                        Text("Transport: ${proto.idName}", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                    }

                    RadioButton(
                        selected = isSelected,
                        onClick = { repository.updateSettings(settings.copy(routingProtocol = proto)) },
                        colors = RadioButtonDefaults.colors(selectedColor = LightCreamBright, unselectedColor = LightCreamSubtle)
                    )
                }
            }
        }

        // Section 3: Telemetry Probes & Bufferbloat Toggles
        ConfigGroup(title = "Telemetry & Probing Density", subtitle = "Packet probe density and bufferbloat loaded delay") {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Packet Probe Track", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                    Text("${settings.packetProbesCount} Probes", fontSize = 12.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, color = LightCreamBright)
                }

                Slider(
                    value = settings.packetProbesCount.toFloat(),
                    onValueChange = { repository.updateSettings(settings.copy(packetProbesCount = it.toInt())) },
                    valueRange = 10f..50f,
                    steps = 7,
                    colors = SliderDefaults.colors(
                        thumbColor = LightCreamBright,
                        activeTrackColor = LightCreamBright,
                        inactiveTrackColor = DarkSubpanel
                    )
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("10 (Fast)", fontSize = 8.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                    Text("50 (Deep Matrix)", fontSize = 8.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                }
            }
        }

        // Section 4: Native In-App OTA Firmware & Engine Update
        ConfigGroup(title = "In-App OTA Engine Update", subtitle = "Automatic background firmware & engine updates") {
            var isCheckingUpdate by remember { mutableStateOf(false) }
            var isDownloadingUpdate by remember { mutableStateOf(false) }
            var updateProgress by remember { mutableStateOf(0) }
            var updateInfo by remember { mutableStateOf<com.netpulse.speedtest.updater.AppUpdater.UpdateInfo?>(null) }
            var updateStatusMsg by remember { mutableStateOf("NetPulse v1.2.0 is up to date") }
            val updateScope = rememberCoroutineScope()

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Current Version: v1.2.0", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                        Text(updateStatusMsg, fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = if (updateInfo?.hasUpdate == true) LightCream else LightCreamSubtle)
                    }

                    if (!isDownloadingUpdate) {
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(LightCreamBright)
                                .clickable(enabled = !isCheckingUpdate) {
                                    updateScope.launch {
                                        isCheckingUpdate = true
                                        updateStatusMsg = "Checking GitHub release channel..."
                                        val info = com.netpulse.speedtest.updater.AppUpdater.checkForUpdate("v1.2")
                                        updateInfo = info
                                        isCheckingUpdate = false
                                        updateStatusMsg = if (info.hasUpdate) {
                                            "New update available: ${info.latestVersion}"
                                        } else {
                                            "NetPulse v1.2.0 is up to date"
                                        }
                                    }
                                }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = if (isCheckingUpdate) "CHECKING..." else "CHECK UPDATE",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace,
                                color = CreamDark
                            )
                        }
                    }
                }

                // Download & Install Action when update is found
                if (updateInfo?.hasUpdate == true || isDownloadingUpdate) {
                    HorizontalDivider(color = DarkBorder)
                    if (isDownloadingUpdate) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Downloading latest release...", fontSize = 10.sp, color = LightCreamBright)
                                Text("$updateProgress%", fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = LightCreamBright)
                            }
                            LinearProgressIndicator(
                                progress = { updateProgress / 100f },
                                modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
                                color = LightCreamBright,
                                trackColor = DarkSubpanel
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
                            colors = ButtonDefaults.buttonColors(containerColor = LightCreamBright, contentColor = CreamDark),
                            shape = CircleShape,
                            modifier = Modifier.fillMaxWidth().height(42.dp)
                        ) {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("DOWNLOAD & INSTALL UPDATE", fontSize = 11.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ConfigGroup(
    title: String,
    subtitle: String,
    content: @Composable ColumnScope.() -> Unit
) {
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
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                Text(subtitle, fontSize = 10.sp, color = LightCreamSubtle)
            }
            HorizontalDivider(color = DarkBorder)
            content()
        }
    }
}
