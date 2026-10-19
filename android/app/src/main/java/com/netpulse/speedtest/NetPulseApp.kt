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
                // Precision Warm Obsidian & Light Cream Header Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .background(if (isDarkTheme) DarkBackground else LightBackground)
                        .border(
                            width = 1.dp,
                            color = if (isDarkTheme) DarkBorder else LightBorder
                        )
                        .padding(horizontal = 18.dp, vertical = 11.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Left Brand Identity
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.clickable { currentTab = NavTab.SPEED }
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isDarkTheme) DarkSubpanel else LightSubpanel)
                                .border(1.dp, if (isDarkTheme) DarkBorderHighlight else LightBorder, RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Bolt,
                                contentDescription = "NetPulse Logo",
                                tint = if (isDarkTheme) LightCreamBright else TextPrimaryLight,
                                modifier = Modifier.size(19.dp)
                            )
                        }

                        Text(
                            text = "NetPulse",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.SansSerif,
                            color = if (isDarkTheme) TextPrimaryDark else TextPrimaryLight,
                            letterSpacing = (-0.6).sp
                        )

                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(if (isDarkTheme) DarkSubpanel else LightSubpanel)
                                .border(1.dp, if (isDarkTheme) DarkBorderHighlight else LightBorder, CircleShape)
                                .padding(horizontal = 7.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "v1.2",
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                color = if (isDarkTheme) LightCreamMuted else TextSecondaryLight
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
                                    .background(if (isDarkTheme) DarkSubpanel else LightSubpanel)
                                    .border(1.dp, if (isDarkTheme) DarkBorderHighlight else LightBorder, CircleShape)
                                    .clickable { certificateTarget = historyList.first() }
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(
                                        Icons.Default.Verified,
                                        contentDescription = null,
                                        tint = if (isDarkTheme) LightCream else TextPrimaryLight,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Text(
                                        "Certificate",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace,
                                        color = if (isDarkTheme) LightCream else TextPrimaryLight
                                    )
                                }
                            }
                        }

                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(if (isDarkTheme) DarkSubpanel else LightSubpanel)
                                .border(1.dp, if (isDarkTheme) DarkBorderHighlight else LightBorder, CircleShape)
                                .clickable {
                                    settingsRepository.toggleTheme()
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                                contentDescription = "Toggle Theme",
                                tint = if (isDarkTheme) LightCreamMuted else TextSecondaryLight,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            },
            bottomBar = {
                BottomCommandDock(
                    currentTab = currentTab,
                    onTabSelected = { currentTab = it },
                    historyBadgeCount = historyList.size
                )
            },
            containerColor = if (isDarkTheme) DarkBackground else LightBackground
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                // Directional Slide & Fade Tab Transition
                AnimatedContent(
                    targetState = currentTab,
                    transitionSpec = {
                        val direction = targetState.ordinal.compareTo(initialState.ordinal)
                        if (direction > 0) {
                            (slideInHorizontally(
                                initialOffsetX = { fullWidth -> (fullWidth * 0.15f).toInt() },
                                animationSpec = tween(220)
                            ) + fadeIn(animationSpec = tween(220)))
                                .togetherWith(
                                    slideOutHorizontally(
                                        targetOffsetX = { fullWidth -> (-fullWidth * 0.15f).toInt() },
                                        animationSpec = tween(180)
                                    ) + fadeOut(animationSpec = tween(180))
                                )
                        } else {
                            (slideInHorizontally(
                                initialOffsetX = { fullWidth -> (-fullWidth * 0.15f).toInt() },
                                animationSpec = tween(220)
                            ) + fadeIn(animationSpec = tween(220)))
                                .togetherWith(
                                    slideOutHorizontally(
                                        targetOffsetX = { fullWidth -> (fullWidth * 0.15f).toInt() },
                                        animationSpec = tween(180)
                                    ) + fadeOut(animationSpec = tween(180))
                                )
                        }
                    },
                    label = "tabTransition"
                ) { tab ->
                    when (tab) {
                        NavTab.SPEED -> SpeedCockpitScreen(
                            settings = settings,
                            unit = unit,
                            onUnitChanged = { newUnit ->
                                scope.launch { settingsRepository.setUnit(newUnit) }
                            },
                            onOpenCertificate = { result ->
                                certificateTarget = result
                            },
                            onTestComplete = { result ->
                                scope.launch {
                                    historyRepository.addResult(result)
                                }
                            }
                        )

                        NavTab.DIAGNOSTICS -> EdgeDiagnosticsScreen()

                        NavTab.HISTORY -> AuditHistoryScreen(
                            repository = historyRepository,
                            unit = unit,
                            onViewCertificate = { result ->
                                certificateTarget = result
                            }
                        )

                        NavTab.SETTINGS -> EngineConfigScreen(
                            repository = settingsRepository,
                            unit = unit,
                            onUnitChanged = { newUnit ->
                                scope.launch {
                                    settingsRepository.setUnit(newUnit)
                                }
                            }
                        )
                    }
                }
            }
        }

        // Speed Certificate Modal Dialog
        certificateTarget?.let { target ->
            SpeedCertificateDialog(
                result = target,
                unit = unit,
                onDismiss = { certificateTarget = null }
            )
        }
    }
}
