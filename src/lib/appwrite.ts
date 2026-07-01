/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MindItem } from '../types';

const getStorageKey = (userId: string) => `pensieve_mind_items_${userId}`;

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  collectionId: string;
  bucketId?: string;
}

/**
 * Get Appwrite configuration from localStorage
 */
export function getAppwriteConfig(): AppwriteConfig | null {
  if (typeof window === 'undefined') return null;

  const endpoint = localStorage.getItem('pensieve_appwrite_endpoint');
  const projectId = localStorage.getItem('pensieve_appwrite_projectId');
  const databaseId = localStorage.getItem('pensieve_appwrite_databaseId');
  const collectionId = localStorage.getItem('pensieve_appwrite_collectionId');
  const bucketId = localStorage.getItem('pensieve_appwrite_bucketId') || undefined;

  if (!endpoint || !projectId || !databaseId || !collectionId) {
    return null;
  }

  return { endpoint, projectId, databaseId, collectionId, bucketId };
}

/**
 * Set Appwrite configuration in localStorage
 */
export function setAppwriteConfig(config: AppwriteConfig) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pensieve_appwrite_endpoint', config.endpoint);
  localStorage.setItem('pensieve_appwrite_projectId', config.projectId);
  localStorage.setItem('pensieve_appwrite_databaseId', config.databaseId);
  localStorage.setItem('pensieve_appwrite_collectionId', config.collectionId);
  if (config.bucketId) {
    localStorage.setItem('pensieve_appwrite_bucketId', config.bucketId);
  } else {
    localStorage.removeItem('pensieve_appwrite_bucketId');
  }
}

/**
 * Clear Appwrite configuration
 */
export function clearAppwriteConfig() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pensieve_appwrite_endpoint');
  localStorage.removeItem('pensieve_appwrite_projectId');
  localStorage.removeItem('pensieve_appwrite_databaseId');
  localStorage.removeItem('pensieve_appwrite_collectionId');
  localStorage.removeItem('pensieve_appwrite_bucketId');
}

/**
 * Check if Appwrite is configured
 */
export function isAppwriteConfigured(): boolean {
  return getAppwriteConfig() !== null;
}

/**
 * Check if Appwrite Storage Bucket is configured
 */
export function isStorageBucketConfigured(): boolean {
  const config = getAppwriteConfig();
  return config !== null && !!config.bucketId;
}

/**
 * Upload a file to Appwrite Storage Bucket
 * Returns the file ID if successful, null otherwise
 */
export async function uploadToStorageBucket(
  file: File | Blob,
  fileName: string,
  contentType: string
): Promise<string | null> {
  const config = getAppwriteConfig();
  if (!config || !config.bucketId) {
    console.warn('[Appwrite Storage] Bucket not configured.');
    return null;
  }

  try {
    const url = `${config.endpoint}/storage/buckets/${config.bucketId}/files`;

    const formData = new FormData();
    formData.append('fileId', 'unique()');
    formData.append('file', file, fileName);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': config.projectId,
      },
      body: formData,
    });

    if (response.ok || response.status === 201) {
      const data = await response.json();
      console.log(`[Appwrite Storage] Successfully uploaded file: ${data.$id}`);
      return data.$id;
    } else {
      const errorText = await response.text();
      console.warn(`[Appwrite Storage] Upload failed with status: ${response.status}`, errorText);
    }
  } catch (error) {
    console.error('[Appwrite Storage] Upload error:', error);
  }

  return null;
}

/**
 * Upload a base64 data URL to Appwrite Storage Bucket
 * Returns the file ID if successful, null otherwise
 */
export async function uploadBase64ToStorageBucket(
  dataUrl: string,
  fileName: string
): Promise<string | null> {
  try {
    // Extract mime type and base64 data from data URL
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.warn('[Appwrite Storage] Invalid data URL format');
      return null;
    }

    const contentType = matches[1];
    const base64Data = matches[2];

    // Convert base64 to binary
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });

    return await uploadToStorageBucket(blob, fileName, contentType);
  } catch (error) {
    console.error('[Appwrite Storage] Base64 upload error:', error);
    return null;
  }
}

