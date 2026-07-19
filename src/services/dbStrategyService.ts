/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Database strategy layer: local-first with optional cloud sync adapters.
 */

import { MindItem } from '../types';
import {
  getAppwriteItems,
  saveAppwriteItems,
  isAppwriteConfigured,
  processItemMediaForUpload,
  deleteItemMedia,
  isStorageBucketConfigured,
} from '../lib/appwrite';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  ensureLocalMigration,
  getLocalItems,
  saveLocalItems,
  enqueueOutbox,
  listOutbox,
  removeOutbox,
  bumpOutboxAttempt,
  hydrateItemsMedia,
  expandItemsMedia,
} from '../lib/localDb';

export type DbStrategy = 'local' | 'appwrite' | 'supabase' | 'firebase' | 'box';

export type SyncStatus = 'local' | 'offline' | 'syncing' | 'synced' | 'error';

export interface SyncAdapter {
  id: DbStrategy;
  isConfigured(): boolean;
  pull(userId: string): Promise<MindItem[] | null>;
  push(userId: string, items: MindItem[]): Promise<boolean>;
}

// Re-export storage bucket utilities for use in other components
export {
  processItemMediaForUpload,
  deleteItemMedia,
  isStorageBucketConfigured,
  isAppwriteConfigured,
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function isSupabaseConfigured(): boolean {
  if (!isBrowser()) return false;
  const url = localStorage.getItem('pensieve_supabase_url');
  const key = localStorage.getItem('pensieve_supabase_key');
  return Boolean(url && key);
}

export function isFirebaseConfigured(): boolean {
  if (!isBrowser()) return false;
  const custom = localStorage.getItem('pensieve_firebase_apiKey');
  const project = localStorage.getItem('pensieve_firebase_projectId');
  if (custom && project) return true;
  // Built-in applet config is present in the bundle — strategy is usable when selected
  return true;
}

export function isStrategyConfigured(strategy: DbStrategy): boolean {
  switch (strategy) {
    case 'local':
      return true;
    case 'supabase':
      return isSupabaseConfigured();
    case 'appwrite':
      return isAppwriteConfigured();
    case 'firebase':
      return isFirebaseConfigured();
    case 'box':
      return Boolean(
        isBrowser() &&
          (localStorage.getItem('pensieve_box_devToken') ||
            localStorage.getItem('pensieve_box_clientId'))
      );
    default:
      return false;
  }
}

export function getDbStrategy(): DbStrategy {
  if (!isBrowser()) return 'local';
  const val = localStorage.getItem('pensieve_db_strategy');
  if (
    val === 'local' ||
    val === 'appwrite' ||
    val === 'supabase' ||
    val === 'firebase' ||
    val === 'box'
  ) {
    return val;
  }
  // No explicit choice: prefer local when no cloud credentials exist
  if (isAppwriteConfigured()) return 'appwrite';
  if (isSupabaseConfigured()) return 'supabase';
  return 'local';
}

/**
 * Effective strategy after credential checks — never pretend cloud works
 * when keys are missing.
 */
export function getEffectiveDbStrategy(): DbStrategy {
  const requested = getDbStrategy();
  if (requested === 'local') return 'local';
  if (!isStrategyConfigured(requested)) {
    console.warn(
      `[DB Strategy] ${requested} is not configured — using local-only mode.`
    );
    return 'local';
  }
  // When offline, still return the cloud strategy so saves can enqueue an outbox
  // entry for that adapter; callers use navigator.onLine for read UX.
  return requested;
}

export function setDbStrategy(strategy: DbStrategy): void {
  if (!isBrowser()) return;
  localStorage.setItem('pensieve_db_strategy', strategy);
}

/** Last-write-wins merge using updatedAt (fallback createdAt). */
export function mergeItemsLww(local: MindItem[], remote: MindItem[]): MindItem[] {
  const map = new Map<string, MindItem>();

  for (const item of local) {
    map.set(item.id, item);
  }

  for (const item of remote) {
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
      continue;
    }
    const remoteTs = new Date(item.updatedAt || item.createdAt || 0).getTime();
    const localTs = new Date(prev.updatedAt || prev.createdAt || 0).getTime();
    if (remoteTs >= localTs) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function stampItems(items: MindItem[]): MindItem[] {
  const now = new Date().toISOString();
  return items.map((item) => ({
    ...item,
    updatedAt: item.updatedAt || item.createdAt || now,
  }));
}

/* -------------------------------------------------------------------------- */
/* Cloud adapters                                                              */
/* -------------------------------------------------------------------------- */

async function fetchFromFirebase(userId: string): Promise<MindItem[] | null> {
  try {
    const docRef = doc(db, 'pensieve_users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.items && Array.isArray(data.items)) {
        return data.items;
      }
    }
  } catch (error) {
    console.error('[Firebase Firestore] Error fetching from Firebase:', error);
  }
  return null;
}

async function saveToFirebase(userId: string, items: MindItem[]): Promise<boolean> {
  try {
    const docRef = doc(db, 'pensieve_users', userId);
    await setDoc(
      docRef,
      {
        items,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[Firebase Firestore] Successfully saved ${items.length} items to Firestore.`);
    return true;
  } catch (error) {
    console.error('[Firebase Firestore] Error saving to Firebase:', error);
    return false;
  }
}

async function fetchFromSupabase(userId: string): Promise<MindItem[] | null> {
  const url = localStorage.getItem('pensieve_supabase_url');
  const key = localStorage.getItem('pensieve_supabase_key');
  if (!url || !key) return null;

  try {
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const response = await fetch(
      `${cleanUrl}/rest/v1/pensieve_kv?key=eq.items_${userId}`,
      {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].value) {
        const parsed = JSON.parse(data[0].value);
        if (Array.isArray(parsed)) return parsed;
        // Empty remote document — return empty array (distinct from null/error)
        return [];
      }
      // No row yet
      return [];
    } else {
      console.warn(
        `[Supabase REST] Fetch returned status: ${response.status}. Table may not exist or permissions missing.`
      );
    }
  } catch (error) {
    console.error('[Supabase REST] Error fetching from Supabase:', error);
  }
  return null;
}

async function saveToSupabase(userId: string, items: MindItem[]): Promise<boolean> {
  const url = localStorage.getItem('pensieve_supabase_url');
  const key = localStorage.getItem('pensieve_supabase_key');
  if (!url || !key) return false;

  try {
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const body = {
      key: `items_${userId}`,
      value: JSON.stringify(items),
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(`${cleanUrl}/rest/v1/pensieve_kv`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      console.log(`[Supabase REST] Successfully saved ${items.length} items to Supabase.`);
      return true;
    } else {
      console.warn(
        `[Supabase REST] Save returned status: ${response.status}. Table 'pensieve_kv' might not be configured.`
      );
    }
  } catch (error) {
    console.error('[Supabase REST] Error saving to Supabase:', error);
  }
  return false;
}

const localAdapter: SyncAdapter = {
  id: 'local',
  isConfigured: () => true,
  pull: async () => getLocalItems(),
  push: async (_userId, items) => {
    await saveLocalItems(items);
    return true;
  },
};

const appwriteAdapter: SyncAdapter = {
  id: 'appwrite',
  isConfigured: () => isAppwriteConfigured(),
  pull: async (userId) => {
    const items = await getAppwriteItems(userId);
    return items;
  },
  push: async (userId, items) => saveAppwriteItems(userId, items),
};

const supabaseAdapter: SyncAdapter = {
  id: 'supabase',
  isConfigured: () => isSupabaseConfigured(),
  pull: async (userId) => fetchFromSupabase(userId),
  push: async (userId, items) => saveToSupabase(userId, items),
};

const firebaseAdapter: SyncAdapter = {
  id: 'firebase',
  isConfigured: () => isFirebaseConfigured(),
  pull: async (userId) => fetchFromFirebase(userId),
  push: async (userId, items) => saveToFirebase(userId, items),
};

const boxAdapter: SyncAdapter = {
  id: 'box',
  isConfigured: () => isStrategyConfigured('box'),
  pull: async () => {
    console.warn('[Box] Fetch not yet implemented.');
    return null;
  },
  push: async () => {
    console.warn('[Box] Save not yet implemented.');
    return false;
  },
};

export function getSyncAdapter(strategy: DbStrategy): SyncAdapter {
  switch (strategy) {
    case 'supabase':
      return supabaseAdapter;
    case 'firebase':
      return firebaseAdapter;
    case 'box':
      return boxAdapter;
    case 'appwrite':
      return appwriteAdapter;
    case 'local':
    default:
      return localAdapter;
  }
}

/**
 * Loads mind items: always seeds from local IndexedDB, then optionally merges remote.
 * Never replaces a non-empty local vault with a failed/null remote read.
 */
export async function loadDbItems(
  userId: string,
  strategy: DbStrategy
): Promise<MindItem[]> {
  await ensureLocalMigration();
  const local = await getLocalItems();

  const effective =
    !isStrategyConfigured(strategy) || strategy === 'local' || !userId
      ? 'local'
      : strategy;

  if (effective === 'local' || !navigator.onLine) {
    return hydrateItemsMedia(local);
  }

  try {
    const adapter = getSyncAdapter(effective);
    const remote = await adapter.pull(userId);

    if (remote === null) {
      // Network/auth failure — keep local
      console.warn(`[DB Strategy] ${effective} pull failed; keeping local vault.`);
      return hydrateItemsMedia(local);
    }

    if (remote.length === 0 && local.length > 0) {
      // Empty remote + local data → push local up, keep local
      const forCloud = await expandItemsMedia(stampItems(local));
      await adapter.push(userId, forCloud);
      return hydrateItemsMedia(local);
    }

    const merged = mergeItemsLww(local, stampItems(remote));
    await saveLocalItems(merged);
    return hydrateItemsMedia(merged);
  } catch (e) {
    console.warn(`[DB Strategy Service] Loading failed for ${strategy}, using local.`, e);
    return hydrateItemsMedia(local);
  }
}

/**
 * Saves mind items: always writes IndexedDB first; cloud is best-effort + outbox.
 */
export async function saveDbItems(
  userId: string,
  items: MindItem[],
  strategy: DbStrategy
): Promise<boolean> {
  const stamped = stampItems(items);

  try {
    await saveLocalItems(stamped);
  } catch (e) {
    console.error('[DB Strategy Service] Local IndexedDB save failed:', e);
    window.dispatchEvent(
      new CustomEvent('pensieve_storage_error', {
        detail: {
          message:
            'Local database save failed. Free disk space or export a backup from Settings.',
          type: 'quota',
        },
      })
    );
    return false;
  }

  const effective =
    !userId || strategy === 'local' || !isStrategyConfigured(strategy)
      ? 'local'
      : strategy;

  if (effective === 'local') {
    return true;
  }

  if (!navigator.onLine) {
    await enqueueOutbox(userId, effective, stamped);
    window.dispatchEvent(
      new CustomEvent('pensieve_sync_status', {
        detail: { status: 'offline' as SyncStatus },
      })
    );
    return true;
  }

  try {
    const adapter = getSyncAdapter(effective);
    const forCloud = await expandItemsMedia(stamped);
    const ok = await adapter.push(userId, forCloud);
    if (!ok) {
      await enqueueOutbox(userId, effective, stamped);
      window.dispatchEvent(
        new CustomEvent('pensieve_sync_status', {
          detail: { status: 'error' as SyncStatus, message: 'Cloud sync failed — queued locally.' },
        })
      );
      return true; // local succeeded
    }
    window.dispatchEvent(
      new CustomEvent('pensieve_sync_status', {
        detail: { status: 'synced' as SyncStatus },
      })
    );
    return true;
  } catch (e) {
    console.error(`[DB Strategy Service] Save failed for ${strategy}`, e);
    await enqueueOutbox(userId, effective, stamped);
    return true;
  }
}

/**
 * Drain pending outbox pushes when back online / credentials become available.
 */
export async function drainSyncOutbox(): Promise<number> {
  if (!navigator.onLine) return 0;

  const pending = await listOutbox();
  let drained = 0;

  for (const entry of pending) {
    if (!entry.id) continue;
    const strategy = entry.strategy as DbStrategy;
    if (!isStrategyConfigured(strategy) || strategy === 'local') {
      await removeOutbox(entry.id);
      continue;
    }

    try {
      const items = JSON.parse(entry.payloadJson) as MindItem[];
      const adapter = getSyncAdapter(strategy);
      const forCloud = await expandItemsMedia(items);
      const ok = await adapter.push(entry.userId, forCloud);
      if (ok) {
        await removeOutbox(entry.id);
        drained++;
      } else {
        await bumpOutboxAttempt(entry.id, 'push returned false');
      }
    } catch (e: any) {
      await bumpOutboxAttempt(entry.id, e?.message || String(e));
    }
  }

  if (drained > 0) {
    window.dispatchEvent(
      new CustomEvent('pensieve_sync_status', {
        detail: { status: 'synced' as SyncStatus, drained },
      })
    );
  }

  return drained;
}

export function describeStrategy(strategy: DbStrategy): { title: string; subtitle: string } {
  switch (strategy) {
    case 'local':
      return {
        title: 'Local Only (IndexedDB)',
        subtitle: 'Vault stays on this device — no cloud required',
      };
    case 'appwrite':
      return {
        title: 'Appwrite Cloud Storage',
        subtitle: 'Synchronizing with Appwrite Database',
      };
    case 'supabase':
      return {
        title: 'Supabase Relational',
        subtitle: 'Synchronizing with Supabase PostgreSQL',
      };
    case 'box':
      return {
        title: 'Box Storage',
        subtitle: 'Synchronizing with Box API',
      };
    case 'firebase':
    default:
      return {
        title: 'Firebase Firestore',
        subtitle: 'Synchronizing with Google Firebase',
      };
  }
}
