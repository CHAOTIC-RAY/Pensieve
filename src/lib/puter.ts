/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MindItem } from '../types';

// Declare the Puter global for TypeScript
declare global {
  interface Window {
    puter?: any;
  }
}

/**
 * Checks if the Puter SDK is loaded and initialized in the browser.
 */
export function isPuterAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.puter !== 'undefined';
}

/**
 * Gets a string key for a user's mind items in Puter Key-Value store.
 */
function getPuterKey(userId: string): string {
  return `pensieve_mind_items_${userId}`;
}

/**
 * Fetches all Mind Items stored on Puter's cloud storage.
 * Falls back to local storage if Puter is unavailable.
 */
export async function getPuterItems(userId: string): Promise<MindItem[]> {
  if (!userId) return [];

  if (isPuterAvailable()) {
    try {
      console.log(`[Pensieve Puter] Fetching mind items from Puter cloud for user: ${userId}`);
      const key = getPuterKey(userId);
      const dataStr = await window.puter.kv.get(key);
      if (dataStr) {
        const items = JSON.parse(dataStr);
        if (Array.isArray(items)) {
          return items;
        }
      }
    } catch (error) {
      console.error("[Pensieve Puter] Error fetching from Puter KV store:", error);
    }
  }

  // Fallback to local storage if Puter is not available or empty
  try {
    const local = localStorage.getItem('pensieve_local_items');
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.error("[Pensieve Puter] Failed to load from local fallback", e);
  }

  return [];
}

/**
 * Saves all Mind Items to Puter's cloud storage and updates local storage.
 */
export async function savePuterItems(userId: string, items: MindItem[]): Promise<boolean> {
  if (!userId) return false;

  // Sync to local storage first for instant responsiveness
  try {
    localStorage.setItem('pensieve_local_items', JSON.stringify(items));
  } catch (e) {
    console.error("[Pensieve Puter] Failed to write to local storage", e);
  }

  if (isPuterAvailable()) {
    try {
      const key = getPuterKey(userId);
      let dataStr = JSON.stringify(items);
      
      // If it's too large for Puter's 400KB limit, let's optimize it
      if (dataStr.length > 400000) {
        console.warn(`[Pensieve Puter] Data size (${dataStr.length}) exceeds 400KB limit. Pruning bodyText/base64 to optimize.`);
        
        // Step 1: Truncate bodyText to 5000 chars and strip large base64 images
        let pruned = items.map(item => {
          const copy = { ...item };
          if (copy.bodyText && copy.bodyText.length > 5000) {
            copy.bodyText = copy.bodyText.substring(0, 5000) + '... [Truncated for cloud sync]';
          }
          if (copy.imageUrl && copy.imageUrl.startsWith('data:') && copy.imageUrl.length > 30000) {
            copy.imageUrl = ''; // Clear large base64
          }
          return copy;
        });
        
        dataStr = JSON.stringify(pruned);
        
        // Step 2: If still too large, completely strip bodyText from all items
        if (dataStr.length > 400000) {
          console.warn(`[Pensieve Puter] Data still exceeds 400KB after partial pruning. Stripping bodyText entirely.`);
          pruned = pruned.map(item => {
            const copy = { ...item };
            delete copy.bodyText;
            return copy;
          });
          dataStr = JSON.stringify(pruned);
        }
        
        // Step 3: If STILL too large, keep only the newest 100 items for cloud sync
        if (dataStr.length > 400000) {
          console.warn(`[Pensieve Puter] Data still exceeds 400KB. Syncing only the 100 newest items.`);
          const sorted = [...pruned].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          pruned = sorted.slice(0, 100);
          dataStr = JSON.stringify(pruned);
        }
      }

      await window.puter.kv.set(key, dataStr);
      console.log(`[Pensieve Puter] Successfully persisted ${items.length} items to Puter Cloud NoSQL storage.`);
      return true;
    } catch (error) {
      console.error("[Pensieve Puter] Error saving to Puter KV store:", error);
    }
  }

  return false;
}

/**
 * Saves a file (e.g. text, base64 data, or image blob) to Puter's cloud file system.
 * Returns the URL or a success flag.
 */
export async function saveFileToPuter(fileName: string, content: string | Blob): Promise<string | null> {
  if (!isPuterAvailable()) {
    console.warn("[Pensieve Puter] Puter not available for file upload.");
    return null;
  }

  try {
    console.log(`[Pensieve Puter] Saving file to cloud file system: ${fileName}`);
    // Write file to Puter's file system
    const file = await window.puter.fs.write(fileName, content, { create: true, overwrite: true });
    // Generate a shareable, publicly accessible link
    const url = await window.puter.fs.getShareableLink(fileName);
    return url;
  } catch (error) {
    console.error("[Pensieve Puter] Error saving file to Puter FS:", error);
    return null;
  }
}

/**
 * Access Puter's free, alternative cloud-hosted AI to analyze text or answer prompts.
 */
export async function chatWithPuterAi(prompt: string, messages?: { role: string; content: string }[]): Promise<string> {
  if (!isPuterAvailable()) {
    throw new Error("Puter.js is not loaded or available.");
  }

  try {
    console.log("[Pensieve Puter AI] Sending request to free cloud AI model...");
    let response;
    
    if (messages && messages.length > 0) {
      // Format as expected by Puter AI API
      response = await window.puter.ai.chat(messages);
    } else {
      response = await window.puter.ai.chat(prompt);
    }

    // Puter AI responses can be a string or an object with text/content depending on the exact SDK version
    if (typeof response === 'string') {
      return response;
    } else if (response && response.message && response.message.content) {
      return response.message.content;
    } else if (response && response.text) {
      return response.text;
    }
    
    return String(response);
  } catch (error) {
    console.error("[Pensieve Puter AI] Error from Puter free cloud AI:", error);
    throw error;
  }
}
