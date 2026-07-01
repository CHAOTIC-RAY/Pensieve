/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MindItem } from '../types';
import { getPuterItems, savePuterItems } from '../lib/puter';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type DbStrategy = 'puter' | 'supabase' | 'firebase' | 'box';

export function getDbStrategy(): DbStrategy {
  if (typeof window === 'undefined') return 'puter';
  const val = localStorage.getItem('pensieve_db_strategy');
  if (val === 'puter' || val === 'supabase' || val === 'firebase' || val === 'box') {
    return val;
  }
  return 'puter';
}

export function setDbStrategy(strategy: DbStrategy): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pensieve_db_strategy', strategy);
}

/**
 * Fetch items from Firebase Firestore
 */
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

/**
 * Save items to Firebase Firestore
 */
async function saveToFirebase(userId: string, items: MindItem[]): Promise<boolean> {
  try {
    const docRef = doc(db, 'pensieve_users', userId);
    await setDoc(docRef, { 
      items,
      updated_at: new Date().toISOString()
    }, { merge: true });
    console.log(`[Firebase Firestore] Successfully saved ${items.length} items to Firestore.`);
    return true;
  } catch (error) {
    console.error('[Firebase Firestore] Error saving to Firebase:', error);
    return false;
  }
}

/**
 * Fetch items from Supabase via REST API
 */
async function fetchFromSupabase(userId: string): Promise<MindItem[] | null> {
  const url = localStorage.getItem('pensieve_supabase_url');
  const key = localStorage.getItem('pensieve_supabase_key');
  if (!url || !key) return null;

  try {
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    // We try to fetch from a table named 'pensieve_items' or 'pensieve_kv'
    const response = await fetch(`${cleanUrl}/rest/v1/pensieve_kv?key=eq.items_${userId}`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].value) {
        const parsed = JSON.parse(data[0].value);
        if (Array.isArray(parsed)) return parsed;
      }
    } else {
      console.warn(`[Supabase REST] Fetch returned status: ${response.status}. Table may not exist or permissions missing.`);
    }
  } catch (error) {
    console.error('[Supabase REST] Error fetching from Supabase:', error);
  }
  return null;
}

/**
 * Save items to Supabase via REST API (UPSERT)
 */
async function saveToSupabase(userId: string, items: MindItem[]): Promise<boolean> {
  const url = localStorage.getItem('pensieve_supabase_url');
  const key = localStorage.getItem('pensieve_supabase_key');
  if (!url || !key) return false;

  try {
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const body = {
      key: `items_${userId}`,
      value: JSON.stringify(items),
      updated_at: new Date().toISOString()
    };

    const response = await fetch(`${cleanUrl}/rest/v1/pensieve_kv`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates' // Upsert support
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      console.log(`[Supabase REST] Successfully saved ${items.length} items to Supabase.`);
      return true;
    } else {
      console.warn(`[Supabase REST] Save returned status: ${response.status}. Table 'pensieve_kv' might not be configured.`);
    }
  } catch (error) {
    console.error('[Supabase REST] Error saving to Supabase:', error);
  }
  return false;
}

/**
 * Loads mind items based on active strategy
 */
export async function loadDbItems(userId: string, strategy: DbStrategy): Promise<MindItem[]> {
  const localFallback = JSON.parse(localStorage.getItem('pensieve_local_items') || '[]');
  
  if (!userId) {
    return localFallback;
  }

  try {
    if (strategy === 'firebase') {
      const fbItems = await fetchFromFirebase(userId);
      if (fbItems) return fbItems;
    } else if (strategy === 'supabase') {
      const sbItems = await fetchFromSupabase(userId);
      if (sbItems) return sbItems;
    } else if (strategy === 'box') {
      // TODO: Implement Box fetch
      console.warn('[Box] Fetch not yet implemented.');
    } else {
      // Puter strategy
      const puterItems = await getPuterItems(userId);
      if (puterItems && puterItems.length > 0) return puterItems;
    }
  } catch (e) {
    console.warn(`[DB Strategy Service] Loading failed for ${strategy}, utilizing local fallback.`, e);
  }

  return localFallback;
}

/**
 * Saves mind items based on active strategy
 */
export async function saveDbItems(userId: string, items: MindItem[], strategy: DbStrategy): Promise<boolean> {
  // Always save to localStorage first for offline safety
  try {
    localStorage.setItem('pensieve_local_items', JSON.stringify(items));
  } catch (e) {
    console.error('[DB Strategy Service] Local fallback saving failed:', e);
  }

  if (!userId) {
    return false;
  }

  try {
    if (strategy === 'firebase') {
      return await saveToFirebase(userId, items);
    } else if (strategy === 'supabase') {
      return await saveToSupabase(userId, items);
    } else if (strategy === 'box') {
      // TODO: Implement Box save
      console.warn('[Box] Save not yet implemented.');
      return false;
    } else {
      // Puter strategy
      return await savePuterItems(userId, items);
    }
  } catch (e) {
    console.error(`[DB Strategy Service] Save failed for ${strategy}`, e);
    return false;
  }
}
