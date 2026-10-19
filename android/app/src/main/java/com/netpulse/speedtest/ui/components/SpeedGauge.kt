package com.netpulse.speedtest.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
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
import com.netpulse.speedtest.theme.*
import kotlin.math.cos
import kotlin.math.sin

fun computeDynamicGaugeMax(valMbps: Double, unit: String = "Mbps"): Double {
    if (unit == "MB/s") {
        return when {
            valMbps <= 0 -> 25.0
            valMbps <= 2.5 -> 5.0
            valMbps <= 6.0 -> 10.0
            valMbps <= 15.0 -> 25.0
            valMbps <= 35.0 -> 50.0
            valMbps <= 75.0 -> 100.0
            valMbps <= 150.0 -> 250.0
            else -> Math.ceil(valMbps / 50.0) * 50.0
        }
    }
    return when {
        valMbps <= 0 -> 100.0
        valMbps <= 15.0 -> 20.0
        valMbps <= 35.0 -> 50.0
        valMbps <= 75.0 -> 100.0
        valMbps <= 180.0 -> 250.0
        valMbps <= 380.0 -> 500.0
        valMbps <= 750.0 -> 1000.0
        valMbps <= 1800.0 -> 2500.0
        else -> Math.ceil(valMbps / 500.0) * 500.0
    }
}

