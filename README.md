# HOsNote — Patient Handover & Location Tracker

A zero-backend, zero-internet **Progressive Web App (PWA)** for medical teams to track patient Ward & Bed assignments, document care notes, and hand over between shifts — syncing data between devices using QR codes. Also available as a native Android app via Capacitor.

> **Works fully offline. No server. No account. No internet.**

---

## Features

| Feature | Description |
|---|---|
| 📋 Patient Dashboard | Cards showing Ward + Bed + Name + Hospital No. with color-coded team badges |
| ➕ Add / Edit | Form with Ward, Bed, Name, Hospital No., Admission Date, Notes & Critical flag |
| 🔁 Duplicate Detection | Blocks duplicate Hospital Numbers and Ward+Bed combinations |
| 🗂️ Team Tabs | **My Team**, **On Call**, and **Mortalities** lists |
| 💀 Mortality Records | Archive deceased patients with a dedicated mortality log |
| 🚪 Discharge Tracking | Records discharges per team with a resettable stats counter |
| 📓 Notebook / Docs | Per-patient documentation notes with color tags (composable & editable) |
| 🗑️ Removal Choice | Discharging a patient prompts *Discharge* vs *Mortality* |
| ↩️ Undo | Recent destructive actions can be undone via a toast |
| 🌙 Dark Mode | System-aware light/dark theme toggle |
| 📱 Export via QR | Generates a scannable QR code from the patient list |
| 📲 Chunked QR | Large patient lists are split into multiple QR codes for full capacity |
| 📷 Import via Scan | Camera scanner merges & deduplicates incoming patients |
| ⚠️ Conflict Review | Incoming duplicates are surfaced for skip / add-new / update |
| 💾 Backup & Restore | Copy/paste full JSON backup, or restore from a backup |
| 🖨️ Handover Report | Print-friendly handover sheet (browser print) |
| 📋 Copy / Share | Web Share API with clipboard fallback |
| 🔍 Patient Search | Real-time search across patients with URL-synced query |
| 🎤 Speech-to-Text | Voice input for patient notes via Web Speech API |
| ⚡ Speed Dial FAB | Quick-access floating action button for common actions |
| 👁️ Patient Detail Modal | Full patient details view with edit & documentation |
| 🎓 Interactive Tour | Step-by-step spotlight tour for first-time users |
| 🎮 Demo Mode | Built-in demo data for showcasing features |
| ⚙️ Settings | App settings and preferences |
| 💬 Feedback | In-app feedback modal |
| 📲 PWA Installable | Add to Home Screen on Android & iOS |
| 🤖 Android App | Native Android build via Capacitor with camera, microphone, and wake-lock support |
| 📊 Analytics | Vercel Analytics & Speed Insights (privacy-friendly) |

---

## Tech Stack

- **React 18** + **Vite 6**
- **React Router DOM 6** — client-side routing with deep-link support
- **Tailwind CSS 3** — utility-first styling
- **Lucide React** — icons
- **qrcode.react** — QR code generation
- **html5-qrcode** — camera-based QR scanning
- **idb-keyval** — IndexedDB persistence (with `localStorage` migration)
- **vite-plugin-pwa** — service worker & manifest
- **@capacitor/core** + **@capacitor/android** — native Android wrapper
- **@capacitor/filesystem** — file system access for backups
- **@capacitor/share** — native share sheet integration
- **@vercel/analytics** + **@vercel/speed-insights** — usage analytics

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- Android SDK (only for building the native Android app)

### Install & Run (Web)

```bash
git clone <repo-url>
cd hosnote
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Production Build (Web)

```bash
npm run build
npm run preview
```

The build output in `dist/` is fully static — deploy anywhere (Nginx, GitHub Pages, Netlify, Vercel, etc.).

### Android (Capacitor)

```bash
npm run build
npx cap copy android
npx cap open android
```

The Android app requests the following permissions (declared in `AndroidManifest.xml`):
- **CAMERA** — QR code scanning
- **RECORD_AUDIO** — speech-to-text input
- **INTERNET** — required for Android SpeechRecognition service
- **WAKE_LOCK** — keep screen awake during QR scanning and transfers
- **ACCESS_NETWORK_STATE** — check connectivity before speech recognition

---

## Routing

The app uses React Router with deep-link support. Key routes:

| Route | Description |
|---|---|
| `/` | Redirects to `/team/my_team` |
| `/team/:tab` | Patient list by team tab (my_team, on_call, mortalities) |
| `/team/:tab/add` | Add a new patient |
| `/team/:tab/edit` | Edit selected patient |
| `/team/:tab/handover` | Handover report view |
| `/team/:tab/handover/:name` | Handover report for a specific patient |
| `/team/:tab/receive` | Receive patients via QR scan |
| `/team/:tab/receive/:name` | Receive patients for a specific patient |
| `/mortalities` | Mortality records archive |
| `/discarded-drafts` | Discarded documentation drafts |
| `/settings` | App settings |
| `/search` | Search results |
| `/demo` | Demo mode |
| `/notebook` | Documentation notebook |
| `/notebook/add` | Add a documentation note |
| `/notebook/edit` | Edit a documentation note |
| `/notebook/handover` | Notebook handover report |
| `/notebook/receive` | Notebook receive via QR scan |

> **Note:** The route `/team/:tab/recieve` (misspelled) is kept as a backwards-compatible alias for `/receive`.

On native (Capacitor) platforms, `HashRouter` is used instead of `BrowserRouter` to avoid issues with the native webview.

---

## QR Sync Flow

```
Device A                        Device B
───────                         ───────
[Export QR] → QR modal          [Import / Scan]
              shows QR  ──────► camera reads QR
                                parses JSON
                                merges patients
                                (deduplicates)
