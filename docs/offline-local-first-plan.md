# Offline & Local-First Improvement Plan

> **Status: Implemented** (Phases 0–5 landed in code). This document remains the design reference.

**Goal:** Pensieve must run fully offline on local data when Supabase (or any cloud backend) is missing, misconfigured, or unreachable — without blocking capture, browse, search, or edit.

**Current reality (as of this plan):**

| Claim / intent | Actual state |
|---|---|
| README: “IndexedDB using Dexie.js” | Not implemented. Items live in `localStorage` (`pensieve_local_items`). No Dexie dependency. |
| Cloud strategies | `appwrite` (default), `supabase`, `firebase`, `box` in `dbStrategyService.ts` |
| Local fallback | Always written on save; used on load when remote fails or credentials missing |
| Explicit “local only” strategy | Missing — UI always presents a cloud strategy |
| PWA / service worker | `public/sw.js` exists, but `main.tsx` **unregisters** all service workers |
| Auth without cloud | Guest mode (`pensieve_local_guest_active` / `guest-user`) works |
| Media offline | Images/audio often as base64 in localStorage → quota failures (`safeStorage.ts`) |
| AI offline | Local LiteRT/WebGPU path exists; cloud Gemini/OpenAI still preferred when keys set |

---

## Design principles

1. **Local is source of truth.** Cloud is optional sync, never a hard dependency for core CRUD.
2. **No credentials ⇒ local mode.** Missing Supabase URL/key (or Appwrite/Firebase config) must silently use local storage — no empty vault, no stuck sync spinner.
3. **Offline = first-class.** Detect `navigator.onLine` / failed fetches; keep UI usable and show a clear “Local only” status.
4. **Quota-safe media.** Binary media must leave `localStorage` and move to IndexedDB (or OPFS).
5. **Sync is best-effort + queued.** When cloud returns, flush a pending outbox; never overwrite newer local edits blindly.

---

## Phase 0 — Explicit Local strategy (quick win)

Make “no Supabase / no cloud” a deliberate, selectable mode.

### Changes

- Extend `DbStrategy` with `'local'`:
  ```ts
  export type DbStrategy = 'local' | 'appwrite' | 'supabase' | 'firebase' | 'box';
  ```
- Default strategy when no cloud credentials are present: `'local'` (instead of always `'appwrite'`).
- Auto-detect / degrade:
  - If strategy is `supabase` but `pensieve_supabase_url` or `pensieve_supabase_key` is empty → treat as local (and optionally toast once).
  - Same pattern for Appwrite / Firebase when required keys are missing.
- Settings UI: add **Local only** as first option; disable or gray cloud sections until configured.
- Status chip in app chrome: `Local` | `Offline` | `Syncing` | `Synced` (reuse existing `isOffline`).

### Acceptance

- Fresh install with empty `.env` / empty settings → app opens as guest or local user, CRUD works, data survives refresh.
- Selecting Supabase without URL/key does not wipe or hide local items.

---

## Phase 1 — Real local persistence (IndexedDB)

Replace the single JSON blob in `localStorage` with a durable local database.

### Proposed stack

- **Dexie.js** (matches README promise) or raw IndexedDB wrapper.
- Suggested schema:
  - `items` — `MindItem` rows (indexed by `id`, `type`, `createdAt`, `tags`, `isFavorite`)
  - `media` — `{ id, itemId, mime, blob }` for images/audio (not base64 in item JSON)
  - `meta` — settings snapshots, sync cursors, schema version
  - `outbox` — pending remote ops when offline / cloud unavailable

### Migration

1. On boot: if `pensieve_local_items` exists, import into IndexedDB, then mark migrated (keep backup key for one release).
2. Keep a small settings surface in `localStorage` (strategy, keys, guest flag) — fine for tiny strings.
3. Route all `loadDbItems` / `saveDbItems` local paths through the new store.
4. Update `safeStorage` quota messaging: point users to local DB health + optional cloud, not “must connect cloud”.

### Acceptance

- 1k+ notes with attachments do not hit `QuotaExceededError`.
- Reload / hard refresh restores full vault offline.
- Export/import JSON still works (include media as files or data URLs in zip later).

---

## Phase 2 — Offline-capable app shell (PWA)

Today the SW is unregistered, so a true offline reload fails once the network is gone.

### Changes

- Stop blanket unregister in `main.tsx` (or gate it: unregister only in iframe/dev preview).
- Turn `public/sw.js` into a real shell cache:
  - Precache: `index.html`, JS/CSS assets, fonts, icons, `manifest.json`
  - Runtime cache: same-origin static assets
  - Network-first for API / cloud hosts; never block UI on those
