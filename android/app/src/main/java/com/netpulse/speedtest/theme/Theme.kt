package com.netpulse.speedtest.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = NeonCyan,
    onPrimary = Color.Black,
    secondary = NeonViolet,
    onSecondary = Color.White,
    tertiary = NeonEmerald,
    background = DarkBackground,
    surface = DarkSurface,
    onBackground = TextPrimaryDark,
    onSurface = TextPrimaryDark,
    outline = DarkBorder
)

private val LightColorScheme = lightColorScheme(
    primary = NeonBlue,
    onPrimary = Color.White,
    secondary = NeonViolet,
    onSecondary = Color.White,
    tertiary = NeonEmerald,
    background = LightBackground,
    surface = LightSurface,
    onBackground = TextPrimaryLight,
    onSurface = TextPrimaryLight,
    outline = LightBorder
)

@Composable
fun NetPulseTheme(
    darkTheme: Boolean = true, // Default to carrier-grade obsidian dark theme
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
