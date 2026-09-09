<div align="center">

# ⚡ NetPulse — High-Performance Edge Network Speed Test & Telemetry

[![Version](https://img.shields.io/badge/version-0.8-blue.svg)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.8)
[![Android APK](https://img.shields.io/badge/Android-APK_v0.8-brightgreen.svg?logo=android)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.8)
[![SEO Optimized](https://img.shields.io/badge/SEO-Rank_1_Ready-blueviolet.svg)](https://github.com/Suvesh108/NetPulse)
[![Security Hardened](https://img.shields.io/badge/Security-Hardened-emerald.svg)](https://github.com/Suvesh108/NetPulse)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**NetPulse** is a next-generation internet speed testing and edge network diagnostic suite engineered for real-time bandwidth precision directly against Cloudflare's global Anycast and HTTP/3 QUIC backbones. Built with React 19, TypeScript, Tailwind CSS, and Capacitor for native Android deployment.

[📱 Download Android APK (v0.8)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.8) • [🌐 Live Web App](https://netpulse-iota.vercel.app/) • [📦 GitHub Releases](https://github.com/Suvesh108/NetPulse/releases)

---

</div>

## 📖 About NetPulse

**NetPulse** solves the inaccuracy and bloat of legacy speed tests by establishing direct, unthrottled TCP/QUIC streams to the nearest edge PoPs. Whether assessing high-speed fiber broadband, 5G mobile data, or local Wi-Fi 6 connectivity, NetPulse delivers sub-millisecond precision, loaded latency bufferbloat telemetry, and continuous stability ratings for 4K streaming and competitive online gaming.

---

## 🚀 Key Features in NetPulse v0.8

### 🌟 1. Responsive Dual-Gauge Speed Test on Android & Mobile
* **Unified Desktop-Fidelity Experience**: The Android APK now displays the authentic **"Your Internet Speed"** console with side-by-side **Download** (orange sparkline) and **Upload** (purple sparkline) metrics, live percentiles, and a compact 3-column telemetry bar (Latency, Jitter, Packet Loss).
* **Full Mobile Bottom Clearance**: Added spacious bottom clearance (`pb-28`) ensuring all measurement cards and Network Quality Score tiles remain fully accessible above the floating bottom navigation bar.

### 🌟 2. Fixed Dark Mode Box-Plot Track Contrast
* **Synchronized Dark Theme Contrast**: Replaced bright white/light-gray box plot tracks with theme-adaptive `bg-slate-100/80 dark:bg-slate-800/80` backgrounds, eliminating blinding gray blocks in dark mode across Download and Upload payload breakdowns.

### 🌟 3. Complete Mobile Bottom Navigation Typography
* **No Label Truncation**: Refined label sizing and typography in the floating bottom navigation dock, displaying **"DIAGNOSTICS"** completely without trailing ellipsis (`DIAGNOSTI...`).

### 🌟 4. In-App Direct APK Updater (No Browser Needed)
* **In-App Streaming Download**: Check for updates and download new `.apk` packages directly inside the Settings console with a real-time progress bar (`0% ➔ 100%`).
* **Auto-Install Trigger**: Automatically triggers the Android native package installer (`application/vnd.android.package-archive`) without opening Chrome.

### 🌟 5. Multi-Server CDN Benchmark (Cloudflare vs AWS vs Google Cloud)
* **Side-by-Side Cloud Comparison**: Concurrently probes **Cloudflare Anycast**, **AWS CloudFront**, and **Google Cloud CDN** to identify the lowest latency and highest throughput edge network in your geographical area.
* **Winner Node Detection**: Automatically awards the **Fastest Edge Network** badge based on real-time response times.

### 🌟 6. Live Gaming Latency Oscilloscope
* **Real-time Ping Waveform**: Continuously samples ping and jitter every second, rendering a live SVG waveform to capture micro-spikes.
* **Connection Stability Rating**: Calculates a percentage stability score (`99.4% Rock Solid`) to diagnose packet drops and frame lag during online gaming and video calls.

### 🌟 7. Shareable "Speed Certificate" Card (PNG Export)
* **Verified Network Badges**: Generates high-fidelity speed certificate cards displaying Download, Upload, Ping, Jitter, ISP, and application quality ratings.
* **One-Click Image Download**: Exports crystal-clear 1200x630 PNG images formatted for social media, technical support logs, or ISP verification tickets.

### 🌟 8. Wi-Fi & Channel Health Analyzer
* **Local Link Telemetry**: Inspects estimated Wi-Fi link speed, gateway RTT, and detected frequency band (`2.4 GHz`, `5.0 GHz`, or `6.0 GHz`).
* **Router Optimization Tips**: Provides intelligent guidance for optimal router placement and line-of-sight signal health.

---

## 🔒 Security Architecture & Defensive Hardening

| Protection Layer | Technical Specification | Security Benefit |
| :--- | :--- | :--- |
| **Strict HTTPS Enforced** | `network_security_config.xml` (`cleartextTrafficPermitted="false"`) | Rejects unencrypted HTTP traffic to eliminate Man-in-the-Middle (MitM) sniffing. |
| **DevTools Lockdown** | `webContentsDebuggingEnabled: false` | Blocks USB Chrome DevTools debugging in production builds. |
| **Backup Leak Prevention** | `android:allowBackup="false"` | Prevents `adb backup` extraction of app tokens and diagnostic history. |
| **Content Security Policy** | Strict CSP meta tags with `frame-ancestors 'none'` | Eliminates Cross-Site Scripting (XSS) and iframe clickjacking. |
| **Code Obfuscation & R8** | ProGuard rules with log stripping (`Log.d`, `Log.v`) | Removes debug telemetry from compiled binaries. |

---

## 📦 Native Android App (`NetPulse-v0.8.apk`)

* **Direct APK Download**: [NetPulse-v0.8.apk (GitHub Release v0.8)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.8)
* **Package Name**: `com.netpulse.speedtest`
* **Target SDK**: Android 15 (API Level 35)
* **Minimum SDK**: Android 5.1 (API Level 22)
* **Size**: `~5.1 MB`

---

## 🛠️ Technology Stack

* **Frontend**: React 19 (TypeScript), Tailwind CSS 4, Lucide Icons
* **Mobile Runtime**: Capacitor 8 (Android Platform)
* **Diagnostic Engine**: `@cloudflare/speedtest` Web SDK
* **Build Tooling**: Vite 6, OpenJDK 21 LTS, Gradle 8.14

---

## 💻 Local Development & Build Instructions

```bash
# 1. Clone repository
git clone https://github.com/Suvesh108/NetPulse.git
cd netpulse

# 2. Install dependencies
npm install

# 3. Start local development server (Accessible on LAN: http://0.0.0.0:3000)
npm run dev

# 4. Build production web bundle
npm run build

# 5. Sync and build Android APK
npx cap sync android
cd android
./gradlew assembleDebug
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
