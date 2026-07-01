/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MindItem } from '../types';

const getStorageKey = (userId: string) => `pensieve_mind_items_${userId}`;

/**
 * Get Appwrite configuration from localStorage
 */
function getAppwriteConfig() {
  if (typeof window === 'undefined') return null;

  const endpoint = localStorage.getItem('pensieve_appwrite_endpoint');
  const projectId = localStorage.getItem('pensieve_appwrite_projectId');
  const databaseId = localStorage.getItem('pensieve_appwrite_databaseId');
  const collectionId = localStorage.getItem('pensieve_appwrite_collectionId');

  if (!endpoint || !projectId || !databaseId || !collectionId) {
    return null;
  }

  return { endpoint, projectId, databaseId, collectionId };
}

/**
 * Set Appwrite configuration in localStorage
 */
export function setAppwriteConfig(config: {
  endpoint: string;
  projectId: string;
  databaseId: string;
  collectionId: string;
}) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pensieve_appwrite_endpoint', config.endpoint);
  localStorage.setItem('pensieve_appwrite_projectId', config.projectId);
  localStorage.setItem('pensieve_appwrite_databaseId', config.databaseId);
  localStorage.setItem('pensieve_appwrite_collectionId', config.collectionId);
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
}

/**
 * Check if Appwrite is configured
 */
export function isAppwriteConfigured(): boolean {
  return getAppwriteConfig() !== null;
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
        // Strip large base64 images
        if (copy.imageUrl && copy.imageUrl.startsWith('data:') && copy.imageUrl.length > 30000) {
          copy.imageUrl = '';
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
