# NetPulse - Premium Edge Network Speed Test

NetPulse is a high-fidelity, premium web application designed to run real-time internet speed diagnostics directly against Cloudflare's Edge CDN. Built with modern web technologies, it features rich visual aesthetics, smooth animations, audio synthesis, and a single-window responsive layout.

---

## 🚀 Key Features

* **Real Edge Metrics**: Leverages `@cloudflare/speedtest` to measure true network latency, jitter, download, and upload speeds (bypassing public TURN credentials and CORS restrictions).
* **Sequential Testing Pacing**: Runs a structured 24-second timeline divided into four equal 6-second phases: Ping ➔ Jitter ➔ Download ➔ Upload.
* **Dynamic Speedometer & Synth Hum**: Includes an SVG speedometer dial and Web Audio Synth hum that scale dynamically with active download/upload speeds.
* **Persistent SVG Sparklines**: Renders independent download and upload speed curves that draw progressively from left to right and persist on-screen after the test completes.
* **Locking Protection**: Features state locks (`isTestingRef`) to prevent duplicate clicking and simultaneous engine triggers.
* **Unit Toggling**: Allows switching the display unit between Mbps (Megabits per second) and MB/s (Megabytes per second) directly in the navigation bar.
* **Responsive Single-Window Viewport**: Locks the layout to `100dvh` (Dynamic Viewport Height) on all devices, eliminating outer scrollbars and providing a native-app feel.
* **Diagnostic History Logs**: Automatically saves completed test results to HTML5 local storage for historical monitoring.

---

## 🛠️ Technology Stack

* **Frontend Framework**: React 19 (TypeScript)
* **Build Tool**: Vite 6
* **Styling**: Vanilla CSS & Tailwind CSS 4
* **Network Testing SDK**: `@cloudflare/speedtest`
* **Icons**: `lucide-react`
* **Animations**: Native CSS Transitions & Keyframes

---

## 📁 Project Structure

Below is the directory layout and overview of key files in the repository:

```text
netpulse/
├── dist/                       # Production build output
├── node_modules/               # Project dependencies
├── public/                     # Static assets (e.g. favicon)
├── src/                        # Application source files
│   ├── components/
│   │   ├── HistoryList.tsx     # Display of past test results with internal scrolling
│   │   ├── SettingsPanel.tsx   # Toggles for loaded latency & engine diagnostics
│   │   └── SpeedTest.tsx       # Core speed test dial, SVG sparklines, & sequencer
│   ├── App.tsx                 # Main layout, navigation tabs, & state synchronization
│   ├── constants.ts            # Global variables and default settings configurations
│   ├── index.css               # Core styling tokens, single-window layouts, & animations
│   ├── main.tsx                # React virtual DOM entry point
│   └── types.ts                # TypeScript interface declarations
├── .env.example                # Example environment variables file
├── .gitignore                  # Git untracked pattern definitions
├── index.html                  # Main HTML document template
├── package.json                # Project script commands and package dependencies
├── tsconfig.json               # TypeScript compiler config
└── vite.config.ts              # Vite asset bundler configuration
```

---

## 💻 Setup & Running Locally

### Prerequisites

Ensure you have **Node.js** (v18+) installed on your machine.

### Installation

1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/Suvesh108/NetPulse.git
   cd NetPulse
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Run the Vite development server locally:
   * **Windows (PowerShell)**:
     ```powershell
     npm.cmd run dev
     ```
   * **macOS / Linux**:
     ```bash
     npm run dev
     ```

4. Open your browser and navigate to `http://localhost:3000`.

### Production Build

To compile a highly optimized production bundle:

* **Windows (PowerShell)**:
  ```powershell
  npm.cmd run build
  ```
* **macOS / Linux**:
  ```bash
  npm run build
  ```

This will output static files into the `dist/` directory, ready to be served.