- Align `manifest.json` with install flow already partially wired (`beforeinstallprompt`).
- Optional: cache previously downloaded local AI model artifacts (respect storage budget).

### Acceptance

- Install PWA → airplane mode → open app → vault loads from IndexedDB.
- No COEP/CORP regressions for WebGPU / local AI (preserve current header needs).

---

## Phase 3 — Sync queue & conflict rules (when Supabase returns)

Cloud becomes optional sync on top of local.

### Behavior

```
write → IndexedDB (immediate)
     → if cloud configured AND online → push
     → else → outbox entry
online / credentials added → drain outbox
```

### Rules

- **Per-item `updatedAt`** (add if missing) for LWW merge.
- Never replace a non-empty local DB with `[]` from a failed/empty remote read.
- Supabase-specific:
  - Probe table/credentials; on 401/404/network error → stay local, surface “Cloud unavailable — working offline”.
  - Document required `pensieve_kv` schema in setup guide (mirror Appwrite guide).
- Same outbox path for Appwrite/Firebase later (one abstraction: `SyncAdapter`).

### Suggested API shape

```ts
interface SyncAdapter {
  isConfigured(): boolean;
  pull(userId: string): Promise<MindItem[] | null>;
  push(userId: string, items: MindItem[]): Promise<boolean>;
}
```

`local` adapter: no-op pull/push; IndexedDB only.

### Acceptance

- Edit offline → go online with Supabase configured → changes appear remotely.
- Remote empty + local full → remote gets local data, local not cleared.
- Toggle strategy local ↔ supabase without data loss.

---

## Phase 4 — Offline AI & feature gating

Not everything can work offline; make failure modes intentional.

| Feature | Offline behavior |
|---|---|
| Capture note / quote / color | Fully local |
| Search (Fuse.js) | Fully local |
| Local LiteRT / WebGPU AI | Prefer when enabled; skip cloud if offline |
| Gemini / OpenAI enrich | Queue or mark `analyzing: false` + “Needs network” |
| Link scrape / previews | Defer; store URL only until online |
| Store / marketplace | Read cached catalog if any; disable purchase when offline |
| Auth (Google/Firebase) | Guest / local profile only |

### UI

- Omnibar: allow save always; show subtle “Indexed offline” when enrichment skipped (already partially present).
- Settings: “Intelligence” shows whether local model is ready vs cloud-only.

---

## Phase 5 — Hardening & DX

- **Export / backup:** one-click JSON or ZIP (items + media) — critical for local-only users.
- **Import:** merge with id-aware upsert.
- **Storage health:** Settings panel showing estimated IndexedDB usage + clear-cache.
- **Tests:** unit tests for local store + merge/outbox; smoke test “no env keys → CRUD”.
- **Docs:** update README (remove false Dexie claim until shipped; then document Local mode first).
- **Default path:** landing / login emphasize “Continue locally — no account required”.

---

## Suggested implementation order

| Step | Scope | Risk | Unlocks |
|---|---|---|---|
| **0** | `'local'` strategy + credential auto-fallback | Low | Honest offline UX immediately |
| **1** | Dexie/IndexedDB + media blobs + migration | Medium | Real offline scale |
| **2** | Service worker shell cache | Medium | True airplane-mode reload |
| **3** | Sync outbox + merge rules | Medium–High | Safe optional Supabase |
| **4** | AI/feature gating polish | Low | Predictable offline AI |
| **5** | Export/import + docs/tests | Low | User trust & recoverability |

---

## Out of scope (for later)

- Multi-device CRDT / realtime collaborative editing
- End-to-end encryption at rest (nice follow-up once IndexedDB lands)
- Full Box adapter implementation
- Server-side offline (this plan is browser local-first)

---

## Key files to touch

| Area | Files |
|---|---|
| Strategy / sync | `src/services/dbStrategyService.ts` |
| App load/save | `src/App.tsx` |
| Settings UX | `src/components/SettingsModal.tsx` |
| Auth / guest | `src/components/LoginPage.tsx`, `src/App.tsx` |
| Storage helpers | `src/lib/safeStorage.ts` → new `src/lib/localDb.ts` |
| PWA | `src/main.tsx`, `public/sw.js`, `public/manifest.json` |
| Docs | `README.md`, `docs/offline-local-first-plan.md`, Supabase setup notes |

---

## Definition of done (overall)

A user can:

1. Open Pensieve with **no Supabase, no Appwrite, no Firebase** configured.
2. Capture, edit, search, and pin items entirely offline.
3. Reload the installed PWA in airplane mode and see the same vault.
4. Later paste Supabase credentials and sync without losing local data.
5. Export a backup at any time from Settings.
