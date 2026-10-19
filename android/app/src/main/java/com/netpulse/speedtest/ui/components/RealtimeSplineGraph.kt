package com.netpulse.speedtest.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netpulse.speedtest.theme.*
import kotlin.math.max

@Composable
fun RealtimeSplineGraph(
    title: String,
    streamTag: String,
    themeColor: Color = LightCream,
    history: List<Double>,
    unit: String = "Mbps",
    modifier: Modifier = Modifier
) {
    val factor = if (unit == "MB/s") 8.0 else 1.0
    val convertedHistory = history.map { it / factor }
    val latestSpeed = convertedHistory.lastOrNull() ?: 0.0
    val maxVal = max(1.0, convertedHistory.maxOrNull() ?: 1.0)

    val infiniteTransition = rememberInfiniteTransition(label = "beacon")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    Column(
        modifier = modifier
            .fillMaxWidth()
            .height(110.dp)
            .padding(vertical = 4.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = title.uppercase(),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = themeColor
                )
                Text(
                    text = "• $streamTag",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    fontFamily = FontFamily.Monospace,
                    color = LightCreamSubtle
                )
            }

            Text(
                text = "${String.format(java.util.Locale.US, "%.1f", latestSpeed)} $unit",
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
                color = LightCreamBright
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Spline Canvas
        Canvas(modifier = Modifier.fillMaxWidth().weight(1f)) {
            val width = size.width
            val height = size.height
            val padY = 6.dp.toPx()

            // Draw grid lines
            drawLine(
                color = DarkBorder,
                start = Offset(0f, height / 2),
                end = Offset(width, height / 2),
                strokeWidth = 1.dp.toPx()
            )

            if (convertedHistory.size < 2) {
                // Baseline flat line
                drawLine(
                    color = themeColor.copy(alpha = 0.25f),
                    start = Offset(0f, height - padY),
                    end = Offset(width, height - padY),
                    strokeWidth = 2.dp.toPx()
                )
                return@Canvas
            }

            val stepX = width / (convertedHistory.size - 1)
            val points = convertedHistory.mapIndexed { idx, v ->
                val x = idx * stepX
                val y = height - padY - ((v / maxVal) * (height - padY * 2)).toFloat()
                Offset(x, y)
            }

            // Monotone Cubic Spline Path
            val linePath = Path().apply {
                moveTo(points[0].x, points[0].y)
                for (i in 1 until points.size) {
                    val prev = points[i - 1]
                    val curr = points[i]
                    val cpX1 = prev.x + (curr.x - prev.x) / 2f
                    val cpY1 = prev.y
                    val cpX2 = prev.x + (curr.x - prev.x) / 2f
                    val cpY2 = curr.y
                    cubicTo(cpX1, cpY1, cpX2, cpY2, curr.x, curr.y)
                }
            }

            // Area Path
            val areaPath = Path().apply {
                addPath(linePath)
                lineTo(points.last().x, height)
                lineTo(points.first().x, height)
                close()
            }

            // Draw Area Fill
            drawPath(
                path = areaPath,
                brush = Brush.verticalGradient(
                    colors = listOf(themeColor.copy(alpha = 0.22f), Color.Transparent),
                    startY = 0f,
                    endY = height
                )
            )

            // Draw Spline Stroke
            drawPath(
                path = linePath,
                color = themeColor,
                style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round)
            )

            // Draw Leading Beacon Dot
            val lastPoint = points.last()
            drawCircle(
                color = themeColor.copy(alpha = pulseAlpha * 0.35f),
                radius = 7.dp.toPx(),
                center = lastPoint
            )
            drawCircle(
                color = themeColor,
                radius = 3.5.dp.toPx(),
                center = lastPoint
            )
        }
    }
}
