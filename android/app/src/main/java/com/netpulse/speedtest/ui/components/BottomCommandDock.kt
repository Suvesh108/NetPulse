package com.netpulse.speedtest.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netpulse.speedtest.theme.*

enum class NavTab(val title: String, val icon: ImageVector) {
    SPEED("Speed", Icons.Default.Bolt),
    DIAGNOSTICS("Edge", Icons.Default.Assessment),
    HISTORY("History", Icons.Default.History),
    SETTINGS("Config", Icons.Default.Settings)
}

@Composable
fun BottomCommandDock(
    currentTab: NavTab,
    onTabSelected: (NavTab) -> Unit,
    historyBadgeCount: Int = 0,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(CircleShape)
                .background(DarkSurface.copy(alpha = 0.92f))
                .border(
                    width = 1.dp,
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.18f),
                            Color.White.copy(alpha = 0.05f)
                        )
                    ),
                    shape = CircleShape
                )
                .padding(horizontal = 6.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            NavTab.values().forEach { tab ->
                val isSelected = currentTab == tab
                val interactionSource = remember { MutableInteractionSource() }
                val isPressed by interactionSource.collectIsPressedAsState()
                val tabScale by animateFloatAsState(
                    targetValue = if (isPressed) 0.90f else 1f,
                    animationSpec = spring(dampingRatio = 0.6f, stiffness = 500f),
                    label = "tabScale"
                )

                val tint by animateColorAsState(
                    targetValue = if (isSelected) NeonCyan else TextSecondaryDark,
                    animationSpec = spring(dampingRatio = 0.8f, stiffness = 300f),
                    label = "tint"
                )

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .scale(tabScale)
                        .clip(CircleShape)
                        .then(
                            if (isSelected) {
                                Modifier.background(
                                    Brush.verticalGradient(
                                        colors = listOf(
                                            NeonCyan.copy(alpha = 0.22f),
                                            NeonCyan.copy(alpha = 0.08f)
                                        )
                                    )
                                )
                            } else Modifier
                        )
                        .border(
                            width = 1.dp,
                            color = if (isSelected) NeonCyan.copy(alpha = 0.35f) else Color.Transparent,
                            shape = CircleShape
                        )
                        .clickable(
                            interactionSource = interactionSource,
                            indication = null
                        ) { onTabSelected(tab) }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = tab.icon,
                                contentDescription = tab.title,
                                tint = tint,
                                modifier = Modifier.size(20.dp)
                            )
                            if (tab == NavTab.HISTORY && historyBadgeCount > 0) {
                                Box(
                                    modifier = Modifier
                                        .offset(x = 10.dp, y = (-4).dp)
                                        .size(14.dp)
                                        .clip(CircleShape)
                                        .background(NeonCyan),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = if (historyBadgeCount > 99) "99+" else "$historyBadgeCount",
                                        fontSize = 7.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color.Black
                                    )
                                }
                            }
                        }

                        Text(
                            text = tab.title,
                            fontSize = 10.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = tint,
                            letterSpacing = 0.4.sp
                        )
                    }
                }
            }
        }
    }
}