```

**QR payload format** (minimized for maximum capacity — notes excluded from QR to keep density low):
```json
[{"w":"A1","b":"12","n":"Adebayo","h":"HOS-001","c":true}]
```

For large patient lists, the export is split into **chunked QR codes** — each chunk is a separate scannable QR, and the scanner reassembles them automatically.

The full copy/paste backup includes notes, mortality records, discharges, and documentation:
```json
[{"w":"A1","b":"12","n":"Adebayo","h":"HOS-001","t":"On oxygen","c":true,"reason":"mortality","removedAt":"...","ad":"2026-07-09"}]
```

---

## Data & Privacy

- All data is stored **on the device** using **IndexedDB** (via `idb-keyval`). Nothing is ever sent to any server.
- Legacy installs that used `localStorage` are automatically migrated to IndexedDB on first load.
- The only network requests are anonymous, aggregate analytics pings to Vercel (no patient data is transmitted).
- Because data is local, use **Export → Backup** (copy/paste JSON) or QR sync to move data between devices.

---

## Project Structure

```
src/
├── App.jsx                  # State, IndexedDB persistence, actions, undo history
├── main.jsx                 # React entry point, routing, conditional analytics
├── index.css                # Global styles + component classes
├── context/
│   └── SearchContext.jsx    # Search state with URL & sessionStorage sync
├── components/
│   ├── Header.jsx           # Title, dark-mode toggle, feedback, page nav
│   ├── BottomNav.jsx        # Bottom navigation (Patients / Notebook)
│   ├── SpeedDialFAB.jsx     # Quick-access floating action button
│   ├── AddPatientForm.jsx   # Ward + Bed + Name + Hosp No. + Notes + Critical
│   ├── PatientCard.jsx      # Individual patient display
│   ├── PatientList.jsx      # Card list with selection & review
│   ├── PatientDetailModal.jsx # Full patient details view
│   ├── PatientActionBar.jsx # Action bar for selected patients
│   ├── ExportModal.jsx      # QR generation, copy/share, backup/restore, print
│   ├── ScannerComponent.jsx # Camera scanner (with cleanup)
│   ├── ReviewDuplicatesModal.jsx # Import conflict resolution
│   ├── DuplicatePromptModal.jsx  # Duplicate detection prompt
│   ├── RemovalChoiceDialog.jsx   # Discharge vs Mortality choice
│   ├── ConfirmDialog.jsx    # Reusable confirm modal
│   ├── FeedbackModal.jsx    # User feedback
│   ├── NotebookPage.jsx     # Documentation list view
│   ├── DocComposer.jsx      # Per-patient note composer
│   ├── SearchResultsPage.jsx # Search results display
│   ├── SettingsModal.jsx    # App settings
│   ├── DemoBanner.jsx       # Demo mode banner
│   ├── AppDemoModal.jsx     # Interactive demo modal
│   ├── InteractiveSpotlightTour.jsx # Step-by-step tour
│   ├── MicrophoneButton.jsx # Speech-to-text input button
│   ├── HighlightText.jsx    # Text highlighting utility
│   ├── SuffixedValue.jsx    # Value with suffix display
│   └── EmptyState.jsx       # Zero-state illustration
├── utils/
│   ├── chunkedQr.js         # Chunked QR code splitting & reassembly
│   ├── clipboard.js         # Clipboard copy/share utilities
│   ├── formatSmartDate.js   # Smart date formatting
│   ├── uniqueSuffix.js      # Unique suffix generation for patients
│   ├── useSpeechRecognition.js # Web Speech API hook
│   └── useWakeLock.js       # Screen wake lock hook
```

---

## License

MIT — free to use, modify, and self-host.
