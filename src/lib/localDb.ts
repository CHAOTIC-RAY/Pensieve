/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Local-first IndexedDB store (Dexie). Source of truth when cloud is absent.
 */

import Dexie, { type Table } from 'dexie';
import type { MindItem } from '../types';

export const LOCAL_ITEMS_LEGACY_KEY = 'pensieve_local_items';
export const LOCAL_DB_MIGRATED_KEY = 'pensieve_idb_migrated_v1';
export const MEDIA_URL_PREFIX = 'idb-media://';

export interface MediaRecord {
  id: string;
  itemId: string;
  kind: 'image' | 'audio' | 'other';
  mime: string;
  blob: Blob;
  createdAt: string;
}

export interface MetaRecord {
  key: string;
  value: unknown;
}

export interface OutboxRecord {
  id?: number;
  userId: string;
  strategy: string;
  op: 'push';
  /** JSON-serialized MindItem[] (kept as string for Dexie friendliness) */
  payloadJson: string;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

class PensieveDB extends Dexie {
  items!: Table<MindItem, string>;
  media!: Table<MediaRecord, string>;
  meta!: Table<MetaRecord, string>;
  outbox!: Table<OutboxRecord, number>;

  constructor() {
    super('pensieve_local_db');
    this.version(1).stores({
      items: 'id, type, createdAt, updatedAt, isFavorite',
      media: 'id, itemId, kind',
      meta: 'key',
      outbox: '++id, userId, strategy, createdAt',
    });
  }
}

export const localDb = new PensieveDB();

const blobUrlCache = new Map<string, string>(); // mediaId -> blob:
const blobUrlToMediaId = new Map<string, string>(); // blob: -> mediaId

const MEDIA_FIELDS: Array<keyof MindItem> = [
  'imageUrl',
  'audioUrl',
  'moviePoster',
  'albumArtUrl',
  'productImageUrl',
  'authorAvatar',
];

/** Convert hydrated blob: URLs back to idb-media:// refs before persistence. */
function demoteMediaUrls(item: MindItem): MindItem {
  const next = { ...item };
  for (const field of MEDIA_FIELDS) {
    const val = next[field];
    if (typeof val === 'string' && val.startsWith('blob:')) {
      const mediaId = blobUrlToMediaId.get(val);
      if (mediaId) {
        (next as any)[field] = `${MEDIA_URL_PREFIX}${mediaId}`;
      } else {
        // Orphan blob URL — drop rather than persist a dead reference
        (next as any)[field] = undefined;
      }
    }
  }
  return next;
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string } | null {
  try {
    const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
    if (!match) return null;
    const mime = match[1] || 'application/octet-stream';
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { blob: new Blob([bytes], { type: mime }), mime };
  } catch {
    return null;
  }
}

function newMediaId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Move large data: URLs into the media table; rewrite fields to idb-media:// refs.
 */
export async function extractMediaFromItem(item: MindItem): Promise<MindItem> {
  const next = { ...item };
  const stamp = new Date().toISOString();

  const extractField = async (
    field: 'imageUrl' | 'audioUrl' | 'moviePoster' | 'albumArtUrl' | 'productImageUrl' | 'authorAvatar',
    kind: MediaRecord['kind']
  ) => {
    const value = next[field];
    if (!value || typeof value !== 'string') return;
    if (value.startsWith(MEDIA_URL_PREFIX)) return;
    if (!value.startsWith('data:') || value.length < 2048) return;

    const parsed = dataUrlToBlob(value);
    if (!parsed) return;

    const id = newMediaId();
    await localDb.media.put({
      id,
      itemId: item.id,
      kind,
      mime: parsed.mime,
      blob: parsed.blob,
      createdAt: stamp,
    });
    next[field] = `${MEDIA_URL_PREFIX}${id}`;
  };

  await extractField('imageUrl', 'image');
  await extractField('audioUrl', 'audio');
  await extractField('moviePoster', 'image');
  await extractField('albumArtUrl', 'image');
  await extractField('productImageUrl', 'image');
  await extractField('authorAvatar', 'image');

  return next;
}

/** Resolve idb-media:// refs to blob: URLs for rendering. */
export async function resolveMediaUrl(url?: string | null): Promise<string | undefined> {
  if (!url) return undefined;
  if (!url.startsWith(MEDIA_URL_PREFIX)) return url;

  const id = url.slice(MEDIA_URL_PREFIX.length);
  const cached = blobUrlCache.get(id);
  if (cached) return cached;

  const record = await localDb.media.get(id);
  if (!record) return undefined;

  const objectUrl = URL.createObjectURL(record.blob);
  blobUrlCache.set(id, objectUrl);
  blobUrlToMediaId.set(objectUrl, id);
  return objectUrl;
}

/** Hydrate media refs on a list of items for UI display. */
export async function hydrateItemsMedia(items: MindItem[]): Promise<MindItem[]> {
  return Promise.all(
    items.map(async (item) => {
      const next = { ...item };
      for (const field of MEDIA_FIELDS) {
        const val = next[field];
        if (typeof val === 'string' && val.startsWith(MEDIA_URL_PREFIX)) {
          const resolved = await resolveMediaUrl(val);
          if (resolved) (next as any)[field] = resolved;
        }
      }
      return next;
    })
  );
}

export async function getLocalItems(): Promise<MindItem[]> {
  await ensureLocalMigration();
  const rows = await localDb.items.toArray();
  return rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function saveLocalItems(items: MindItem[]): Promise<void> {
  await ensureLocalMigration();

  const prepared = await Promise.all(
    items.map(async (item) => {
      const demoted = demoteMediaUrls(item);
      const withStamp: MindItem = {
        ...demoted,
        updatedAt: demoted.updatedAt || demoted.createdAt || new Date().toISOString(),
      };
      return extractMediaFromItem(withStamp);
    })
  );

  await localDb.transaction('rw', localDb.items, localDb.media, async () => {
    const incomingIds = new Set(prepared.map((i) => i.id));
    const existing = await localDb.items.toArray();
    const toDelete = existing.filter((e) => !incomingIds.has(e.id)).map((e) => e.id);

    if (toDelete.length > 0) {
      await localDb.items.bulkDelete(toDelete);
      const orphanMedia = await localDb.media.where('itemId').anyOf(toDelete).primaryKeys();
      if (orphanMedia.length) await localDb.media.bulkDelete(orphanMedia as string[]);
    }

    await localDb.items.bulkPut(prepared);
  });

  // Keep a tiny legacy mirror of ids-only metadata for emergency recovery (no media)
  try {
    const slim = prepared.map(({ id, type, title, createdAt, updatedAt }) => ({
      id,
      type,
      title,
      createdAt,
      updatedAt,
    }));
    localStorage.setItem('pensieve_local_items_index', JSON.stringify(slim));
  } catch {
    /* ignore quota on index mirror */
  }
}

export async function deleteLocalMediaForItem(itemId: string): Promise<void> {
  const keys = await localDb.media.where('itemId').equals(itemId).primaryKeys();
  if (keys.length) await localDb.media.bulkDelete(keys as string[]);
}

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await localDb.meta.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await localDb.meta.put({ key, value });
}

export async function enqueueOutbox(
  userId: string,
  strategy: string,
  items: MindItem[]
): Promise<void> {
  await localDb.outbox.add({
    userId,
    strategy,
    op: 'push',
    payloadJson: JSON.stringify(items),
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
}

export async function listOutbox(): Promise<OutboxRecord[]> {
  return localDb.outbox.orderBy('createdAt').toArray();
}

export async function removeOutbox(id: number): Promise<void> {
  await localDb.outbox.delete(id);
}

export async function bumpOutboxAttempt(id: number, error: string): Promise<void> {
  const row = await localDb.outbox.get(id);
  if (!row) return;
  await localDb.outbox.update(id, {
    attempts: (row.attempts || 0) + 1,
    lastError: error,
  });
}

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  itemCount: number;
  mediaCount: number;
  outboxCount: number;
}> {
  let usage = 0;
  let quota = 0;
  if (navigator.storage?.estimate) {
    const est = await navigator.storage.estimate();
    usage = est.usage || 0;
    quota = est.quota || 0;
  }
  const [itemCount, mediaCount, outboxCount] = await Promise.all([
    localDb.items.count(),
    localDb.media.count(),
    localDb.outbox.count(),
  ]);
  return { usage, quota, itemCount, mediaCount, outboxCount };
}

/**
 * One-time migration from localStorage JSON blob → IndexedDB.
 */
let migrationPromise: Promise<void> | null = null;

export async function ensureLocalMigration(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    if (localStorage.getItem(LOCAL_DB_MIGRATED_KEY) === 'true') {
      const count = await localDb.items.count();
      if (count > 0) return;
      // Migrated flag set but empty DB — try re-import from legacy if present
    }

    const legacy = localStorage.getItem(LOCAL_ITEMS_LEGACY_KEY);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existing = await localDb.items.count();
          if (existing === 0) {
            const prepared = await Promise.all(
              parsed.map(async (raw: MindItem) =>
                extractMediaFromItem({
                  ...raw,
                  updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
                })
              )
            );
            await localDb.items.bulkPut(prepared);
            console.log(`[LocalDB] Migrated ${prepared.length} items from localStorage → IndexedDB`);
          }
        }
        // Keep legacy key as backup for one release cycle
        localStorage.setItem('pensieve_local_items_backup', legacy);
      } catch (e) {
        console.error('[LocalDB] Migration failed:', e);
      }
    }

    localStorage.setItem(LOCAL_DB_MIGRATED_KEY, 'true');
  })();

  return migrationPromise;
}

