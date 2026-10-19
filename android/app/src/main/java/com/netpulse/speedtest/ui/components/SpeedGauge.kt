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
        animationSpec = spring(dampingRatio = 0.78f, stiffness = 160f),
        label = "gaugeSpeed"
    )

    // Breathing pulse for idle & testing states
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isRunning) 1.05f else 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (isRunning) 800 else 1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.25f,
        targetValue = 0.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (isRunning) 800 else 1800, easing = FastOutSlowInEasing),
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
        targetValue = if (isPressed) 0.92f else 1f,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 400f),
        label = "buttonPressScale"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(290.dp),
        contentAlignment = Alignment.Center
    ) {
        // 1. Ambient Background Glow Behind Gauge
        Box(
            modifier = Modifier
                .size(240.dp)
                .scale(pulseScale)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            if (isRunning) NeonCyan.copy(alpha = pulseAlpha) else NeonEmerald.copy(alpha = pulseAlpha * 0.7f),
                            Color.Transparent
                        )
                    )
                )
        )

        // 2. High-Performance Hardware Accelerated Canvas (Track, Ticks & Glowing Arc)
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp)
        ) {
            val width = size.width
            val height = size.height
            val strokeWidth = 14.dp.toPx()
            val diameter = minOf(width, height) - strokeWidth * 2 - 12.dp.toPx()
            val radius = diameter / 2
            val center = Offset(width / 2, height / 2 + 6.dp.toPx())
            val arcTopLeft = Offset(center.x - radius, center.y - radius)
            val arcSize = Size(diameter, diameter)

            // A. Base Track Rail (Dark Titanium Arc)
            drawArc(
                color = Color.White.copy(alpha = 0.06f),
                startAngle = startAngle,
                sweepAngle = totalSweep,
                useCenter = false,
                topLeft = arcTopLeft,
                size = arcSize,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // B. Geometric Ticks (49 precision calibrated notches)
            val tickCount = 49
            val tickInnerRadius = radius - strokeWidth / 2 - 8.dp.toPx()
            val tickOuterRadius = tickInnerRadius - 6.dp.toPx()

            for (i in 0 until tickCount) {
                val tickFraction = i.toFloat() / (tickCount - 1)
                val angleDeg = startAngle + totalSweep * tickFraction
                val angleRad = Math.toRadians(angleDeg.toDouble())

                val startX = center.x + (tickInnerRadius * cos(angleRad)).toFloat()
                val startY = center.y + (tickInnerRadius * sin(angleRad)).toFloat()
                val isMajor = i % 8 == 0
                val tickLength = if (isMajor) 9.dp.toPx() else 5.dp.toPx()
                val endX = center.x + ((tickInnerRadius - tickLength) * cos(angleRad)).toFloat()
                val endY = center.y + ((tickInnerRadius - tickLength) * sin(angleRad)).toFloat()

                val isLit = tickFraction <= progress && isRunning
                val tickColor = when {
                    isLit && tickFraction > 0.75f -> NeonRose
                    isLit && tickFraction > 0.45f -> NeonCyan
                    isLit -> NeonEmerald
                    isMajor -> Color.White.copy(alpha = 0.28f)
                    else -> Color.White.copy(alpha = 0.10f)
                }

                drawLine(
                    color = tickColor,
                    start = Offset(startX, startY),
                    end = Offset(endX, endY),
                    strokeWidth = if (isMajor) 2.5.dp.toPx() else 1.5.dp.toPx(),
                    cap = StrokeCap.Round
                )
            }

            // C. Active Glowing Speed Arc with Multi-stop Gradient
            if (isRunning && progress > 0.005f) {
                val activeSweep = totalSweep * progress
                drawArc(
                    brush = Brush.sweepGradient(
                        colors = listOf(NeonEmerald, NeonCyan, NeonViolet, NeonRose),
                        center = center
                    ),
                    startAngle = startAngle,
                    sweepAngle = activeSweep,
                    useCenter = false,
                    topLeft = arcTopLeft,
                    size = arcSize,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                )

                // D. Leading Laser Bead / Cursor Dot at Arc Head
                val headAngleRad = Math.toRadians((startAngle + activeSweep).toDouble())
                val beadX = center.x + (radius * cos(headAngleRad)).toFloat()
                val beadY = center.y + (radius * sin(headAngleRad)).toFloat()

                // Glow halo
                drawCircle(
                    color = NeonCyan.copy(alpha = 0.4f),
                    radius = strokeWidth * 0.9f,
                    center = Offset(beadX, beadY)
                )
                // Crisp core bead
                drawCircle(
                    color = Color.White,
                    radius = strokeWidth * 0.45f,
                    center = Offset(beadX, beadY)
                )
            }
        }

        // 3. Central Morphing Core (Tactile Hero "GO" Button vs Live Digital Telemetry)
        AnimatedContent(
            targetState = isRunning,
            transitionSpec = {
                fadeIn(animationSpec = tween(220)) + scaleIn(initialScale = 0.88f) togetherWith
                fadeOut(animationSpec = tween(180)) + scaleOut(targetScale = 1.08f)
            },
            label = "coreMorph"
        ) { running ->
            if (!running) {
                // IDLE HERO "START / GO" TRIGGER
                Box(
                    modifier = Modifier
                        .size(136.dp)
                        .scale(buttonScale)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(
                                    DarkElevated,
                                    DarkSurface
                                )
                            )
                        )
                        .border(
                            width = 2.dp,
                            brush = Brush.sweepGradient(listOf(NeonCyan, NeonEmerald, NeonCyan)),
                            shape = CircleShape
                        )
                        .clickable(
                            interactionSource = interactionSource,
                            indication = null,
                            onClick = onStartTest
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = if (speed > 0) "TEST AGAIN" else "START",
                            fontSize = if (speed > 0) 13.sp else 22.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.SansSerif,
                            color = Color.White,
                            letterSpacing = 1.5.sp
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = if (speed > 0) String.format(java.util.Locale.US, "%.1f %s", displaySpeed, unit) else "TAP TO RUN",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = NeonEmerald
                        )
                    }
                }
            } else {
                // ACTIVE SPEED INSTRUMENT READOUT
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier.padding(top = 8.dp)
                ) {
                    // Massive Tabular Speed Readout
                    Text(
                        text = String.format(java.util.Locale.US, "%.1f", displaySpeed),
                        fontSize = 52.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        fontFamily = FontFamily.SansSerif,
                        letterSpacing = (-2).sp
                    )

                    // Unit Badge
                    Box(
                        modifier = Modifier
                            .offset(y = (-4).dp)
                            .clip(CircleShape)
                            .background(NeonCyan.copy(alpha = 0.15f))
                            .border(1.dp, NeonCyan.copy(alpha = 0.35f), CircleShape)
                            .padding(horizontal = 10.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = unit.uppercase(),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            color = NeonCyan,
                            letterSpacing = 1.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // Active Phase Pill
                    Text(
                        text = phaseLabel.uppercase(),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = when {
                            phaseLabel.contains("Download", ignoreCase = true) -> NeonCyan
                            phaseLabel.contains("Upload", ignoreCase = true) -> NeonEmerald
                            phaseLabel.contains("Ping", ignoreCase = true) -> NeonAmber
                            else -> TextSecondaryDark
                        },
                        letterSpacing = 1.2.sp
                    )

                    Spacer(modifier = Modifier.height(2.dp))

                    Text(
                        text = "MAX ${gaugeMax.toInt()} $unit",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Medium,
                        fontFamily = FontFamily.Monospace,
                        color = Color.White.copy(alpha = 0.35f)
                    )
                }
            }
        }
    }
}
