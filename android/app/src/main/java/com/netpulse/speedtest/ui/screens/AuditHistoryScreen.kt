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
import androidx.compose.ui.graphics.Brush
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
    onOpenCertificate: (SpeedTestResult) -> Unit,
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
            SummaryKpiBox(modifier = Modifier.weight(1f), label = "SESSIONS", value = "$totalCount", color = Color.White)
            SummaryKpiBox(modifier = Modifier.weight(1f), label = "PEAK DL", value = String.format(java.util.Locale.US, "%.0f", peakDownload), color = NeonCyan)
            SummaryKpiBox(modifier = Modifier.weight(1f), label = "PEAK UL", value = String.format(java.util.Locale.US, "%.0f", peakUpload), color = NeonEmerald)
            SummaryKpiBox(modifier = Modifier.weight(1f), label = "AVG PING", value = "${avgPing}ms", color = NeonAmber)
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
                    .border(1.dp, Color.White.copy(alpha = 0.08f), CircleShape)
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Default.Search, contentDescription = null, tint = TextSecondaryDark, modifier = Modifier.size(16.dp))
                    Text(
                        text = if (searchQuery.isEmpty()) "Filter history records..." else searchQuery,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        color = if (searchQuery.isEmpty()) TextMutedDark else Color.White
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
                    .border(1.dp, Color.White.copy(alpha = 0.12f), CircleShape)
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
                Icon(Icons.Default.Share, contentDescription = "Export JSON", tint = NeonCyan, modifier = Modifier.size(16.dp))
            }

            Spacer(modifier = Modifier.width(6.dp))

            // Clear All Button
            if (historyList.isNotEmpty()) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(DarkSurface)
                        .border(1.dp, NeonRose.copy(alpha = 0.3f), CircleShape)
                        .clickable { showClearConfirm = true },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = "Clear All", tint = NeonRose, modifier = Modifier.size(16.dp))
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
                    Icon(Icons.Default.Speed, contentDescription = null, tint = TextMutedDark, modifier = Modifier.size(42.dp))
                    Text("No Telemetry Audits Recorded", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Run a speed test to log historical network performance", fontSize = 10.sp, color = TextSecondaryDark)
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
                        onOpenCertificate = { onOpenCertificate(item) },
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
            title = { Text("Clear All Audit History?", fontWeight = FontWeight.Bold) },
            text = { Text("This will permanently remove all $totalCount logged network test sessions.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        scope.launch { repository.clearAll() }
                        showClearConfirm = false
                    }
                ) {
                    Text("CLEAR ALL", color = NeonRose, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearConfirm = false }) {
                    Text("CANCEL")
                }
            },
            containerColor = DarkSurface,
            titleContentColor = Color.White,
            textContentColor = TextSecondaryDark
        )
    }
}

@Composable
fun SummaryKpiBox(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(DarkSurface)
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(14.dp))
            .padding(vertical = 8.dp, horizontal = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, fontSize = 8.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, color = TextSecondaryDark)
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
            .border(
                1.dp,
                Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.12f), Color.White.copy(alpha = 0.04f))),
                RoundedCornerShape(18.dp)
            )
            .clickable { onToggleExpand() }
            .padding(12.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            // Main Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Left: Speeds & Server
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Default.ArrowDownward, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(13.dp))
                            Text(
                                text = "${String.format(java.util.Locale.US, "%.1f", item.downloadMbps / factor)} $unit",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Default.ArrowUpward, contentDescription = null, tint = NeonEmerald, modifier = Modifier.size(13.dp))
                            Text(
                                text = "${String.format(java.util.Locale.US, "%.1f", item.uploadMbps / factor)} $unit",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }

                    Text(
                        text = "${item.serverName} • ${item.timestamp}",
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace,
                        color = TextSecondaryDark
                    )
                }

                // Right: Bufferbloat Badge
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(NeonCyan.copy(alpha = 0.15f))
                        .border(1.dp, NeonCyan.copy(alpha = 0.35f), RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = item.bufferbloatGrade,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        color = NeonCyan
                    )
                }
            }

            // Expanded Detail Deck
            AnimatedVisibility(visible = isExpanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 6.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    HorizontalDivider(color = Color.White.copy(alpha = 0.08f))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Latency: ${item.pingMs} ms • Jitter: ${item.jitterMs} ms", fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = TextSecondaryDark)
                        Text("Loss: ${item.packetLoss}%", fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = if (item.packetLoss > 0) NeonRose else NeonEmerald)
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Certificate button
                        Button(
                            onClick = onOpenCertificate,
                            colors = ButtonDefaults.buttonColors(containerColor = NeonCyan.copy(alpha = 0.18f), contentColor = NeonCyan),
                            shape = CircleShape,
                            modifier = Modifier.weight(1f).height(36.dp)
                        ) {
                            Icon(Icons.Default.Verified, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("CERTIFICATE", fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }

                        // Delete button
                        IconButton(
                            onClick = onDelete,
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = NeonRose, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}
