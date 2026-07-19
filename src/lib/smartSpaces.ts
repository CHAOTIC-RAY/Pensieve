/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Smart Spaces — saved searches that auto-collect matching mind items (mymind-style).
 */

export interface SmartSpace {
  id: string;
  name: string;
  query: string;
  category: string; // 'all' | 'favorites' | type id
  colorFilter: string | null;
  createdAt: string;
}

const STORAGE_KEY = 'pensieve_smart_spaces';

export function loadSmartSpaces(): SmartSpace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSmartSpaces(spaces: SmartSpace[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(spaces));
}

export function createSmartSpace(input: {
  name: string;
  query: string;
  category?: string;
  colorFilter?: string | null;
}): SmartSpace {
  const space: SmartSpace = {
    id: `space_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim() || 'Untitled Space',
    query: input.query.trim(),
    category: input.category || 'all',
    colorFilter: input.colorFilter || null,
    createdAt: new Date().toISOString(),
  };
  const next = [space, ...loadSmartSpaces()];
  saveSmartSpaces(next);
  return space;
}

export function deleteSmartSpace(id: string): SmartSpace[] {
  const next = loadSmartSpaces().filter((s) => s.id !== id);
  saveSmartSpaces(next);
  return next;
}

export function renameSmartSpace(id: string, name: string): SmartSpace[] {
  const next = loadSmartSpaces().map((s) =>
    s.id === id ? { ...s, name: name.trim() || s.name } : s
  );
  saveSmartSpaces(next);
  return next;
}
