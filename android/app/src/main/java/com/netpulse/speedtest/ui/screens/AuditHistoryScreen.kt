package com.netpulse.speedtest.ui.screens

import android.content.Intent
import androidx.compose.animation.*
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
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
import com.google.gson.Gson
import com.netpulse.speedtest.data.HistoryRepository
import com.netpulse.speedtest.model.SpeedTestResult
import com.netpulse.speedtest.theme.*
import kotlinx.coroutines.launch

@Composable
fun AuditHistoryScreen(
    repository: HistoryRepository,
    unit: String,
    onViewCertificate: (SpeedTestResult) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val historyList by repository.historyFlow.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var expandedId by remember { mutableStateOf<String?>(null) }
    var showClearConfirm by remember { mutableStateOf(false) }

    val factor = if (unit == "MB/s") 8.0 else 1.0

    // Filtered list
    val filtered = historyList.filter {
        it.serverName.contains(searchQuery, ignoreCase = true) ||
        it.routingProtocol.contains(searchQuery, ignoreCase = true) ||
        it.bufferbloatGrade.contains(searchQuery, ignoreCase = true)
    }

    val totalCount = historyList.size
    val peakDownload = if (historyList.isNotEmpty()) historyList.maxOf { it.downloadMbps } / factor else 0.0
    val peakUpload = if (historyList.isNotEmpty()) historyList.maxOf { it.uploadMbps } / factor else 0.0
    val avgPing = if (historyList.isNotEmpty()) historyList.map { it.pingMs }.average().toInt() else 0

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .padding(bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Top KPI Summary Strip
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            SummaryKpiBox(modifier = Modifier.weight(1f), label = "SESSIONS", value = "$totalCount", color = LightCreamBright)
            SummaryKpiBox(modifier = Modifier.weight(1f), label = "PEAK DL", value = String.format(java.util.Locale.US, "%.0f", peakDownload), color = LightCreamBright)
            SummaryKpiBox(modifier = Modifier.weight(1f), label = "PEAK UL", value = String.format(java.util.Locale.US, "%.0f", peakUpload), color = SlateBlue)
            SummaryKpiBox(modifier = Modifier.weight(1f), label = "AVG PING", value = "${avgPing}ms", color = WarmGold)
        }

        // 2. Action & Search Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Search Input Pill
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(CircleShape)
                    .background(DarkSurface)
                    .border(1.dp, DarkBorder, CircleShape)
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Default.Search, contentDescription = null, tint = LightCreamSubtle, modifier = Modifier.size(16.dp))
                    Text(
                        text = if (searchQuery.isEmpty()) "Filter audit sessions..." else searchQuery,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        color = if (searchQuery.isEmpty()) LightCreamSubtle else LightCreamBright
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Export Button
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(DarkSurface)
                    .border(1.dp, DarkBorderHighlight, CircleShape)
                    .clickable {
                        try {
                            val json = Gson().toJson(historyList)
                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, json)
                                type = "application/json"
                            }
                            context.startActivity(Intent.createChooser(sendIntent, "Export Telemetry JSON"))
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Share, contentDescription = "Export JSON", tint = LightCreamBright, modifier = Modifier.size(16.dp))
            }

            Spacer(modifier = Modifier.width(6.dp))

            // Clear All Button
            if (historyList.isNotEmpty()) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(DarkSurface)
                        .border(1.dp, Terracotta.copy(alpha = 0.5f), CircleShape)
                        .clickable { showClearConfirm = true },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = "Clear All", tint = Terracotta, modifier = Modifier.size(16.dp))
                }
            }
        }

        // 3. History List / Empty State
        if (filtered.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Default.Speed, contentDescription = null, tint = LightCreamSubtle, modifier = Modifier.size(42.dp))
                    Text("No Telemetry Audits Recorded", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = LightCreamBright)
                    Text("Run a speed test to log historical network performance", fontSize = 10.sp, color = LightCreamSubtle)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxWidth().weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filtered, key = { it.id }) { item ->
                    val isExpanded = expandedId == item.id
                    HistoryItemCard(
                        item = item,
                        unit = unit,
                        factor = factor,
                        isExpanded = isExpanded,
                        onToggleExpand = {
                            expandedId = if (isExpanded) null else item.id
                        },
                        onOpenCertificate = { onViewCertificate(item) },
                        onDelete = {
                            scope.launch { repository.deleteResult(item.id) }
                        }
                    )
                }
            }
        }
    }

    if (showClearConfirm) {
        AlertDialog(
            onDismissRequest = { showClearConfirm = false },
            title = { Text("Clear All Audit History?", fontWeight = FontWeight.Bold, color = LightCreamBright) },
            text = { Text("This will permanently remove all $totalCount logged network test sessions.", color = LightCreamMuted) },
            confirmButton = {
                TextButton(
                    onClick = {
                        scope.launch { repository.clearAll() }
                        showClearConfirm = false
                    }
                ) {
                    Text("CLEAR ALL", color = Terracotta, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearConfirm = false }) {
                    Text("CANCEL", color = LightCreamSubtle)
                }
            },
            containerColor = DarkSurface,
            titleContentColor = LightCreamBright,
            textContentColor = LightCreamMuted
        )
    }
}

