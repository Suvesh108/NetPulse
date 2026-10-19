package com.netpulse.speedtest.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = LightCream,
    onPrimary = CreamDark,
    secondary = WarmGold,
    onSecondary = DarkBackground,
    tertiary = SageGreen,
    background = DarkBackground,
    surface = DarkSurface,
    onBackground = TextPrimaryDark,
    onSurface = TextPrimaryDark,
    outline = DarkBorder
)

private val LightColorScheme = lightColorScheme(
    primary = DarkBackground,
    onPrimary = LightCreamBright,
    secondary = WarmGold,
    onSecondary = LightSurface,
    tertiary = SageGreen,
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