/**
 * Get the public URL for a file in the Storage Bucket
 */
export function getStorageFileUrl(fileId: string): string | null {
  const config = getAppwriteConfig();
  if (!config || !config.bucketId) return null;
  return `${config.endpoint}/storage/buckets/${config.bucketId}/files/${fileId}/view?project=${config.projectId}`;
}

/**
 * Delete a file from Appwrite Storage Bucket
 */
export async function deleteFromStorageBucket(fileId: string): Promise<boolean> {
  const config = getAppwriteConfig();
  if (!config || !config.bucketId) {
    console.warn('[Appwrite Storage] Bucket not configured.');
    return false;
  }

  try {
    const url = `${config.endpoint}/storage/buckets/${config.bucketId}/files/${fileId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'X-Appwrite-Project': config.projectId,
      },
    });

    if (response.ok || response.status === 204) {
      console.log(`[Appwrite Storage] Successfully deleted file: ${fileId}`);
      return true;
    } else {
      console.warn(`[Appwrite Storage] Delete failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error('[Appwrite Storage] Delete error:', error);
  }

  return false;
}

/**
 * Process an item's media files (images, audio) for storage bucket upload
 * Returns the item with base64 fields replaced by storage bucket URLs
 */
export async function processItemMediaForUpload(item: MindItem): Promise<MindItem> {
  const config = getAppwriteConfig();
  if (!config || !config.bucketId) {
    return item;
  }

  const processedItem = { ...item };
  const timestamp = Date.now();

  // Process image if it's a base64 data URL
  if (processedItem.imageUrl && processedItem.imageUrl.startsWith('data:')) {
    const fileName = `image_${processedItem.id || timestamp}.png`;
    const fileId = await uploadBase64ToStorageBucket(processedItem.imageUrl, fileName);
    if (fileId) {
      const url = getStorageFileUrl(fileId);
      if (url) {
        processedItem.imageUrl = url;
        // Store file ID for later deletion if item is deleted
        (processedItem as any).imageFileId = fileId;
      }
    }
  }

  // Process audio if it's a base64 data URL
  if (processedItem.audioUrl && processedItem.audioUrl.startsWith('data:')) {
    const fileName = `audio_${processedItem.id || timestamp}.webm`;
    const fileId = await uploadBase64ToStorageBucket(processedItem.audioUrl, fileName);
    if (fileId) {
      const url = getStorageFileUrl(fileId);
      if (url) {
        processedItem.audioUrl = url;
        // Store file ID for later deletion if item is deleted
        (processedItem as any).audioFileId = fileId;
      }
    }
  }

  return processedItem;
}

/**
 * Delete media files associated with an item
 */
export async function deleteItemMedia(item: MindItem): Promise<void> {
  const itemWithFileIds = item as any;

  if (itemWithFileIds.imageFileId) {
    await deleteFromStorageBucket(itemWithFileIds.imageFileId);
  }

  if (itemWithFileIds.audioFileId) {
    await deleteFromStorageBucket(itemWithFileIds.audioFileId);
  }
}

/**
 * Fetch all Mind Items from Appwrite
 */
