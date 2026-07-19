/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Wiki-style [[Title]] links + bidirectional resolution helpers.
 */

import type { MindItem } from '../types';

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

export function extractWikiLinkTitles(text: string): string[] {
  if (!text) return [];
  const titles: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(WIKI_LINK_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    const title = match[1].trim();
    if (title && !titles.includes(title)) titles.push(title);
  }
  return titles;
}

export function resolveWikiLinksToIds(text: string, items: MindItem[]): string[] {
  const titles = extractWikiLinkTitles(text);
  const ids: string[] = [];
  for (const title of titles) {
    const found = items.find(
      (i) =>
        i.title.trim().toLowerCase() === title.toLowerCase() ||
        i.id === title
    );
    if (found && !ids.includes(found.id)) ids.push(found.id);
  }
  return ids;
}

/** Merge explicit links + wiki links from title/content into linkedItemIds. */
export function syncLinkedItemIds(item: MindItem, allItems: MindItem[]): string[] {
  const fromWiki = resolveWikiLinksToIds(
    `${item.title || ''}\n${item.content || ''}\n${item.bodyText || ''}`,
    allItems.filter((i) => i.id !== item.id)
  );
  const explicit = item.linkedItemIds || [];
  return Array.from(new Set([...explicit, ...fromWiki]));
}

/** Items that link to `itemId` (backlinks). */
export function getBacklinks(itemId: string, allItems: MindItem[]): MindItem[] {
  return allItems.filter((other) => {
    if (other.id === itemId) return false;
    if (other.linkedItemIds?.includes(itemId)) return true;
    const wikiIds = resolveWikiLinksToIds(
      `${other.title || ''}\n${other.content || ''}`,
      allItems
    );
    return wikiIds.includes(itemId);
  });
}

export function renderContentWithWikiHints(content: string): string {
  return content;
}