@Composable
fun SpeedGauge(
    speed: Double,
    unit: String = "Mbps",
    phaseLabel: String = "Standby",
    isRunning: Boolean = false,
    onStartTest: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val factor = if (unit == "MB/s") 8.0 else 1.0
    val displaySpeed = speed / factor
    val gaugeMax = computeDynamicGaugeMax(displaySpeed, unit)

    // Fluid spring physics for the speedometer needle/arc
    val animatedSpeed by animateFloatAsState(
        targetValue = if (isRunning) displaySpeed.toFloat() else 0f,
        animationSpec = spring(dampingRatio = 0.82f, stiffness = 140f),
        label = "gaugeSpeed"
    )

    // Breathing pulse for idle & testing states in warm cream tone
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isRunning) 1.04f else 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (isRunning) 900 else 2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.16f,
        targetValue = 0.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (isRunning) 900 else 2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    val progress = (animatedSpeed / gaugeMax.toFloat()).coerceIn(0f, 1f)

    // Start angle: 150 degrees, Sweep: 240 degrees (Classic 240° cockpit tachometer)
    val startAngle = 150f
    val totalSweep = 240f

    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val buttonScale by animateFloatAsState(
        targetValue = if (isPressed) 0.93f else 1f,
        animationSpec = spring(dampingRatio = 0.65f, stiffness = 450f),
        label = "buttonPressScale"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(300.dp),
        contentAlignment = Alignment.Center
    ) {
        // 1. Warm Ambient Cream Halo Behind Gauge
        Box(
            modifier = Modifier
                .size(240.dp)
                .scale(pulseScale)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            LightCream.copy(alpha = pulseAlpha),
                            Color.Transparent
                        )
                    )
                )
        )

        // 2. High-Performance Hardware Accelerated Canvas (Precision Notches & Cream Arc)
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp)
        ) {
            val width = size.width
            val height = size.height
            val strokeWidth = 10.dp.toPx()
            val diameter = minOf(width, height) - strokeWidth * 2 - 16.dp.toPx()
            val radius = diameter / 2
            val center = Offset(width / 2, height / 2 + 6.dp.toPx())
            val arcTopLeft = Offset(center.x - radius, center.y - radius)
            val arcSize = Size(diameter, diameter)

            // A. Base Track Rail (Warm Charcoal Arc with hairline rim)
            drawArc(
                color = DarkBorder,
                startAngle = startAngle,
                sweepAngle = totalSweep,
                useCenter = false,
                topLeft = arcTopLeft,
                size = arcSize,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // B. Discrete Precision Notches & Tick Marks (Anti-Slop Micro-Engravings)
            val totalTicks = 32
            for (i in 0..totalTicks) {
                val tickFraction = i.toFloat() / totalTicks
                val angleDeg = startAngle + tickFraction * totalSweep
                val angleRad = Math.toRadians(angleDeg.toDouble())

                val isMajor = i % 8 == 0
                val isMedium = i % 4 == 0
                val tickLength = if (isMajor) 14.dp.toPx() else if (isMedium) 9.dp.toPx() else 5.dp.toPx()
                val tickWidth = if (isMajor) 2.dp.toPx() else 1.dp.toPx()

                val outerR = radius - strokeWidth / 2 - 5.dp.toPx()
                val innerR = outerR - tickLength

                val startX = center.x + outerR * cos(angleRad).toFloat()
                val startY = center.y + outerR * sin(angleRad).toFloat()
                val endX = center.x + innerR * cos(angleRad).toFloat()
                val endY = center.y + innerR * sin(angleRad).toFloat()

                val isPassed = tickFraction <= progress
                val tickColor = if (isPassed && isRunning) {
                    LightCream.copy(alpha = 0.90f)
                } else if (isMajor) {
                    LightCreamMuted.copy(alpha = 0.40f)
                } else {
                    LightCreamSubtle.copy(alpha = 0.18f)
                }

                drawLine(
                    color = tickColor,
                    start = Offset(startX, startY),
                    end = Offset(endX, endY),
                    strokeWidth = tickWidth,
                    cap = StrokeCap.Round
                )
            }

            // C. Active Progress Arc (Luminous Light Cream with Warm Champagne Edge)
            if (progress > 0.005f) {
                val activeSweep = totalSweep * progress
                drawArc(
                    brush = Brush.sweepGradient(
                        colors = listOf(
                            LightCream.copy(alpha = 0.70f),
                            LightCreamBright,
                            WarmGold.copy(alpha = 0.85f)
                        ),
                        center = center
                    ),
                    startAngle = startAngle,
                    sweepAngle = activeSweep,
                    useCenter = false,
                    topLeft = arcTopLeft,
                    size = arcSize,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )

                // D. Needle Tip Specular Pip (Machined Warm Cream Indicator)
                val tipAngleRad = Math.toRadians((startAngle + activeSweep).toDouble())
                val pipX = center.x + radius * cos(tipAngleRad).toFloat()
                val pipY = center.y + radius * sin(tipAngleRad).toFloat()

                drawCircle(
                    color = LightCreamBright,
                    radius = 5.dp.toPx(),
                    center = Offset(pipX, pipY)
                )
                drawCircle(
                    color = CreamDark,
                    radius = 2.dp.toPx(),
                    center = Offset(pipX, pipY)
                )
            }
        }

        // 3. Central Morphing Tactile Core (Standby Luxury Button vs Live Digital Readout)
        AnimatedContent(
            targetState = isRunning,
            transitionSpec = {
                fadeIn(animationSpec = tween(220)) + scaleIn(initialScale = 0.92f) togetherWith
                        fadeOut(animationSpec = tween(180)) + scaleOut(targetScale = 1.05f)
            },
            label = "coreMorph"
        ) { running ->
            if (!running) {
                // TACTILE CONVEX CREAM DIAL ("START" HERO BUTTON)
                Box(
                    modifier = Modifier
                        .size(136.dp)
                        .scale(buttonScale)
                        .clip(CircleShape)
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    LightCreamBright,
                                    LightCream
                                )
                            )
                        )
                        .border(
                            width = 1.5.dp,
                            color = Color.White.copy(alpha = 0.6f),
                            shape = CircleShape
                        )
                        .clickable(
                            interactionSource = interactionSource,
                            indication = null,
                            onClick = onStartTest
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    // Fine inner shadow rim
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(4.dp)
                            .clip(CircleShape)
                            .border(1.dp, Color.Black.copy(alpha = 0.08f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Text(
                                text = "START",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.SansSerif,
                                color = CreamDark,
                                letterSpacing = 2.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "TAP TO TEST",
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                color = CreamDark.copy(alpha = 0.65f),
                                letterSpacing = 1.sp
                            )
                        }
                    }
                }
            } else {
                // HIGH-DENSITY DIGITAL INSTRUMENT READOUT
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier.padding(horizontal = 8.dp)
                ) {
                    // Phase Badge
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(DarkSubpanel)
                            .border(1.dp, DarkBorderHighlight, CircleShape)
                            .padding(horizontal = 9.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = phaseLabel.uppercase(),
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            color = LightCream,
                            letterSpacing = 0.8.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Speed Readout (Big Cream Tabular Numerals)
                    val speedInt = animatedSpeed.toInt()
                    val speedFrac = ((animatedSpeed - speedInt) * 10).toInt().coerceIn(0, 9)

                    Row(
                        verticalAlignment = Alignment.Bottom,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "$speedInt",
                            fontSize = 44.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            color = LightCreamBright,
                            letterSpacing = (-1.5).sp
                        )
                        Text(
                            text = ".$speedFrac",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = LightCreamMuted,
                            modifier = Modifier.padding(bottom = 5.dp)
                        )
                    }

                    // Unit & Gauge Ceiling
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = unit,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            color = LightCream
                        )
                        Text(
                            text = "• max ${gaugeMax.toInt()}",
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace,
                            color = LightCreamSubtle
                        )
                    }
                }
            }
        }
    }
}
