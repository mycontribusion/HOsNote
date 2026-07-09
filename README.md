# 4MyTeam — Patient Handover & Location Tracker

A zero-backend, zero-internet **Progressive Web App (PWA)** for medical teams to track patient Ward & Bed assignments, document care notes, and hand over between shifts — syncing data between devices using QR codes.

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
| 📷 Import via Scan | Camera scanner merges & deduplicates incoming patients |
| ⚠️ Conflict Review | Incoming duplicates are surfaced for skip / add-new / update |
| 💾 Backup & Restore | Copy/paste full JSON backup, or restore from a backup |
| 🖨️ Handover Report | Print-friendly handover sheet (browser print) |
| 📋 Copy / Share | Web Share API with clipboard fallback |
| 💬 Feedback | In-app feedback modal |
| 📲 PWA Installable | Add to Home Screen on Android & iOS |
| 📊 Analytics | Vercel Analytics & Speed Insights (privacy-friendly) |

---

## Tech Stack

- **React 18** + **Vite 6**
- **Tailwind CSS 3** — utility-first styling
- **Lucide React** — icons
- **qrcode.react** — QR code generation
- **html5-qrcode** — camera-based QR scanning
- **idb-keyval** — IndexedDB persistence (with `localStorage` migration)
- **vite-plugin-pwa** — service worker & manifest
- **@vercel/analytics** + **@vercel/speed-insights** — usage analytics

---

## Getting Started

### Prerequisites
- Node.js ≥ 18

### Install & Run

```bash
git clone <repo-url>
cd 4MyTeam
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Production Build

```bash
npm run build
npm run preview
```

The build output in `dist/` is fully static — deploy anywhere (Nginx, GitHub Pages, Netlify, Vercel, etc.).

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
├── index.css                # Global styles + component classes
├── main.jsx                 # React entry point
└── components/
    ├── Header.jsx           # Title, dark-mode toggle, feedback, page nav
    ├── BottomNav.jsx        # Bottom navigation (Patients / Notebook)
    ├── AddPatientForm.jsx   # Ward + Bed + Name + Hosp No. + Notes + Critical
    ├── PatientCard.jsx      # Individual patient display
    ├── PatientList.jsx      # Card list with selection & review
    ├── ExportModal.jsx      # QR generation, copy/share, backup/restore, print
    ├── ScannerComponent.jsx # Camera scanner (with cleanup)
    ├── ReviewDuplicatesModal.jsx # Import conflict resolution
    ├── RemovalChoiceDialog.jsx   # Discharge vs Mortality choice
    ├── ConfirmDialog.jsx    # Reusable confirm modal
    ├── FeedbackModal.jsx    # User feedback
    ├── NotebookPage.jsx     # Documentation list view
    ├── DocComposer.jsx      # Per-patient note composer
    └── EmptyState.jsx       # Zero-state illustration
```

---

## License

MIT — free to use, modify, and self-host.
