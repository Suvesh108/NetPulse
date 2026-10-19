package com.netpulse.speedtest.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netpulse.speedtest.theme.DarkSurface
import com.netpulse.speedtest.theme.NeonCyan

enum class NavTab(val title: String, val icon: ImageVector) {
    SPEED("Speed", Icons.Default.Bolt),
    DIAGNOSTICS("Diagnostics", Icons.Default.Assessment),
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
            .padding(horizontal = 16.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(DarkSurface.copy(alpha = 0.94f))
                .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(24.dp))
                .padding(6.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            NavTab.values().forEach { tab ->
                val isSelected = currentTab == tab
                val tint by animateColorAsState(
                    targetValue = if (isSelected) NeonCyan else Color.White.copy(alpha = 0.45f),
                    animationSpec = spring(),
                    label = "tint"
                )

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(18.dp))
                        .background(if (isSelected) NeonCyan.copy(alpha = 0.12f) else Color.Transparent)
                        .clickable { onTabSelected(tab) }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Box {
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
                                        .clip(RoundedCornerShape(7.dp))
                                        .background(NeonCyan),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "$historyBadgeCount",
                                        fontSize = 8.sp,
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
                            color = tint
                        )
                    }
                }
            }
        }
    }
}