/** Re-inline idb-media:// (and demote blob:) fields to data URLs for export/cloud. */
export async function expandItemsMedia(items: MindItem[]): Promise<MindItem[]> {
  return Promise.all(
    items.map(async (raw) => {
      const item = demoteMediaUrls(raw);
      const next = { ...item };
      for (const field of MEDIA_FIELDS) {
        const val = next[field];
        if (typeof val === 'string' && val.startsWith(MEDIA_URL_PREFIX)) {
          const id = val.slice(MEDIA_URL_PREFIX.length);
          const record = await localDb.media.get(id);
          if (record) {
            const buf = await record.blob.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            (next as any)[field] = `data:${record.mime};base64,${btoa(binary)}`;
          }
        }
      }
      return next;
    })
  );
}

/** Export vault as JSON (media re-inlined as data URLs when possible). */
export async function exportVaultJson(): Promise<string> {
  const items = await getLocalItems();
  const expanded = await expandItemsMedia(items);

  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      items: expanded,
    },
    null,
    2
  );
}

/** Import vault JSON; merge by id using updatedAt LWW. Returns merged count. */
export async function importVaultJson(jsonText: string): Promise<number> {
  const data = JSON.parse(jsonText);
  const incoming: MindItem[] = Array.isArray(data) ? data : data.items;
  if (!Array.isArray(incoming)) throw new Error('Invalid vault export format');

  const existing = await getLocalItems();
  const map = new Map<string, MindItem>();
  for (const item of existing) map.set(item.id, item);

  for (const item of incoming) {
    if (!item?.id) continue;
    const prev = map.get(item.id);
    const incomingTs = new Date(item.updatedAt || item.createdAt || 0).getTime();
    const prevTs = prev ? new Date(prev.updatedAt || prev.createdAt || 0).getTime() : 0;
    if (!prev || incomingTs >= prevTs) {
      map.set(item.id, {
        ...item,
        updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      });
    }
  }

  const merged = Array.from(map.values());
  await saveLocalItems(merged);
  return merged.length;
}
