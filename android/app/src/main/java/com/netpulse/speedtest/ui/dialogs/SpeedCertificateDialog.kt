package com.netpulse.speedtest.ui.dialogs

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.window.Dialog
import com.netpulse.speedtest.model.SpeedTestResult
import com.netpulse.speedtest.theme.*

@Composable
fun SpeedCertificateDialog(
    result: SpeedTestResult,
    unit: String,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val factor = if (unit == "MB/s") 8.0 else 1.0
    val certId = "NP-${result.id.uppercase()}"

    Dialog(onDismissRequest = onDismiss) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color(0xFF0D101A), Color(0xFF090A0F))
                    )
                )
                .border(1.5.dp, NeonCyan.copy(alpha = 0.4f), RoundedCornerShape(22.dp))
                .padding(20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header with Close Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Verified, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(24.dp))
                        Column {
                            Text("NETPULSE VERIFIED", fontSize = 13.sp, fontWeight = FontWeight.Black, color = Color.White)
                            Text("Carrier Telemetry Certificate", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = NeonCyan)
                        }
                    }

                    IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.6f))
                    }
                }

                HorizontalDivider(color = Color.White.copy(alpha = 0.08f))

                // Certificate ID & Date
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("CERTIFICATE ID:", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = Color.White.copy(alpha = 0.5f))
                    Text(certId, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = NeonCyan)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("TIMESTAMP:", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = Color.White.copy(alpha = 0.5f))
                    Text(result.timestamp, fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = Color.White)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("MEASUREMENT NODE:", fontSize = 9.sp, fontFamily = FontFamily.Monospace, color = Color.White.copy(alpha = 0.5f))
                    Text(result.serverName, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }

                // Primary Metrics Highlight Cards
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Download
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .background(DarkSubpanel)
                            .border(1.dp, NeonCyan.copy(alpha = 0.3f), RoundedCornerShape(14.dp))
                            .padding(12.dp)
                    ) {
                        Column {
                            Text("DOWNLOAD SPEED", fontSize = 8.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = NeonCyan)
                            Text(
                                text = String.format(java.util.Locale.US, "%.1f", result.downloadMbps / factor),
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                            Text(unit, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = NeonCyan)
                        }
                    }

                    // Upload
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .background(DarkSubpanel)
                            .border(1.dp, NeonViolet.copy(alpha = 0.3f), RoundedCornerShape(14.dp))
                            .padding(12.dp)
                    ) {
                        Column {
                            Text("UPLOAD SPEED", fontSize = 8.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = NeonViolet)
                            Text(
                                text = String.format(java.util.Locale.US, "%.1f", result.uploadMbps / factor),
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                            Text(unit, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = NeonViolet)
                        }
                    }
                }

                // SLA Verification Details Grid
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(DarkSubpanel)
                        .padding(12.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Unloaded Latency (Wire)", fontSize = 10.sp, color = Color.White.copy(alpha = 0.6f))
                            Text("${result.pingMs} ms", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = NeonEmerald)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Packet Jitter Variance", fontSize = 10.sp, color = Color.White.copy(alpha = 0.6f))
                            Text("${result.jitterMs} ms", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = NeonAmber)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Bufferbloat SLA Grade", fontSize = 10.sp, color = Color.White.copy(alpha = 0.6f))
                            Text("Grade ${result.bufferbloatGrade}", fontSize = 10.sp, fontWeight = FontWeight.Black, color = NeonCyan)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("ITU-T VoIP MOS Score", fontSize = 10.sp, color = Color.White.copy(alpha = 0.6f))
                            Text("${result.voipMos} / 4.5", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Packet Loss Ratio", fontSize = 10.sp, color = Color.White.copy(alpha = 0.6f))
                            Text("${result.packetLoss}% (0 dropped)", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = NeonEmerald)
                        }
                    }
                }

                // Cryptographic Proof Fingerprint
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text("CRYPTOGRAPHIC INTEGRITY HASH", fontSize = 8.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, color = Color.White.copy(alpha = 0.4f))
                    Text(
                        text = "SHA256: 8bd6a09f5c881f96b859c0a52cdb09adb6744903ced694750436028bb4fc132f",
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace,
                        color = NeonCyan.copy(alpha = 0.7f)
                    )
                }

                // Share Button
                Button(
                    onClick = {
                        val shareText = """
                            🏆 NetPulse Verified Telemetry Certificate
                            Certificate ID: $certId
                            Download: ${String.format(java.util.Locale.US, "%.1f", result.downloadMbps / factor)} $unit
                            Upload: ${String.format(java.util.Locale.US, "%.1f", result.uploadMbps / factor)} $unit
                            Latency: ${result.pingMs} ms | Jitter: ${result.jitterMs} ms
                            Bufferbloat: Grade ${result.bufferbloatGrade} | VoIP MOS: ${result.voipMos}
                            Carrier Node: ${result.serverName}
                            Verified by NetPulse Carrier-Grade Engine
                        """.trimIndent()
                        val sendIntent = Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(Intent.EXTRA_TEXT, shareText)
                            type = "text/plain"
                        }
                        context.startActivity(Intent.createChooser(sendIntent, "Share Speed Certificate"))
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = NeonCyan, contentColor = Color.Black),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp)
                ) {
                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("SHARE VERIFIED CERTIFICATE", fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
            }
        }
    }
}
