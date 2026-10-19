package com.netpulse.speedtest.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netpulse.speedtest.theme.NeonCyan
import com.netpulse.speedtest.theme.NeonViolet
import kotlin.math.cos
import kotlin.math.sin

fun computeDynamicGaugeMax(valMbps: Double, unit: String = "Mbps"): Double {
    if (unit == "MB/s") {
        return when {
            valMbps <= 0 -> 20.0
            valMbps <= 1.2 -> 2.0
            valMbps <= 3.0 -> 5.0
            valMbps <= 6.0 -> 10.0
            valMbps <= 14.0 -> 20.0
            valMbps <= 35.0 -> 50.0
            valMbps <= 75.0 -> 100.0
            valMbps <= 160.0 -> 250.0
            else -> Math.ceil(valMbps / 50.0) * 50.0
        }
    }
    return when {
        valMbps <= 0 -> 100.0
        valMbps <= 6.0 -> 10.0
        valMbps <= 14.0 -> 20.0
        valMbps <= 28.0 -> 40.0
        valMbps <= 55.0 -> 75.0
        valMbps <= 85.0 -> 100.0
        valMbps <= 170.0 -> 200.0
        valMbps <= 300.0 -> 400.0
        valMbps <= 500.0 -> 600.0
        valMbps <= 850.0 -> 1000.0
        valMbps <= 1700.0 -> 2000.0
        else -> Math.ceil(valMbps / 500.0) * 500.0
    }
}

@Composable
fun SpeedGauge(
    speed: Double,
    unit: String = "Mbps",
    phaseLabel: String = "Download",
    modifier: Modifier = Modifier
) {
    val factor = if (unit == "MB/s") 8.0 else 1.0
    val displaySpeed = speed / factor
    val gaugeMax = computeDynamicGaugeMax(displaySpeed, unit)

    val animatedSpeed by animateFloatAsState(
        targetValue = displaySpeed.toFloat(),
        animationSpec = spring(dampingRatio = 0.8f, stiffness = 200f),
        label = "gaugeSpeed"
    )

    val progress = (animatedSpeed / gaugeMax.toFloat()).coerceIn(0f, 1f)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(260.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            val width = size.width
            val height = size.height
            val strokeWidth = 18.dp.toPx()
            val radius = (minOf(width, height * 2) / 2) - strokeWidth

            val center = Offset(width / 2, height - 20.dp.toPx())
            val arcSize = Size(radius * 2, radius * 2)
            val arcTopLeft = Offset(center.x - radius, center.y - radius)

            // 1. Draw Background Track (180 degrees from 180 to 360)
            drawArc(
                color = Color.White.copy(alpha = 0.08f),
                startAngle = 180f,
                sweepAngle = 180f,
                useCenter = false,
                topLeft = arcTopLeft,
                size = arcSize,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // 2. Draw 37 Radial Ticks
            val tickCount = 37
            val tickRadiusInner = radius - strokeWidth - 10.dp.toPx()
            val tickRadiusOuter = tickRadiusInner - 7.dp.toPx()

            for (i in 0 until tickCount) {
                val angleDeg = 180f + (180f / (tickCount - 1)) * i
                val angleRad = Math.toRadians(angleDeg.toDouble())

                val startX = center.x + (tickRadiusInner * cos(angleRad)).toFloat()
                val startY = center.y + (tickRadiusInner * sin(angleRad)).toFloat()
                val endX = center.x + (tickRadiusOuter * cos(angleRad)).toFloat()
                val endY = center.y + (tickRadiusOuter * sin(angleRad)).toFloat()

                val tickProgress = i.toFloat() / (tickCount - 1)
                val tickColor = if (tickProgress <= progress) {
                    NeonCyan.copy(alpha = 0.85f)
                } else {
                    Color.White.copy(alpha = 0.25f)
                }

                drawLine(
                    color = tickColor,
                    start = Offset(startX, startY),
                    end = Offset(endX, endY),
                    strokeWidth = 2.dp.toPx(),
                    cap = StrokeCap.Round
                )
            }

            // 3. Draw Active Progress Arc with Gradient
            if (progress > 0.005f) {
                drawArc(
                    brush = Brush.horizontalGradient(
                        colors = listOf(NeonCyan, NeonViolet),
                        startX = arcTopLeft.x,
                        endX = arcTopLeft.x + arcSize.width
                    ),
                    startAngle = 180f,
                    sweepAngle = 180f * progress,
                    useCenter = false,
                    topLeft = arcTopLeft,
                    size = arcSize,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )
            }
        }

        // Digital HUD Text Inside Gauge
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(bottom = 30.dp)
        ) {
            Text(
                text = String.format(java.util.Locale.US, "%.1f", displaySpeed),
                fontSize = 58.sp,
                fontWeight = FontWeight.Black,
                color = MaterialTheme.colorScheme.onBackground,
                fontFamily = FontFamily.SansSerif,
                letterSpacing = (-1.5).sp
            )

            Text(
                text = unit,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = NeonCyan,
                letterSpacing = 0.5.sp
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = phaseLabel.uppercase(),
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Monospace,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "MAX SCALE: ${gaugeMax.toInt()} $unit",
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.35f)
            )
        }
    }
}
