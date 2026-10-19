package com.netpulse.speedtest.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.netpulse.speedtest.theme.*
import kotlin.math.max

@Composable
fun PingOscilloscopeGraph(
    history: List<Int>,
    maxPing: Int,
    themeColor: Color = LightCream,
    modifier: Modifier = Modifier
) {
    val scaleMax = max(50, maxPing + 10)

    Canvas(modifier = modifier.fillMaxWidth().height(120.dp)) {
        val width = size.width
        val height = size.height
        val padY = 8.dp.toPx()

        // Horizontal Gridlines
        val gridLines = listOf(0.25f, 0.5f, 0.75f)
        gridLines.forEach { frac ->
            drawLine(
                color = DarkBorder,
                start = Offset(0f, height * frac),
                end = Offset(width, height * frac),
                strokeWidth = 1.dp.toPx()
            )
        }

        if (history.size < 2) {
            drawLine(
                color = themeColor.copy(alpha = 0.3f),
                start = Offset(0f, height / 2),
                end = Offset(width, height / 2),
                strokeWidth = 2.dp.toPx()
            )
            return@Canvas
        }

        val stepX = width / (history.size - 1)
        val points = history.mapIndexed { idx, valPing ->
            val x = idx * stepX
            val y = height - padY - ((valPing.toFloat() / scaleMax) * (height - padY * 2))
            Offset(x, y)
        }

        val linePath = Path().apply {
            moveTo(points[0].x, points[0].y)
            for (i in 1 until points.size) {
                lineTo(points[i].x, points[i].y)
            }
        }

        val areaPath = Path().apply {
            addPath(linePath)
            lineTo(points.last().x, height)
            lineTo(points.first().x, height)
            close()
        }

        drawPath(
            path = areaPath,
            brush = Brush.verticalGradient(
                colors = listOf(themeColor.copy(alpha = 0.18f), Color.Transparent),
                startY = 0f,
                endY = height
            )
        )

        drawPath(
            path = linePath,
            color = themeColor,
            style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round)
        )
    }
}
