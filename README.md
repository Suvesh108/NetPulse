<div align="center">

<img src="public/favicon.png" width="96" height="96" alt="NetPulse Logo" style="border-radius: 22px; box-shadow: 0 10px 30px -5px rgba(6, 182, 212, 0.4);" />

# NetPulse

### Carrier-Grade Edge Network Telemetry & Real-Time Bandwidth Engine

[![Version](https://img.shields.io/badge/Release-v1.2-06b6d4?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Suvesh108/NetPulse/releases/tag/v1.2)
[![Android APK](https://img.shields.io/badge/Android_APK-v1.2_Kotlin-3DDC84?style=for-the-badge&logo=android&logoColor=white)](release/NetPulse-v1.2.apk)
[![Windows App](https://img.shields.io/badge/Windows_Desktop-v1.2-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/Suvesh108/NetPulse/releases/download/v1.2/NetPulse-Windows-v1.2.zip)
[![Live Web App](https://img.shields.io/badge/Live_Web_App-net--pulse-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://net-pulse-iota.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)

<br />

[![Jetpack Compose](https://img.shields.io/badge/Android-100%25_Jetpack_Compose-4285F4?style=flat-square&logo=jetpackcompose&logoColor=white)](https://developer.android.com/jetpack/compose)
[![Kotlin](https://img.shields.io/badge/Language-Kotlin_2.0-7F52FF?style=flat-square&logo=kotlin&logoColor=white)](https://kotlinlang.org/)
[![React 19](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Electron](https://img.shields.io/badge/Desktop-Electron_44-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Cloudflare Anycast](https://img.shields.io/badge/Engine-Cloudflare_Anycast-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://speed.cloudflare.com/)
[![HTTP/3 QUIC](https://img.shields.io/badge/Protocol-HTTP%2F3_QUIC-7C3AED?style=flat-square&logo=internetexplorer&logoColor=white)](https://cloudflare.com/)

<br />

**[ 🌐 Launch Web App ](https://net-pulse-iota.vercel.app/)** &nbsp;•&nbsp;
**[ 📱 Download Android APK (v1.2) ](release/NetPulse-v1.2.apk)** &nbsp;•&nbsp;
**[ 💻 Download Windows Desktop (v1.2) ](https://github.com/Suvesh108/NetPulse/releases/download/v1.2/NetPulse-Windows-v1.2.zip)** &nbsp;•&nbsp;
**[ 📦 GitHub Releases ](https://github.com/Suvesh108/NetPulse/releases)** &nbsp;•&nbsp;
**[ 📄 MIT License ](LICENSE)**

<br />

---

</div>

## 📌 Overview

**NetPulse** is a high-precision, carrier-grade network telemetry engine and speed diagnostics suite engineered for Gigabit broadband, 5G NR carriers, Wi-Fi 6E/7 frequency bands, and enterprise WAN backbones.

Unlike commercial speed tests that suffer from ad bloat, tracking scripts, artificial throughput smoothing, and ISP-sponsored local routing, NetPulse connects directly to Cloudflare's Anycast edge network (330+ global PoPs) over raw HTTP/3 QUIC and TCP socket streams. It delivers sub-millisecond precision, bufferbloat loaded latency measurements, and deep packet diagnostics without third-party surveillance.

Available across **Native Android (100% Jetpack Compose in pure Kotlin)**, **Windows Desktop (Electron 44)**, and **Modern Web (React 19 & Tailwind CSS v4)**.

---

## ⚡ Core Diagnostic Engines & Features

### 🚀 1. Real-Time Speed Cockpit
* **Dynamic 180° Dome Speedometer**: Wide visual arc with auto-ranging scale expansion (10 Mbps to 10 Gbps) and phase peak latching.
* **Dual Real-Time Splines**: Continuous Bézier curve visualization for download and upload throughput trajectories.
* **Bufferbloat Loaded Latency**: Measures real-time latency under full network saturation compared against idle baseline delay.
* **Live Telemetry Badges**: Instant readouts for jitter, packet loss percentage, public IP colocation, and carrier Autonomous System Number (ASN).

### 🔬 2. Edge Diagnostics Suite
* **Bufferbloat Letter Grade (A+ to F)**: Automated grading based on bufferbloat loaded latency delta ($A+\le 5\,\text{ms}$, $A\le 15\,\text{ms}$, $B\le 30\,\text{ms}$, $C\le 60\,\text{ms}$, $D\le 120\,\text{ms}$, $F>120\,\text{ms}$).
* **DNS Resolver Speed Shootout**: Parallel DNS-over-HTTPS (DoH) latency benchmarks comparing Cloudflare (`1.1.1.1`), Google (`8.8.8.8`), Quad9 (`9.9.9.9`), and OpenDNS (`208.67.222.222`).
* **VoIP & WebRTC MOS Score**: ITU-T G.107 standard Mean Opinion Score calculation ($1.0$ to $4.5$) assessing real-time call and video conferencing fidelity.
* **25-Probe Micro-Burst Loss Timeline**: High-density sequential ping strip detecting burst packet drops vs. steady random packet loss.
* **IPv4 vs. IPv6 Dual-Stack Duel**: Direct concurrent latency comparison highlighting Carrier-Grade NAT (CGNAT) overhead and modern IPv6 routing gains.
* **Path MTU & Frame Fragmentation (PMTUD)**: Probes packet boundaries across 1420 B (WireGuard/VPN), 1492 B (PPPoE DSL), 1500 B (Standard Ethernet), and 1508 B (Baby Jumbo).
* **Hop-by-Hop Edge Route Trace**: Identifies nearest Anycast Tier-1 edge data centers using IATA airport codes (e.g., DEL, BOM, SIN, FRA, LHR, SJC).
* **Wi-Fi RF Signal Analyzer**: Native RSSI signal strength meter in $-\text{dBm}$ with Signal-to-Noise Ratio (SNR) calculations.

### 📜 3. Verified Diagnostic Speed Certificate
* Generates a cryptographic $1200\times 680$ diagnostic summary card containing upload/download bandwidth, bufferbloat grade, jitter, server location, carrier metadata, and verification hash.
* One-click instant high-resolution PNG export and system clipboard sharing.

### 🔄 4. Native In-App OTA Update Engine
* Background checking against GitHub Releases with instant version comparison.
* In-app download progress indicator with seamless `FileProvider` package installer invocation.
* **Permanent Keystore Signature**: Built and signed with a permanent release keystore (valid through 2054) to eliminate any update conflict or signature mismatch issues.

### 📊 5. Audit History & Analytics
* Persistent local audit logs with detailed breakdown of all past test sessions.
* Instant CSV and JSON telemetry export for ISP service disputes or network performance tracking.

### ⚙️ 6. Engine Configuration Console
* Configurable parallel socket streams (1 to 16 threads).
* Selectable test payload sizes and ping sample intervals.
* Custom DNS resolver targeting and diagnostic timeout adjustments.

---

## 📱 Native Android App (Jetpack Compose)

The Android application is written in **100% idiomatic Kotlin** using modern **Jetpack Compose Material 3** — completely free of legacy WebViews or Cordova wrappers.

### Android Engine Specifications
* **UI Toolkit**: Jetpack Compose Material 3 with OLED dark palette and neon cyan telemetry accents.
* **Networking**: Direct `OkHttpClient` with coroutine-driven non-blocking I/O.
* **Graphics**: Custom hardware-accelerated Canvas speedometer and spline path interpolation.
* **Package Name**: `com.netpulse.speedtest`
* **Target SDK**: Android 15 (API Level 35)
* **Minimum SDK**: Android 7.0 Nougat (API Level 24)
* **Permanent Keystore Fingerprint**:
  ```
  SHA-256: 04:EF:E6:B0:6A:3D:D0:AD:BD:1D:60:FB:55:80:04:C3:DD:B7:A9:66:A0:BD:B9:69:D3:3A:C7:B3:F7:BF:31:81
  ```

### Direct Download
The latest official release APK is kept organized in the dedicated [`release/`](release/) directory:
* **[Download NetPulse-v1.2.apk](release/NetPulse-v1.2.apk)** (~13 MB)

---

## 📊 Feature Comparison

| Capability | Legacy Tools (Ookla / Fast) | NetPulse v1.2 |
| :--- | :---: | :---: |
| **Telemetry Backbone** | Third-party sponsored proxy nodes | **Direct Cloudflare Anycast HTTP/3 Edge** |
| **Ads & Trackers** | ❌ Banner ads, tracking scripts, bloat | **✅ 100% Zero Ads & Zero Tracking** |
| **Dual Real-Time Splines** | ❌ Sequential dial without curve retention | **✅ Live concurrent Bézier spline graphs** |
| **Bufferbloat Letter Grade** | ⚠️ Incomplete or absent | **✅ Industry standard (A+ to F)** |
| **VoIP / WebRTC MOS Score** | ❌ Unavailable | **✅ ITU-T G.107 standard (1.0 to 4.5)** |
| **Micro-Burst Drop Logger** | ❌ Single blended average | **✅ 25-probe interactive packet track** |
| **DNS Resolver Shootout** | ❌ Unavailable | **✅ 4-way parallel DoH benchmark** |
| **IPv4 vs IPv6 Duel** | ❌ Unavailable | **✅ Dual-stack routing & CGNAT detection** |
| **Path MTU (PMTUD) Analyzer** | ❌ Unavailable | **✅ 1420 B – 1508 B frame boundary probe** |
| **Edge Route PoP Trace** | ❌ Unavailable | **✅ IATA airport colocation identification** |
| **Verified PNG Certificate** | ⚠️ Low-res watermarked screen | **✅ 1200x680 cryptographic export card** |
| **Native Mobile App** | ⚠️ Ad-supported hybrid app | **✅ 100% Jetpack Compose Kotlin APK** |
| **OTA Self-Updating** | ❌ App store dependency only | **✅ Native in-app GitHub release updater** |
| **Open Source** | ❌ Closed-source proprietary | **✅ 100% Open Source under MIT License** |

---

## 🛠️ Technology Stack

| Platform / Layer | Technology |
| :--- | :--- |
| **Android Native** | Kotlin 2.0, Jetpack Compose Material 3, AndroidX Lifecycle, OkHttp 4 |
| **Web Application** | React 19, TypeScript 5.8, Tailwind CSS v4.1, Lucide React, Motion |
| **Desktop Application** | Electron 44, Chromium 132, Node.js 22 LTS |
| **Network Engine** | Cloudflare Anycast HTTP/3 QUIC, DNS-over-HTTPS (DoH), STUN RFC 5389 |
| **Build Tools** | Vite 6, Gradle 8.14, Android SDK Build Tools 35.0.0, OpenJDK 21 LTS |

---

## 🚀 Getting Started & Local Build

### 1. Web Application

```bash
# Clone the repository
git clone https://github.com/Suvesh108/NetPulse.git
cd netpulse

# Install dependencies
npm install

# Start local development server
npm run dev

# Build production web bundle
npm run build
```

### 2. Windows Desktop Application

```bash
# Launch Electron in development
npm run electron:start

# Package Windows desktop binary
npm run build:win
```

### 3. Android Native APK

```bash
cd android

# Compile debug APK
./gradlew assembleDebug

# Compile signed release APK
./gradlew assembleRelease
```

The compiled release APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete details.

```
MIT License
Copyright (c) 2026 Suvesh Kumar
```

<div align="center">

---

**Crafted with precision by [Suvesh Kumar](https://github.com/Suvesh108)** • Built for edge performance enthusiasts worldwide.

</div>
