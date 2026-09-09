<div align="center">

<img src="public/favicon.png" width="92" height="92" alt="NetPulse Logo" style="border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.35);" />

# ⚡ NetPulse PRO
### Enterprise-Grade Edge Network Telemetry & Real-Time Bandwidth Engine

[![Version](https://img.shields.io/badge/Release-v0.8-059669?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.8)
[![Android APK](https://img.shields.io/badge/Android_APK-v0.8-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.8)
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
**[ 📱 Download Android APK (v0.8) ](https://github.com/Suvesh108/NetPulse/releases/tag/v0.8)** &nbsp;•&nbsp;
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
   │ • Loaded Bufferbloat RTT  │      │ • Node Winner Telemetry   │      │ • Geo-Proximity Routing   │
   │ • 90th Percentile Splines │      │ • TCP Handshake Drift     │      │ • Anycast Route Auditing  │
   └─────────────┬─────────────┘      └─────────────┬─────────────┘      └─────────────┬─────────────┘
                 │                                  │                                  │
                 └──────────────────────────────────┼──────────────────────────────────┘
                                                    ▼
                               ┌────────────────────────────────────────┐
                               │       Hardware & Link Diagnostics      │
                               ├────────────────────────────────────────┤
                               │ • 1 Hz Gaming Latency Oscilloscope     │
                               │ • Wi-Fi Band Detection (2.4/5.0/6.0G)  │
                               │ • 1200x630 Verified Speed Certificate  │
                               │ • 100% In-App Background APK Updater   │
                               └────────────────────────────────────────┘
```

---

## 🚀 Key Highlights & Capabilities (v0.8)

### 🌟 1. Responsive Dual-Gauge Speed Console
- **Unified Desktop & Android APK Fidelity**: Displays simultaneous, real-time **Download** (vibrant amber-orange sparkline) and **Upload** (purple sparkline) curves with mathematically calculated 90th percentile boundary indicators.
- **Adaptive Telemetry Dock**: Latency, jitter, and packet delivery loss automatically format into an ultra-compact 3-column dock on mobile devices and a full telemetry column on widescreen monitors.
- **Touch-Optimized Controls**: High-contrast action bar with quick Start Test / Retest, instant URL result sharing, and multi-phase progress filters (Latency | Jitter | Download | Upload).

### 🌟 2. Fixed Dark Mode Box-Plot Track Contrast
- **Deep OLED Dark Theme (#030712)**: Replaced harsh light-gray box-plot tracks with theme-synchronized g-slate-100/80 dark:bg-slate-800/80 backgrounds, providing comfortable, glare-free telemetry inspections during nighttime audits.
- **Payload Distribution Whisker Plots**: Accurately visualizes min, Q1, median, Q3, and max bandwidth velocity across 100 kB, 1 MB, 10 MB, and 25 MB sample chunks.

### 🌟 3. Multi-Cloud Edge CDN Benchmark
- **Concurrent Edge Testing**: Directly pits **Cloudflare Anycast**, **AWS CloudFront**, and **Google Cloud CDN** against each other in real-time.
- **Winner Detection**: Awards an automated **Fastest Edge Network** badge with microsecond response differential metrics.

### 🌟 4. Continuous Gaming Latency Oscilloscope
- **Real-Time 1 Hz Waveform**: Samples real-world packet latency every second to expose micro-stutters, ping spikes, and ISP throttling invisible to average speed tests.
- **Rock-Solid Stability Rating**: Generates percentage-based gaming and VoIP stability assessments (e.g. 99.8% Rock Solid).

### 🌟 5. Shareable "Speed Certificate" Cards
- **Verified Network Cards**: Generates high-resolution 1200x630 cryptographic-styled diagnostic summary cards featuring connection speeds, bufferbloat indicators, and ISP edge notes.
- **One-Click PNG Export**: Download instant PNG images engineered for social sharing, technical ISP support tickets, or billing disputes.

### 🌟 6. Wi-Fi & Channel Health Diagnostic
- **Local Link Inspection**: Measures Wi-Fi link speed, gateway RTT, and detected frequency bands (2.4 GHz, 5.0 GHz, 6.0 GHz).
- **Signal Optimization Tips**: Provides intelligent recommendations for router placement, interference mitigation, and channel congestion reduction.

### 🌟 7. 100% In-App Internal APK Self-Updater
- **Zero Browser Redirects**: Android APK users can check for releases, stream background APK updates with live progress percentage indicators, and invoke the system package installer entirely within the app.

---

## 📊 Comparison: NetPulse PRO vs Traditional Speed Tests

| Feature | Legacy Speed Tests (Ookla / Fast) | NetPulse PRO |
| :--- | :---: | :---: |
| **Telemetry Engine** | Third-party proxy / Sponsored nodes | **Direct Cloudflare Anycast HTTP/3 QUIC** |
| **Ad Bloat & Tracking** | ❌ Heavy banner ads & tracking scripts | **✅ 100% Zero Ads & Zero Tracking** |
| **Dual-Gauge Sparklines** | ❌ Sequential single-dial readout | **✅ Real-time dual Download & Upload splines** |
| **Loaded Bufferbloat Latency** | ⚠️ Partial or hidden | **✅ Detailed unloaded & loaded latency bars** |
| **Multi-CDN Benchmark** | ❌ Single selected server | **✅ Side-by-side Cloudflare vs AWS vs Google** |
| **Gaming Ping Oscilloscope** | ❌ One-time ping average | **✅ Live continuous 1 Hz waveform monitor** |
| **Verified PNG Certificate** | ⚠️ Static watermarked screenshot | **✅ 1200x630 verified export card** |
| **Native Android App** | ⚠️ Ad-supported app store binary | **✅ Hardened APK with internal self-updater** |
| **Open Source** | ❌ Proprietary closed-source | **✅ 100% Open Source under MIT License** |

---

## 🔒 Security Architecture & Defensive Hardening

| Protection Layer | Technical Implementation | Security & Privacy Benefit |
| :--- | :--- | :--- |
| **Strict HTTPS Enforced** | 
etwork_security_config.xml (cleartextTrafficPermitted="false") | Rejects plain-text unencrypted HTTP traffic to eliminate Man-in-the-Middle (MitM) attacks. |
| **DevTools Lockdown** | webContentsDebuggingEnabled: false | Disables USB debugging and inspector access in production Android releases. |
| **Backup Leak Prevention** | ndroid:allowBackup="false" | Prevents db backup extraction of local storage, cached results, and test history. |
| **Content Security Policy** | Strict CSP meta tags with rame-ancestors 'none' | Eliminates Cross-Site Scripting (XSS) and prevents iframe clickjacking. |
| **Code Obfuscation & R8** | ProGuard rules with log stripping (Log.d, Log.v) | Strips debug telemetry, stack signatures, and sensitive metadata from compiled binaries. |

---

## 📦 Native Android Package (NetPulse-v0.8.apk)

* **Direct APK Download**: [NetPulse-v0.8.apk (GitHub Release v0.8)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.8)
* **Latest Universal Binary**: [netpulse.apk (Direct Mirror)](https://github.com/Suvesh108/NetPulse/raw/main/netpulse.apk)
* **Package Name**: com.netpulse.speedtest
* **Target Android Version**: Android 15 (API Level 35)
* **Minimum Android Version**: Android 5.1 Lollipop (API Level 22)
* **Package Size**: 5.12 MB (Ultra-lightweight)

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
