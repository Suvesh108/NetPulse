package com.netpulse.speedtest

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netpulse.speedtest.data.HistoryRepository
import com.netpulse.speedtest.data.SettingsRepository
import com.netpulse.speedtest.model.SpeedTestResult
import com.netpulse.speedtest.theme.*
import com.netpulse.speedtest.ui.components.BottomCommandDock
import com.netpulse.speedtest.ui.components.NavTab
import com.netpulse.speedtest.ui.dialogs.SpeedCertificateDialog
import com.netpulse.speedtest.ui.screens.AuditHistoryScreen
import com.netpulse.speedtest.ui.screens.EdgeDiagnosticsScreen
import com.netpulse.speedtest.ui.screens.EngineConfigScreen
import com.netpulse.speedtest.ui.screens.SpeedCockpitScreen
import kotlinx.coroutines.launch

@Composable
fun NetPulseApp() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val historyRepository = remember { HistoryRepository(context) }
    val settingsRepository = remember { SettingsRepository(context) }

    val settings by settingsRepository.settingsFlow.collectAsState()
    val unit by settingsRepository.unitFlow.collectAsState()
    val isDarkTheme by settingsRepository.themeModeFlow.collectAsState()
    val historyList by historyRepository.historyFlow.collectAsState()

    var currentTab by remember { mutableStateOf(NavTab.SPEED) }
    var certificateTarget by remember { mutableStateOf<SpeedTestResult?>(null) }

    NetPulseTheme(darkTheme = isDarkTheme) {
        Scaffold(
            topBar = {
                // Precision Titanium Header Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .background(if (isDarkTheme) DarkBackground else LightBackground)
                        .border(
                            width = 1.dp,
                            color = if (isDarkTheme) Color.White.copy(alpha = 0.06f) else Color.Black.copy(alpha = 0.06f)
                        )
                        .padding(horizontal = 18.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Left Brand Identity
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.clickable { currentTab = NavTab.SPEED }
                    ) {
                        Box(
                            modifier = Modifier
                                .size(30.dp)
                                .clip(RoundedCornerShape(9.dp))
                                .background(
                                    Brush.linearGradient(
                                        listOf(NeonCyan.copy(alpha = 0.25f), NeonEmerald.copy(alpha = 0.15f))
                                    )
                                )
                                .border(1.dp, NeonCyan.copy(alpha = 0.4f), RoundedCornerShape(9.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Bolt,
                                contentDescription = "NetPulse Logo",
                                tint = NeonCyan,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Text(
                            text = "NetPulse",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.SansSerif,
                            color = if (isDarkTheme) TextPrimaryDark else TextPrimaryLight,
                            letterSpacing = (-0.5).sp
                        )

                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(NeonCyan.copy(alpha = 0.14f))
                                .border(1.dp, NeonCyan.copy(alpha = 0.35f), CircleShape)
                                .padding(horizontal = 7.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "v1.2",
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace,
                                color = NeonCyan
                            )
                        }
                    }

                    // Right Actions (Certificate quick launch & Theme toggle)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (historyList.isNotEmpty()) {
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(NeonCyan.copy(alpha = 0.14f))
                                    .border(1.dp, NeonCyan.copy(alpha = 0.35f), CircleShape)
                                    .clickable { certificateTarget = historyList.first() }
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(Icons.Default.Verified, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(12.dp))
                                    Text("Certificate", fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = NeonCyan)
                                }
                            }
                        }

                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(DarkSurface)
                                .border(1.dp, Color.White.copy(alpha = 0.12f), CircleShape)
                                .clickable { settingsRepository.toggleTheme() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                                contentDescription = "Toggle Theme",
                                tint = if (isDarkTheme) NeonAmber else Color.DarkGray,
                                modifier = Modifier.size(17.dp)
                            )
                        }
                    }
                }
            },
            bottomBar = {
                BottomCommandDock(
                    currentTab = currentTab,
                    onTabSelected = { currentTab = it },
                    historyBadgeCount = historyList.size,
                    modifier = Modifier.navigationBarsPadding()
                )
            },
            containerColor = MaterialTheme.colorScheme.background
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                // Directional Slide + Fade Screen Transitions
                AnimatedContent(
                    targetState = currentTab,
                    transitionSpec = {
                        if (targetState.ordinal > initialState.ordinal) {
                            (slideInHorizontally(animationSpec = tween(280)) { width -> width / 3 } + fadeIn(animationSpec = tween(240)))
                                .togetherWith(slideOutHorizontally(animationSpec = tween(240)) { width -> -width / 3 } + fadeOut(animationSpec = tween(200)))
                        } else {
                            (slideInHorizontally(animationSpec = tween(280)) { width -> -width / 3 } + fadeIn(animationSpec = tween(240)))
                                .togetherWith(slideOutHorizontally(animationSpec = tween(240)) { width -> width / 3 } + fadeOut(animationSpec = tween(200)))
                        }
                    },
                    label = "tabScreenTransition"
                ) { tab ->
                    when (tab) {
                        NavTab.SPEED -> SpeedCockpitScreen(
                            settings = settings,
                            unit = unit,
                            onUnitChanged = { settingsRepository.setUnit(it) },
                            onOpenCertificate = { certificateTarget = it },
                            onTestComplete = { scope.launch { historyRepository.addResult(it) } }
                        )
                        NavTab.DIAGNOSTICS -> EdgeDiagnosticsScreen()
                        NavTab.HISTORY -> AuditHistoryScreen(
                            repository = historyRepository,
                            unit = unit,
                            onOpenCertificate = { certificateTarget = it }
                        )
                        NavTab.SETTINGS -> EngineConfigScreen(
                            repository = settingsRepository
                        )
                    }
                }

                // Speed Certificate Dialog Modal
                certificateTarget?.let { target ->
                    SpeedCertificateDialog(
                        result = target,
                        unit = unit,
                        onDismiss = { certificateTarget = null }
                    )
                }
            }
        }
    }
}
