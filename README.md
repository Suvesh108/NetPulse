<div align="center">

<img src="public/favicon.png" width="92" height="92" alt="NetPulse Logo" style="border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.35);" />

# ⚡ NetPulse PRO
### Enterprise-Grade Edge Network Telemetry & Real-Time Bandwidth Engine

[![Version](https://img.shields.io/badge/Release-v0.9-059669?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.9)
[![Android APK](https://img.shields.io/badge/Android_APK-v0.9-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.9)
[![Live Web App](https://img.shields.io/badge/Live_Web_App-net--pulse-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://net-pulse-iota.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare Anycast](https://img.shields.io/badge/Engine-Cloudflare_Anycast-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://speed.cloudflare.com/)
[![HTTP/3 QUIC](https://img.shields.io/badge/Protocol-HTTP%2F3_QUIC-7C3AED?style=flat-square&logo=internetexplorer&logoColor=white)](https://cloudflare.com/)
[![Security Hardened](https://img.shields.io/badge/Security-Hardened-10B981?style=flat-square&logo=shieldcheck&logoColor=white)](https://github.com/Suvesh108/NetPulse)

<br />

**[ 🌐 Launch Live Web App ](https://net-pulse-iota.vercel.app/)** &nbsp;•&nbsp;
**[ 📱 Download Android APK (v0.9) ](https://github.com/Suvesh108/NetPulse/releases/tag/v0.9)** &nbsp;•&nbsp;
**[ 📦 GitHub Releases ](https://github.com/Suvesh108/NetPulse/releases)** &nbsp;•&nbsp;
**[ 📄 MIT License ](LICENSE)**

<br />

---

</div>

## 📖 Executive Summary & Mission

Traditional speed test services are notorious for ad congestion, intrusive tracking beacons, artificial throughput smoothing, and restrictive local ISP routing biases. 

**NetPulse PRO** re-engineers network telemetry from first principles. By opening direct, unthrottled TCP and HTTP/3 QUIC socket streams against Cloudflare's global Anycast edge network (330+ points of presence), NetPulse measures raw packet transit times, bufferbloat loaded latency, and sustained inbound/outbound saturation with sub-millisecond precision. 

Whether diagnosing high-speed Gigabit fiber broadband, ultra-dense 5G NR carriers, or local Wi-Fi 6E/7 frequency congestion, NetPulse gives engineers and power users zero-latency observability without third-party advertisements or data harvesting.

---

## ⚡ Architecture & Telemetry Ingestion

```
                       ┌─────────────────────────────────────────────────────────┐
                       │                   NetPulse PRO Engine                   │
                       │           (React 19 • TypeScript • Capacitor)           │
                       └────────────────────────────┬────────────────────────────┘
                                                    │
                 ┌──────────────────────────────────┼──────────────────────────────────┐
                 ▼                                  ▼                                  ▼
   ┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
   │    Cloudflare Anycast     │      │   AWS CloudFront Global   │      │    Google Cloud Premium   │
   │      Edge POP Backbone    │      │     Edge Edge CDN Node    │      │       Edge PoP Tier       │
   ├───────────────────────────┤      ├───────────────────────────┤      ├───────────────────────────┤
   │ • HTTP/3 QUIC Streaming   │      │ • Multi-CDN Benchmarking  │      │ • Regional Latency Audits │
   │ • Bufferbloat A+ to F     │      │ • Node Winner Telemetry   │      │ • Geo-Proximity Routing   │
   │ • 90th Percentile Splines │      │ • TCP Handshake Drift     │      │ • Anycast Route Auditing  │
   └─────────────┬─────────────┘      └─────────────┬─────────────┘      └─────────────┬─────────────┘
                 │                                  │                                  │
                 └──────────────────────────────────┼──────────────────────────────────┘
                                                    ▼
                               ┌────────────────────────────────────────┐
                               │     Professional Diagnostics Suite     │
                               ├────────────────────────────────────────┤
                               │ • Bufferbloat Grade (A+ to F)          │
                               │ • DNS Shootout (Cloudflare vs Google)  │
                               │ • VoIP WebRTC Audio MOS Score          │
                               │ • 25-Probe Micro-Burst Timeline        │
                               │ • IPv4 vs IPv6 Dual-Stack Duel         │
                               │ • Path MTU (PMTUD) Frame Boundary      │
                               │ • Hop-by-Hop Edge Route & PoP Trace    │
                               │ • Wi-Fi RF Signal RSSI (-dBm) & SNR    │
                               │ • 1200x680 Verified Speed Certificate  │
                               │ • 100% In-App Background APK Updater   │
                               └────────────────────────────────────────┘
```

---

## 🚀 The 8 Professional Network Diagnostic Features (v0.9)

### 🌟 1. Bufferbloat Letter Grade (A+ to F)
- **Loaded Latency Delta**: Automatically compares idle unloaded latency against active saturation delay during download/upload phases.
- **Grading Standard**: Awards `A+` (<=5ms delta, zero bloat), `A` (<=15ms), `B` (<=30ms), `C` (<=60ms), `D` (<=120ms), or `F` (>120ms, severe buffer bloat) on the Speed Test console header and verified Speed Certificate.

### 🌟 2. DNS Resolver Speed Shootout (DoH)
- **Side-by-Side Resolver Benchmark**: Benchmarks lookups against the world's fastest recursive DNS resolvers using direct DNS-over-HTTPS queries (**Cloudflare 1.1.1.1**, **Google 8.8.8.8**, **Quad9 9.9.9.9**, and **OpenDNS 208.67.222.222**).
- **Automated Winner Badge**: Crowns the fastest DNS provider with microsecond response time differentials.

### 🌟 3. VoIP / WebRTC MOS Audio Quality (1.0 to 4.5)
- **ITU-T G.107 E-Model Scoring**: Computes real-time Mean Opinion Score (MOS) from live packet latency, jitter, and packet loss.
- **Readiness Rating**: Categorizes connection fidelity into *Crystal Clear (HD Voice & WebRTC)*, *High Quality*, *Acceptable*, or *Degraded*.

### 🌟 4. Timeline Packet Loss & Micro-Burst Logger
- **25-Probe Interactive Track**: Visualizes 25 discrete ping packets in a high-density timeline strip with individual probe RTTs and drop telemetry.
- **Micro-Burst Drop Detection**: Distinguishes between uniform random loss and burst drops caused by buffer overrun or router queuing bottlenecks.

### 🌟 5. IPv4 vs. IPv6 Dual-Stack Routing Duel
- **Protocol Audit**: Tests both stacks concurrently to detect whether your carrier routes via legacy Carrier-Grade NAT (CGNAT) or native dual-stack IPv6.
- **Latency Differential**: Highlights latency advantages when routing over modern IPv6 backbones.

### 🌟 6. Path MTU & Packet Fragmentation Analyzer (PMTUD)
- **Frame Boundary Probing**: Analyzes packet boundary handling across 1420 B (WireGuard/IPsec VPN), 1492 B (PPPoE DSL), 1500 B (Standard Ethernet/WAN), and 1508 B (Baby Jumbo Frame).
- **Overhead Calculation**: Detects packet fragmentation boundaries and tunnel encapsulation overhead.

### 🌟 7. Visual Hop-by-Hop Edge Route Trace
- **Edge Colocation Identification**: Identifies the nearest Anycast Tier-1 data center using IATA airport codes (e.g. DEL, BOM, SIN, FRA, LHR, SJC).
- **Carrier ASN & Protocol Telemetry**: Displays BGP Autonomous System numbers, ISP transit routing, HTTP/3 QUIC and TLS 1.3 protocol handshake states.

### 🌟 8. Wi-Fi RF Signal Analyzer (RSSI & SNR)
- **Calibrated RSSI Meter**: Measures RF signal strength in -dBm (from -30 dBm Pristine to -90 dBm Weak) with color-coded signal thresholds.
- **Signal-to-Noise Ratio (SNR)**: Calculates SNR margin (+dB) above ambient RF noise floor and provides actionable placement advice.

---

## 📊 Comparison: NetPulse PRO vs Traditional Speed Tests

| Feature | Legacy Speed Tests (Ookla / Fast) | NetPulse PRO v0.9 |
| :--- | :---: | :---: |
| **Telemetry Engine** | Third-party proxy / Sponsored nodes | **Direct Cloudflare Anycast HTTP/3 QUIC** |
| **Ad Bloat & Tracking** | ❌ Heavy banner ads & tracking scripts | **✅ 100% Zero Ads & Zero Tracking** |
| **Dual-Gauge Sparklines** | ❌ Sequential single-dial readout | **✅ Real-time dual Download & Upload splines** |
| **Bufferbloat Letter Grade** | ⚠️ Hidden or incomplete | **✅ Letter Grade (A+ to F) with buffer delta** |
| **VoIP WebRTC MOS Score** | ❌ Not available | **✅ ITU-T G.107 standard MOS (1.0 to 4.5)** |
| **Micro-Burst Loss Logger** | ❌ Single percentage average | **✅ 25-probe interactive timeline track** |
| **DNS Resolver Shootout** | ❌ Not available | **✅ Cloudflare vs Google vs Quad9 vs OpenDNS** |
| **IPv4 vs IPv6 Duel** | ❌ Not available | **✅ Dual-stack latency and CGNAT detection** |
| **Path MTU Analyzer** | ❌ Not available | **✅ PMTUD frame boundary analysis (1420-1508B)** |
| **Edge Route PoP Trace** | ❌ Not available | **✅ IATA airport colocation & ASN routing** |
| **Wi-Fi RSSI & SNR** | ❌ Not available | **✅ Calibrated -dBm meter & RF SNR ratio** |
| **Verified PNG Certificate** | ⚠️ Static watermarked screenshot | **✅ 1200x680 verified export card** |
| **Native Android App** | ⚠️ Ad-supported app store binary | **✅ Hardened APK with internal self-updater** |
| **Open Source** | ❌ Proprietary closed-source | **✅ 100% Open Source under MIT License** |

---

## 🔒 Security Architecture & Defensive Hardening

| Protection Layer | Technical Implementation | Security & Privacy Benefit |
| :--- | :--- | :--- |
| **Strict HTTPS Enforced** | `network_security_config.xml` (`cleartextTrafficPermitted="false"`) | Rejects plain-text unencrypted HTTP traffic to eliminate Man-in-the-Middle (MitM) attacks. |
| **DevTools Lockdown** | `webContentsDebuggingEnabled: false` | Disables USB debugging and inspector access in production Android releases. |
| **Backup Leak Prevention** | `android:allowBackup="false"` | Prevents `adb backup` extraction of local storage, cached results, and test history. |
| **Content Security Policy** | Strict CSP meta tags with `frame-ancestors 'none'` | Eliminates Cross-Site Scripting (XSS) and prevents iframe clickjacking. |
| **Code Obfuscation & R8** | ProGuard rules with log stripping (`Log.d`, `Log.v`) | Strips debug telemetry, stack signatures, and sensitive metadata from compiled binaries. |

---

## 📦 Native Android Package (NetPulse-v0.9.apk)

* **Direct APK Download**: [NetPulse-v0.9.apk (GitHub Release v0.9)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.9)
* **Latest Universal Binary**: [netpulse.apk (Direct Mirror)](https://github.com/Suvesh108/NetPulse/raw/main/netpulse.apk)
* **Package Name**: `com.netpulse.speedtest`
* **Target Android Version**: Android 15 (API Level 35)
* **Minimum Android Version**: Android 5.1 Lollipop (API Level 22)
* **Package Size**: ~5.15 MB (Ultra-lightweight)

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Core Framework** | React 19, TypeScript 5.8, Vite 6 |
| **Styling & Theming** | Tailwind CSS v4.1, Modern Glassmorphism, OLED Dark Mode |
| **Iconography & Motion** | Lucide Icons, Motion (Framer Motion v12) |
| **Network Engine** | @cloudflare/speedtest Web SDK, HTTP/3 Anycast Edge |
| **Mobile Runtime** | Capacitor 8 (Android Platform) |
| **Compilation** | OpenJDK 21 LTS, Gradle 8.14, Android SDK Build Tools 35.0.0 |

---

## 💻 Local Development & Build Guide

### Prerequisites
- **Node.js**: v18.0+ or v20.0+ (Node v20 LTS recommended)
- **npm** or **pnpm**
- **JDK 21 LTS** & **Android Studio / Command Line Tools** (for APK builds)

```bash
# 1. Clone the repository
git clone https://github.com/Suvesh108/NetPulse.git
cd NetPulse

# 2. Install dependencies
npm install

# 3. Start local development server (Accessible on local network via http://0.0.0.0:3000)
npm run dev

# 4. Compile optimized web production bundle
npm run build

# 5. Sync Capacitor Android project
npx cap sync android

# 6. Build release Android APK
cd android
./gradlew assembleDebug
```

Compiled APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📄 License & Intellectual Property

This project is open-source software licensed under the **[MIT License](LICENSE)**.

```
MIT License
Copyright (c) 2026 Suvesh Kumar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

See the full license terms in [LICENSE](LICENSE).

<div align="center">

---

**Crafted with precision by [Suvesh Kumar](https://github.com/Suvesh108)** • Built for edge speed enthusiasts worldwide.

</div>
