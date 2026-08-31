<div align="center">

# ⚡ NetPulse — High-Performance Edge Network Speed Test

[![Version](https://img.shields.io/badge/version-0.1-blue.svg)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.1)
[![Android APK](https://img.shields.io/badge/Android-APK_v0.1-brightgreen.svg?logo=android)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.1)
[![Security Hardened](https://img.shields.io/badge/Security-Hardened-emerald.svg)](https://github.com/Suvesh108/NetPulse)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**NetPulse** is a high-fidelity speed testing suite designed for real-time edge bandwidth diagnostics directly against Cloudflare's global Anycast backbone. Built with React 19, TypeScript, Tailwind CSS, and Capacitor for native Android deployment.

[📱 Download Android APK (v0.1)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.1) • [🌐 Web Repository](https://github.com/Suvesh108/NetPulse)

---

</div>

## 🚀 Key Features

### 📡 Diagnostic Engine
* **Cloudflare Anycast & QUIC Backbone**: Direct connection to global edge PoPs measuring true download, upload, ping, and jitter.
* **Loaded Latency & Bufferbloat Probing**: Measures network bufferbloat response during simultaneous heavy download and upload streams (`↓`, `↑`).
* **Multi-Payload Box Plot Telemetry**: Measures throughput across staged payload distributions (`100 kB`, `1 MB`, `10 MB`, `25 MB`).
* **Real-time Spline Area Waveform**: Smooth SVG spline graphing dynamically rendering the continuous throughput curves.
* **Network Quality Score (AIM Assessment)**: Generates readiness ratings for **4K Ultra HD Video Streaming**, **Competitive Online Gaming**, and **HD Video Conferencing**.

### 📱 Dedicated Mobile-First Interface
* **Zero Collision Header**: Isolated navigation bar ensuring brand logos and unit toggle selectors never overlap on narrow mobile viewports.
* **Full-Width Touch Controls**: Large thumb-friendly test trigger with touch scale micro-interactions.
* **Detailed Mobile Diagnostic Cards**: Complete breakdown including Upload Measurements, Download Measurements, Latency Measurements, and Packet Delivery ratios.
* **Floating Bottom Navigation Dock**: Frosted glass backdrop dock providing fluid navigation between Speed Test, History, and Engine Settings.

---

## 🔒 Security Architecture & APK Hardening

The NetPulse native Android APK (`NetPulse-v0.1.apk`) has been defensively hardened against common mobile vulnerabilities:

| Protection Mechanism | Configuration | Security Benefit |
| :--- | :--- | :--- |
| **Strict HTTPS Transport** | `network_security_config.xml` (`cleartextTrafficPermitted="false"`) | Blocks unencrypted HTTP traffic and prevents Man-in-the-Middle (MitM) sniffing or packet injection. |
| **USB Debugging Lockdown** | `webContentsDebuggingEnabled: false` | Disables remote Chrome DevTools debugging on production builds, preventing runtime memory/DOM inspection via USB. |
| **Backup Extraction Prevention** | `android:allowBackup="false"` & `android:fullBackupContent="false"` | Disallows `adb backup` extraction of local storage, cached test logs, or session tokens. |
| **Content Security Policy (CSP)** | Strict `<meta http-equiv="Content-Security-Policy">` | Restricts script, style, and connect origins to verified domains, eliminating XSS and malicious script injection. |
| **Mixed Content Blocking** | `allowMixedContent: false` | Rejects insecure HTTP resources from being requested inside HTTPS contexts. |
| **Code Obfuscation & Log Stripping** | ProGuard / R8 Rules (`proguard-rules.pro`) | Strips debugging logs (`Log.d`, `Log.v`) and obfuscates internal application class hierarchies. |
| **Principle of Least Privilege** | Minimal Android permissions | Strictly requests `INTERNET` and `ACCESS_NETWORK_STATE` with zero unnecessary hardware permissions. |

---

## 📦 Native Android App (`NetPulse-v0.1.apk`)

Directly download and install the latest compiled APK:

* **Download**: [NetPulse-v0.1.apk (GitHub Release v0.1)](https://github.com/Suvesh108/NetPulse/releases/tag/v0.1)
* **Package ID**: `com.netpulse.speedtest`
* **Target Android SDK**: Android 15 (API level 35)
* **Minimum Android SDK**: Android 5.1 (API level 22)

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS
* **Native Mobile Bridge**: Capacitor 8 (Android Platform)
* **Speed Test SDK**: `@cloudflare/speedtest`
* **Build System**: Vite 6, Gradle 8.14, OpenJDK 21 LTS
* **Icons**: `lucide-react`

---

## 💻 Local Development Setup

### 1. Prerequisites
* Node.js 18+ and npm
* OpenJDK 21 LTS
* Android SDK (API 35)

### 2. Clone and Install
```bash
git clone https://github.com/Suvesh108/NetPulse.git
cd netpulse
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
*(Server will start on `http://localhost:3000` and `http://0.0.0.0:3000` for local mobile testing)*

### 4. Build Production Web Bundle & Android APK
```bash
# Build web production bundle
npm run build

# Sync assets to Capacitor Android
npx cap sync android

# Build native Android APK
cd android
./gradlew assembleDebug
```
The compiled APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