export async function getAppwriteItems(userId: string): Promise<MindItem[]> {
  if (!userId) return [];

  const config = getAppwriteConfig();
  if (!config) {
    console.warn('[Appwrite] Not configured. Falling back to localStorage.');
    return getLocalItems();
  }

  try {
    console.log(`[Appwrite] Fetching mind items for user: ${userId}`);

    // Use Appwrite REST API to fetch the document
    const url = `${config.endpoint}/databases/${config.databaseId}/collections/${config.collectionId}/documents/${getStorageKey(userId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': config.projectId,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.items && Array.isArray(data.items)) {
        console.log(`[Appwrite] Successfully fetched ${data.items.length} items.`);
        return data.items;
      }
    } else if (response.status === 404) {
      console.log('[Appwrite] No document found. Starting with empty collection.');
      return [];
    } else {
      console.warn(`[Appwrite] Fetch returned status: ${response.status}`);
    }
  } catch (error) {
    console.error('[Appwrite] Error fetching items:', error);
  }

  // Fallback to localStorage
  return getLocalItems();
}

/**
 * Save all Mind Items to Appwrite
 */
export async function saveAppwriteItems(userId: string, items: MindItem[]): Promise<boolean> {
  // Always save to localStorage first for offline safety
  saveLocalItems(items);

  if (!userId) return false;

  const config = getAppwriteConfig();
  if (!config) {
    console.warn('[Appwrite] Not configured. Items saved to localStorage only.');
    return false;
  }

  try {
    // Optimize data size if needed
    let dataStr = JSON.stringify(items);
    let optimizedItems = items;

    // If data is too large, prune large fields
    if (dataStr.length > 400000) {
      console.warn(`[Appwrite] Data size (${dataStr.length}) exceeds limit. Optimizing.`);

      optimizedItems = items.map(item => {
        const copy = { ...item };
        // Truncate large bodyText
        if (copy.bodyText && copy.bodyText.length > 5000) {
          copy.bodyText = copy.bodyText.substring(0, 5000) + '... [Truncated for sync]';
        }
        // Strip large base64 images (should already be uploaded to bucket)
        if (copy.imageUrl && copy.imageUrl.startsWith('data:') && copy.imageUrl.length > 30000) {
          copy.imageUrl = '';
        }
        // Strip large base64 audio (should already be uploaded to bucket)
        if (copy.audioUrl && copy.audioUrl.startsWith('data:') && copy.audioUrl.length > 30000) {
          copy.audioUrl = '';
        }
        return copy;
      });

      dataStr = JSON.stringify(optimizedItems);

      // If still too large, keep only newest 100
      if (dataStr.length > 400000) {
        console.warn('[Appwrite] Data still exceeds limit. Syncing newest 100 items.');
        const sorted = [...optimizedItems].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        optimizedItems = sorted.slice(0, 100);
      }
    }

    const documentId = getStorageKey(userId);
    const url = `${config.endpoint}/databases/${config.databaseId}/collections/${config.collectionId}/documents/${documentId}`;

    // Try to update first (PATCH), if 404 then create (POST)
    const body = {
      documentId,
      data: {
        items: optimizedItems,
        updated_at: new Date().toISOString(),
        user_id: userId,
      },
    };

    // Try POST first (create with custom ID)
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': config.projectId,
        'X-Appwrite-Force-Update': 'true',
      },
      body: JSON.stringify(body.data),
    });

    // If conflict, try PATCH (update existing)
    if (response.status === 409 || response.status === 404) {
      response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': config.projectId,
        },
        body: JSON.stringify(body.data),
      });
    }

    if (response.ok || response.status === 201) {
      console.log(`[Appwrite] Successfully saved ${optimizedItems.length} items.`);
      return true;
    } else {
      const errorText = await response.text();
      console.warn(`[Appwrite] Save returned status: ${response.status}`, errorText);
    }
  } catch (error) {
    console.error('[Appwrite] Error saving items:', error);
  }

  return false;
}

/**
 * Local storage fallback functions
 */
function getLocalItems(): MindItem[] {
  try {
    const local = localStorage.getItem('pensieve_local_items');
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.error('[Local Storage] Failed to load items', e);
  }
  return [];
}

function saveLocalItems(items: MindItem[]): void {
  try {
    localStorage.setItem('pensieve_local_items', JSON.stringify(items));
  } catch (e) {
    console.error('[Local Storage] Failed to save items', e);
  }
}
