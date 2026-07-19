<div align="center">
  <img src="./Logo.svg" width="100" height="100" alt="Pensieve Logo" />
  <h1>Pensieve</h1>
  <p><strong>Your Neural Vault. Your Second Brain. Entirely Sovereign.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Local--First-IndexedDB-0ea5e9?style=for-the-badge" alt="Local First" />
  </p>

  <p><i>Capture thoughts, organize digital memories, and own your data — even fully offline.</i></p>
</div>

---

## What is Pensieve?

Pensieve is a private neural vault for thoughts, bookmarks, and digital memories. It is **local-first**: your vault lives in IndexedDB (Dexie) on the device. Cloud backends (Appwrite, Supabase, Firebase) are optional sync targets — not required to use the app.

---

## Key Features

### Sovereign Data & Sync
- **Local-first engine**: Items and media blobs persist in IndexedDB via Dexie.js
- **Offline by default**: No Supabase / Appwrite / Firebase credentials needed
- **Optional cloud sync**: Appwrite, Supabase, or Firebase with outbox queue + LWW merge
- **Export / import**: Full vault backup from Settings → Profile

### Intelligence (On-Device & Cloud)
- **Local WebGPU AI**: Run models (LiteRT) in the browser when enabled
- **Gemini fallback**: Cloud analysis when online (skipped automatically offline)
- **Omnibar**: Auto-detects URLs, colors, quotes, and more as you type

### Interface
- Marketplace & XP, themed UI, pinned widgets, PWA install with offline shell cache

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation

```bash
git clone https://github.com/your-username/pensieve.git
cd pensieve
npm install
```

Optional `.env` (see `.env.example`) — the app runs without these:

```env
GEMINI_API_KEY=your_gemini_key
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_STORE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
```

```bash
npm run dev
```

### Offline / local-only mode

1. Open the app and **Continue as Guest** (or wait for the local guest fallback)
2. Settings → Databases → choose **Local**
3. Capture, search, and edit with no network
4. Install the PWA for airplane-mode reloads (service worker caches the app shell)

When you later add Supabase/Appwrite credentials, local data is preserved and synced via the outbox.

---

## Guides

- [Offline & local-first plan](./docs/offline-local-first-plan.md)
- [Supabase setup (optional)](./docs/supabase-setup.md)
- [Appwrite setup](./appwrite-setup-guide.md)

---

## License

Apache-2.0 — see [LICENSE](LICENSE).
