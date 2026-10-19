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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
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
                .background(DarkSurface.copy(alpha = 0.96f))
                .border(
                    width = 1.dp,
                    color = DarkBorderHighlight,
                    shape = CircleShape
                )
                .padding(horizontal = 5.dp, vertical = 5.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            NavTab.values().forEach { tab ->
                val isSelected = currentTab == tab
                val interactionSource = remember { MutableInteractionSource() }
                val isPressed by interactionSource.collectIsPressedAsState()
                val tabScale by animateFloatAsState(
                    targetValue = if (isPressed) 0.91f else 1f,
                    animationSpec = spring(dampingRatio = 0.65f, stiffness = 450f),
                    label = "tabScale"
                )

                val bgColor by animateColorAsState(
                    targetValue = if (isSelected) LightCreamBright else Color.Transparent,
                    animationSpec = spring(dampingRatio = 0.8f, stiffness = 320f),
                    label = "tabBg"
                )

                val contentColor by animateColorAsState(
                    targetValue = if (isSelected) CreamDark else LightCreamSubtle,
                    animationSpec = spring(dampingRatio = 0.8f, stiffness = 320f),
                    label = "tabContentColor"
                )

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .scale(tabScale)
                        .clip(CircleShape)
                        .background(bgColor)
                        .clickable(
                            interactionSource = interactionSource,
                            indication = null
                        ) { onTabSelected(tab) }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp),
                        modifier = Modifier.padding(horizontal = 8.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = tab.icon,
                                contentDescription = tab.title,
                                tint = contentColor,
                                modifier = Modifier.size(17.dp)
                            )
                            if (tab == NavTab.HISTORY && historyBadgeCount > 0) {
                                Box(
                                    modifier = Modifier
                                        .offset(x = 8.dp, y = (-4).dp)
                                        .size(12.dp)
                                        .clip(CircleShape)
                                        .background(Terracotta),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = if (historyBadgeCount > 9) "9+" else "$historyBadgeCount",
                                        fontSize = 7.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace,
                                        color = LightCreamBright
                                    )
                                }
                            }
                        }

                        Text(
                            text = tab.title,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium,
                            fontFamily = FontFamily.SansSerif,
                            color = contentColor,
                            letterSpacing = (-0.2).sp
                        )
                    }
                }
            }
        }
    }
}