@Composable
fun SummaryKpiBox(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(DarkSurface)
            .border(1.dp, DarkBorderHighlight, RoundedCornerShape(14.dp))
            .padding(vertical = 8.dp, horizontal = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, fontSize = 8.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, color = LightCreamSubtle)
            Text(value, fontSize = 14.sp, fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Black, color = color)
        }
    }
}

@Composable
fun HistoryItemCard(
    item: SpeedTestResult,
    unit: String,
    factor: Double,
    isExpanded: Boolean,
    onToggleExpand: () -> Unit,
    onOpenCertificate: () -> Unit,
    onDelete: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(DarkSurface)
            .border(1.dp, DarkBorderHighlight, RoundedCornerShape(18.dp))
            .clickable { onToggleExpand() }
            .padding(14.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            // Main Top Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Left: Speeds & Date
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Default.ArrowDownward, contentDescription = null, tint = LightCreamBright, modifier = Modifier.size(13.dp))
                            Text(
                                text = String.format(java.util.Locale.US, "%.1f", item.downloadMbps / factor),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.SansSerif,
                                color = LightCreamBright
                            )
                        }

                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Default.ArrowUpward, contentDescription = null, tint = SlateBlue, modifier = Modifier.size(13.dp))
                            Text(
                                text = String.format(java.util.Locale.US, "%.1f", item.uploadMbps / factor),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.SansSerif,
                                color = SlateBlue
                            )
                        }

                        Text(unit, fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                    }

                    Text(
                        text = "${item.serverName} • ${item.timestamp}",
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace,
                        color = LightCreamSubtle
                    )
                }

                // Right: Bufferbloat Badge & Ping
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "${item.pingMs} ms",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = WarmGold
                    )

                    val gradeColor = when (item.bufferbloatGrade) {
                        "A+", "A" -> SageGreen
                        "B" -> LightCream
                        "C" -> WarmGold
                        else -> Terracotta
                    }

                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(DarkSubpanel)
                            .border(1.dp, gradeColor.copy(alpha = 0.5f), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = item.bufferbloatGrade,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            color = gradeColor
                        )
                    }
                }
            }

            // Expanded Details Tray
            AnimatedVisibility(visible = isExpanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(DarkSubpanel)
                        .border(1.dp, DarkBorder, RoundedCornerShape(12.dp))
                        .padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Loaded Latency: +${item.downloadLoadedLatencyMs ?: 0}ms DL / +${item.uploadLoadedLatencyMs ?: 0}ms UL", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                        Text("Jitter: ${item.jitterMs}ms", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Packet Loss: ${item.packetLoss}%", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = if (item.packetLoss > 0) Terracotta else SageGreen)
                        Text("Protocol: ${item.routingProtocol}", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = LightCreamSubtle)
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // View Certificate Pill Button (Tactile Light Cream)
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(LightCreamBright)
                                .clickable { onOpenCertificate() }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Icon(Icons.Default.Verified, contentDescription = null, tint = CreamDark, modifier = Modifier.size(13.dp))
                                Text("Speed Certificate", fontSize = 10.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, color = CreamDark)
                            }
                        }

                        // Delete Single Record
                        IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = Terracotta, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}
