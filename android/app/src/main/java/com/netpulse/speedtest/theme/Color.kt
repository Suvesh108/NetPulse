package com.netpulse.speedtest.theme

import androidx.compose.ui.graphics.Color

// ============================================================================
// LUXURY DARK & LIGHT CREAM PALETTE (Taste & Anti-Slop)
// Warm espresso obsidian surfaces paired with tactile light cream / ivory.
// ============================================================================

// Warm Obsidian Surfaces (Dark Theme)
val DarkBackground = Color(0xFF100F0E)       // Deep warm espresso/obsidian
val DarkSurface = Color(0xFF181715)          // Primary card surface
val DarkSubpanel = Color(0xFF22201D)         // Secondary inset surface
val DarkElevated = Color(0xFF2C2925)         // Inset / pressed / elevated surface
val DarkBorder = Color(0x1EF4EFE6)           // 12% alpha light cream border
val DarkBorderHighlight = Color(0x3DF4EFE6)  // 24% alpha light cream rim

// Warm Alabaster Surfaces (Light Theme)
val LightBackground = Color(0xFFF7F5F0)      // Soothing warm cream alabaster
val LightSurface = Color(0xFFFFFFFF)         // Pure card surface
val LightSubpanel = Color(0xFFEFECE6)        // Inset subpanel
val LightElevated = Color(0xFFE5E0D5)        // Elevated light surface
val LightBorder = Color(0x1F22201D)          // Subtle dark border for light theme
val LightBorderHighlight = Color(0x3322201D)

// Hero Light Cream & Ivory Accents (Primary Brand Identity)
val LightCream = Color(0xFFF4EFE6)           // Signature warm cream / ivory
val LightCreamBright = Color(0xFFFAF7F2)     // Pure illuminated cream
val LightCreamMuted = Color(0xFFC7C0B3)      // Secondary warm cream
val LightCreamSubtle = Color(0xFF8C8578)     // Tertiary muted cream
val CreamSurface = Color(0xFFEDE8DF)         // Solid tactile cream surface
val CreamDark = Color(0xFF141311)            // Deep obsidian text on cream buttons

// Restrained Functional Accents (Earthy, Muted, Anti-Slop)
val WarmGold = Color(0xFFD8A868)             // Refined warm gold/amber
val SageGreen = Color(0xFF7EAA92)            // Muted sage green (good ping / pass)
val Terracotta = Color(0xFFD97762)           // Earthy terracotta (loss / warning)
val SlateBlue = Color(0xFF8B9DAF)            // Technical muted slate blue (upload)
val CharcoalMuted = Color(0xFF383531)        // Subtle hairline separator

// Legacy mappings for backwards-compatible engine & module styling
val NeonCyan = LightCream                    // Primary accent is now Warm Light Cream!
val NeonEmerald = SageGreen
val NeonViolet = WarmGold
val NeonBlue = SlateBlue
val NeonOrange = Terracotta
val NeonAmber = WarmGold
val NeonRose = Terracotta

// Typography Hierarchy (Clear contrast decay with warmth)
val TextPrimaryDark = Color(0xFFFAF7F2)      // Bright cream
val TextSecondaryDark = Color(0xFFC7C0B3)    // Warm cream
val TextMutedDark = Color(0xFF8C8578)        // Subtle warm grey

val TextPrimaryLight = Color(0xFF181715)
val TextSecondaryLight = Color(0xFF5A544A)
val TextMutedLight = Color(0xFF9E9789)
