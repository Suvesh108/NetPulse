package com.netpulse.speedtest.ui.screens

import android.content.Intent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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

    // Analytics calculations
    val totalCount = historyList.size
    val peakDownload = if (historyList.isNotEmpty()) historyList.maxOf { it.downloadMbps } / factor else 0.0
    val peakUpload = if (historyList.isNotEmpty()) historyList.maxOf { it.uploadMbps } / factor else 0.0
    val avgPing = if (historyList.isNotEmpty()) historyList.map { it.pingMs }.average().toInt() else 0
    val avgJitter = if (historyList.isNotEmpty()) Math.round(historyList.map { it.jitterMs }.average() * 10.0) / 10.0 else 0.0
    val avgVoip = if (historyList.isNotEmpty()) Math.round(historyList.map { it.voipMos }.average() * 100.0) / 100.0 else 4.35

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp, vertical = 10.dp)
            .padding(bottom = 90.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // 1. Header with Export & Clear Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Carrier Audit Ledger", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("$totalCount logged telemetry sessions", fontSize = 10.sp, color = Color.White.copy(alpha = 0.5f))
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // Export JSON Button
                IconButton(
                    onClick = {
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
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(Icons.Default.Share, contentDescription = "Export JSON", tint = NeonCyan)
                }

                // Clear All Button
                if (historyList.isNotEmpty()) {
                    IconButton(
                        onClick = { showClearConfirm = true },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(Icons.Default.DeleteOutline, contentDescription = "Clear All", tint = NeonRose)
                    }
                }
            }
        }

        // Clear Confirmation Dialog
        if (showClearConfirm) {
            AlertDialog(
                onDismissRequest = { showClearConfirm = false },
                title = { Text("Clear All Audit Records?") },
                text = { Text("This will permanently purge all telemetry logs and cryptographic fingerprints from local storage.") },
                confirmButton = {
                    Button(
                        onClick = {
                            scope.launch { repository.clearAll() }
                            showClearConfirm = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = NeonRose)
                    ) {
                        Text("Purge All", color = Color.White)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showClearConfirm = false }) {
                        Text("Cancel")
                    }
                }
            )
        }

        // 2. 6-Bento Analytics Summary Matrix
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                BentoStatCard(title = "TOTAL TESTS", value = "$totalCount", unit = "Runs", color = NeonBlue, modifier = Modifier.weight(1f))
                BentoStatCard(title = "PEAK DOWNLOAD", value = String.format(java.util.Locale.US, "%.1f", peakDownload), unit = unit, color = NeonCyan, modifier = Modifier.weight(1f))
                BentoStatCard(title = "PEAK UPLOAD", value = String.format(java.util.Locale.US, "%.1f", peakUpload), unit = unit, color = NeonViolet, modifier = Modifier.weight(1f))
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                BentoStatCard(title = "AVG LATENCY", value = "$avgPing", unit = "ms", color = NeonEmerald, modifier = Modifier.weight(1f))
                BentoStatCard(title = "AVG JITTER", value = "$avgJitter", unit = "ms", color = NeonAmber, modifier = Modifier.weight(1f))
                BentoStatCard(title = "VOIP SLA", value = "$avgVoip", unit = "/ 4.5", color = NeonCyan, modifier = Modifier.weight(1f))
            }
        }

        // 3. Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Filter by node, protocol, grade...", fontSize = 11.sp, color = Color.White.copy(alpha = 0.4f)) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(16.dp)) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = DarkSurface,
                unfocusedContainerColor = DarkSurface,
                focusedBorderColor = NeonCyan,
                unfocusedBorderColor = DarkBorder,
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            )
        )

        // 4. Test Records List
        if (filtered.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(DarkSurface),
                contentAlignment = Alignment.Center
            ) {
                Text("No matching audit logs found", fontSize = 12.sp, color = Color.White.copy(alpha = 0.4f))
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxWidth().weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filtered, key = { it.id }) { item ->
                    val isExpanded = expandedId == item.id
                    HistoryItemCard(
                        result = item,
                        unit = unit,
                        factor = factor,
                        isExpanded = isExpanded,
                        onToggleExpand = { expandedId = if (isExpanded) null else item.id },
                        onOpenCert = { onOpenCertificate(item) },
                        onDelete = { scope.launch { repository.deleteResult(item.id) } }
                    )
                }
            }
        }
    }
}

@Composable
fun BentoStatCard(
    title: String,
    value: String,
    unit: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(DarkSurface)
            .border(1.dp, DarkBorder, RoundedCornerShape(12.dp))
            .padding(8.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, fontSize = 8.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = Color.White.copy(alpha = 0.5f))
            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(value, fontSize = 14.sp, fontWeight = FontWeight.Black, color = color)
                Text(unit, fontSize = 8.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = Color.White.copy(alpha = 0.4f))
            }
        }
    }
}

@Composable
fun HistoryItemCard(
    result: SpeedTestResult,
    unit: String,
    factor: Double,
    isExpanded: Boolean,
    onToggleExpand: () -> Unit,
    onOpenCert: () -> Unit,
    onDelete: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(DarkSurface)
            .border(1.dp, DarkBorder, RoundedCornerShape(14.dp))
            .clickable { onToggleExpand() }
            .padding(12.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(result.serverName, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("${result.date} • ${result.routingProtocol}", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = Color.White.copy(alpha = 0.45f))
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "↓ ${String.format(java.util.Locale.US, "%.1f", result.downloadMbps / factor)} $unit",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            color = NeonCyan
                        )
                        Text(
                            text = "↑ ${String.format(java.util.Locale.US, "%.1f", result.uploadMbps / factor)} $unit",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = NeonViolet
                        )
                    }

                    Icon(
                        imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.4f)
                    )
                }
            }

            AnimatedVisibility(visible = isExpanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                        .border(1.dp, DarkBorder, RoundedCornerShape(10.dp))
                        .padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Latency: ${result.pingMs} ms", fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = NeonEmerald)
                        Text("Jitter: ${result.jitterMs} ms", fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = NeonAmber)
                        Text("Grade: ${result.bufferbloatGrade}", fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = NeonCyan)
                        Text("VoIP: ${result.voipMos}", fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = Color.White)
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = onOpenCert,
                            colors = ButtonDefaults.buttonColors(containerColor = NeonCyan.copy(alpha = 0.15f)),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.Verified, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Speed Certificate", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = NeonCyan)
                        }

                        IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                            Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = NeonRose, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}
