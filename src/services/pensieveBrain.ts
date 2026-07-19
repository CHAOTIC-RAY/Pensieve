/**
 * Pensieve Brain — deterministic, non-AI enrichment.
 * Does the same jobs as /api/analyze (classify, tag, summarize, color vibe)
 * without models or network. Always available offline.
 */

import type { MindItem, MindItemType } from '../types';

const STOP = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her',
  'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its',
  'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'let',
  'put', 'say', 'she', 'too', 'use', 'with', 'this', 'that', 'from', 'have',
  'been', 'were', 'they', 'will', 'your', 'what', 'when', 'them', 'than',
  'then', 'some', 'into', 'could', 'other', 'about', 'which', 'their', 'there',
  'would', 'make', 'like', 'just', 'over', 'such', 'also', 'back', 'after',
  'https', 'http', 'www', 'com', 'org', 'net', 'html', 'null', 'undefined',
  'untitled', 'saved', 'item', 'link', 'page',
]);

const TOPIC_LEXICON: Record<string, string[]> = {
  design: ['design', 'ui', 'ux', 'figma', 'typography', 'layout', 'palette', 'aesthetic', 'minimal', 'brutalist'],
  coding: ['code', 'programming', 'javascript', 'typescript', 'python', 'api', 'github', 'dev', 'software', 'bug', 'refactor'],
  productivity: ['todo', 'task', 'habit', 'focus', 'pomodoro', 'notion', 'checklist', 'goal', 'plan'],
  cooking: ['recipe', 'ingredient', 'bake', 'cook', 'oven', 'garlic', 'sauce', 'meal', 'kitchen', ' tbsp', 'cup'],
  music: ['album', 'song', 'playlist', 'spotify', 'band', 'lyrics', 'concert', 'jazz', 'vinyl'],
  film: ['movie', 'film', 'cinema', 'trailer', 'director', 'netflix', 'imdb', 'watch'],
  health: ['workout', 'fitness', 'sleep', 'nutrition', 'mental', 'therapy', 'yoga', 'run'],
  finance: ['money', 'invest', 'stock', 'budget', 'crypto', 'salary', 'tax'],
  travel: ['travel', 'flight', 'hotel', 'city', 'map', 'trip', 'airport'],
  learning: ['learn', 'course', 'tutorial', 'book', 'study', 'lecture', 'research'],
  philosophy: ['philosophy', 'stoic', 'meaning', 'wisdom', 'ethics', 'existence'],
  nature: ['forest', 'ocean', 'mountain', 'garden', 'plant', 'wildlife', 'sky'],
};

const HOST_CATEGORY: Array<{ test: RegExp; category: MindItemType; site: string; color: string; tags: string[] }> = [
  { test: /youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|netflix\.com|imdb\.com/i, category: 'video', site: 'Video', color: 'red', tags: ['video', 'watch'] },
  { test: /spotify\.com|music\.apple\.com|soundcloud\.com|bandcamp\.com|tidal\.com/i, category: 'music', site: 'Music', color: 'green', tags: ['music', 'listen'] },
  { test: /twitter\.com|x\.com|threads\.net/i, category: 'tweet', site: 'Social', color: 'blue', tags: ['tweet', 'social'] },
  { test: /medium\.com|substack\.com|ghost\.io|blog\./i, category: 'article', site: 'Article', color: 'green', tags: ['article', 'read'] },
  { test: /wikipedia\.org/i, category: 'article', site: 'Wikipedia', color: 'grey', tags: ['wiki', 'reference'] },
  { test: /github\.com|gitlab\.com|stackoverflow\.com/i, category: 'link', site: 'Dev', color: 'purple', tags: ['code', 'devtools'] },
  { test: /figma\.com|dribbble\.com|behance\.net|pinterest\.com/i, category: 'link', site: 'Design', color: 'pink', tags: ['design', 'inspiration'] },
  { test: /docs\.google\.com|notion\.so|dropbox\.com|\.pdf($|\?)/i, category: 'document', site: 'Docs', color: 'blue', tags: ['document'] },
  { test: /allrecipes\.com|bbcgoodfood|serious eats|nytimes\.com\/.*recipe/i, category: 'recipe', site: 'Recipe', color: 'orange', tags: ['recipe', 'cooking'] },
];

export interface BrainResult {
  success: true;
  title: string;
  content: string;
  category?: MindItemType | string;
  tags: string[];
  aiSummary: string;
  dominantColor: string;
  siteName?: string;
  author?: string;
  authorUsername?: string;
  readingTime?: number;
  duration?: string;
  ingredients?: string[];
  steps?: string[];
  analyzedBy: 'brain';
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s#-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w));
}

function uniqueTags(tags: string[], limit = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.toLowerCase().replace(/[^a-z0-9#_-]/g, '').slice(0, 32);
    if (!t || STOP.has(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

function firstSentences(text: string, max = 2): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const parts = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.slice(0, max).join(' ').slice(0, 280);
}

function cleanTitle(title: string, siteName?: string): string {
  let t = (title || '').trim();
  if (!t) return '';
  // Strip common "Title | Site" / "Title - Site" suffixes
  t = t.replace(/\s*[\|\u2013\u2014\-]\s*[^\|\u2013\u2014\-]{2,40}$/, '').trim();
  if (siteName) {
    const re = new RegExp(`\\s*[\\|\\-]\\s*${siteName}\\s*$`, 'i');
    t = t.replace(re, '').trim();
  }
  return t.slice(0, 120) || title.trim().slice(0, 120);
}

function hostnameOf(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function brandFromHost(host: string): string {
  if (!host) return '';
  const base = host.split('.')[0] || host;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function classifyUrl(url?: string, text = ''): { category: MindItemType; siteName: string; color: string; tags: string[] } {
  const blob = `${url || ''} ${text}`.toLowerCase();
  for (const rule of HOST_CATEGORY) {
    if (rule.test.test(blob)) {
      return {
        category: rule.category,
        siteName: rule.site === 'Video' || rule.site === 'Music' || rule.site === 'Social' || rule.site === 'Article' || rule.site === 'Dev' || rule.site === 'Design' || rule.site === 'Docs' || rule.site === 'Recipe'
          ? brandFromHost(hostnameOf(url)) || rule.site
          : rule.site,
        color: rule.color,
        tags: rule.tags,
      };
    }
  }
  if (/\b(ingredient|tablespoon|preheat|bake for)\b/i.test(text)) {
    return { category: 'recipe', siteName: brandFromHost(hostnameOf(url)) || 'Recipe', color: 'orange', tags: ['recipe', 'cooking'] };
  }
  if (url && /\.pdf($|\?)/i.test(url)) {
    return { category: 'document', siteName: 'PDF', color: 'blue', tags: ['document', 'pdf'] };
  }
  if (text.length > 600 || /\b(published|minutes read|by )\b/i.test(text)) {
    return { category: 'article', siteName: brandFromHost(hostnameOf(url)) || 'Article', color: 'green', tags: ['article', 'read'] };
  }
  return {
    category: 'link',
    siteName: brandFromHost(hostnameOf(url)) || 'Link',
    color: 'grey',
    tags: ['link', 'bookmark'],
  };
}

function topicTags(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [topic, words] of Object.entries(TOPIC_LEXICON)) {
    if (words.some((w) => lower.includes(w))) found.push(topic);
  }
  return found;
}

function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.min(60, Math.round(words / 220)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function nearestColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'grey';
  const { r, g, b } = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max < 40) return 'black';
  if (min > 220) return 'white';
  if (max - min < 25) return 'grey';
  if (r > 150 && g > 90 && b < 80 && Math.abs(r - g) < 80) return 'brown';
  if (r >= g && r >= b) return g > 140 ? 'orange' : b > 140 ? 'pink' : 'red';
  if (g >= r && g >= b) return 'green';
  if (b >= r && b >= g) return r > 120 ? 'purple' : 'blue';
  return 'grey';
}

const COLOR_NAMES: Record<string, string[]> = {
  red: ['Crimson Ember', 'Cherry Signal', 'Brick Warmth'],
  orange: ['Warm Terracotta', 'Apricot Glow', 'Sunset Clay'],
  yellow: ['Soft Saffron', 'Candlelight', 'Honey Mist'],
  green: ['Sage Quiet', 'Forest Breath', 'Moss Note'],
  blue: ['Harbor Blue', 'Clear Horizon', 'Ink Tide'],
  purple: ['Dusk Violet', 'Quiet Plum', 'Amethyst Air'],
  pink: ['Blush Petal', 'Rose Quartz', 'Soft Coral'],
  brown: ['Walnut Study', 'Cocoa Dust', 'Amber Earth'],
  black: ['Deep Ink', 'Night Graphite', 'Obsidian'],
  white: ['Paper White', 'Cloud Quiet', 'Porcelain'],
  grey: ['Soft Slate', 'Fog Grey', 'Stone Calm'],
};

function nameColor(hex: string, group: string): string {
  const list = COLOR_NAMES[group] || COLOR_NAMES.grey;
  const n = (hex.replace('#', '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % list.length;
  return list[n];
}

function extractQuoteAuthor(content: string): { quote: string; author?: string } {
  const text = content.trim();
  const m =
    text.match(/[""](.+?)[""]\s*[\u2014\u2013\-—]\s*(.+)$/s) ||
    text.match(/^(.+?)\s*[\u2014\u2013—]\s*([A-Z][\w .']{1,40})$/s) ||
    text.match(/^(.+?)\n+[-–—]\s*(.+)$/s);
  if (m) {
    return { quote: m[1].replace(/^[""]|[""]$/g, '').trim(), author: m[2].trim() };
  }
  return { quote: text };
}

function extractRecipeBits(text: string): { ingredients?: string[]; steps?: string[] } {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const ingredients = lines.filter((l) =>
    /^[-*•]|\b(cup|tbsp|tsp|grams?|oz|ml|clove|onion|salt|pepper|butter|oil)\b/i.test(l)
  ).slice(0, 20);
  const steps = lines.filter((l) =>
    /^\d+[\).\]]\s+|^(then|next|finally|mix|stir|bake|heat|add)\b/i.test(l)
  ).slice(0, 20);
  return {
    ingredients: ingredients.length ? ingredients : undefined,
    steps: steps.length ? steps : undefined,
  };
}

function vibeFromTopics(topics: string[], fallback = 'grey'): string {
  const map: Record<string, string> = {
    design: 'pink',
    coding: 'purple',
    productivity: 'yellow',
    cooking: 'orange',
    music: 'green',
    film: 'red',
    health: 'green',
    finance: 'blue',
    travel: 'blue',
    learning: 'yellow',
    philosophy: 'grey',
    nature: 'green',
  };
  for (const t of topics) {
    if (map[t]) return map[t];
  }
  return fallback;
}

/**
 * Enrich a mind item with classification, tags, and summary — no AI required.
 */
export function organizeWithBrain(item: Partial<MindItem> & { bodyText?: string; type?: string }): BrainResult {
  const type = (item.type || 'note') as MindItemType;
  const titleIn = item.title || '';
  const contentIn = item.content || '';
  const body = item.bodyText || '';
  const corpus = [titleIn, contentIn, body, item.url || ''].join(' ');
  const tokens = tokenize(corpus);
  const topics = topicTags(corpus);

  if (type === 'color' && item.colorHex) {
    const dominantColor = nearestColorName(item.colorHex);
    const title = nameColor(item.colorHex, dominantColor);
    const tags = uniqueTags([
      'color',
      'palette',
      dominantColor,
      item.colorHex.toLowerCase(),
      ...topics,
      dominantColor === 'blue' || dominantColor === 'green' ? 'calm' : 'accent',
      'swatch',
    ]);
    return {
      success: true,
      title,
      content: `${title} (${item.colorHex}) — a ${dominantColor} tone for boards, accents, and mood matching.`,
      category: 'color',
      tags,
      aiSummary: `${title}: indexed as a ${dominantColor} palette swatch.`,
      dominantColor,
      analyzedBy: 'brain',
    };
  }

  if (type === 'quote') {
    const { quote, author } = extractQuoteAuthor(contentIn || titleIn);
    const tags = uniqueTags(['quote', 'wisdom', ...topics, ...tokenize(quote).slice(0, 6), author ? 'attribution' : 'reflection']);
    const title = topics[0]
      ? `On ${topics[0].charAt(0).toUpperCase()}${topics[0].slice(1)}`
      : cleanTitle(titleIn) || 'Saved Quote';
    return {
      success: true,
      title,
      content: quote,
      author: author || item.author,
      category: 'quote',
      tags,
      aiSummary: author ? `Quote attributed to ${author}.` : firstSentences(quote, 1) || 'Saved quote for later reflection.',
      dominantColor: vibeFromTopics(topics, 'grey'),
      analyzedBy: 'brain',
    };
  }

  if (type === 'note' || type === 'recipe') {
    const recipeBits = extractRecipeBits(contentIn);
    const isRecipe =
      type === 'recipe' ||
      Boolean(recipeBits.ingredients?.length && recipeBits.steps?.length) ||
      /\b(ingredient|preheat|tablespoon)\b/i.test(contentIn);
    const category: MindItemType = isRecipe ? 'recipe' : 'note';
    const tags = uniqueTags([
      category,
      ...topics,
      ...tokenize(titleIn).slice(0, 4),
      ...tokenize(contentIn).slice(0, 8),
      isRecipe ? 'cooking' : 'personal',
    ]);
    const title = cleanTitle(titleIn) || (isRecipe ? 'Recipe note' : firstSentences(contentIn, 1).slice(0, 60) || 'Untitled note');
    return {
      success: true,
      title,
      content: contentIn,
      category,
      tags,
      aiSummary: firstSentences(contentIn, 1) || `${category} saved to your vault.`,
      dominantColor: vibeFromTopics(topics, isRecipe ? 'orange' : 'yellow'),
      ingredients: recipeBits.ingredients,
      steps: recipeBits.steps,
      analyzedBy: 'brain',
    };
  }

  if (type === 'image') {
    const tags = uniqueTags(['image', 'visual', ...topics, ...tokenize(titleIn), ...tokenize(contentIn).slice(0, 8), 'capture']);
    const title = cleanTitle(titleIn) || 'Saved image';
    return {
      success: true,
      title,
      content: contentIn || 'Visual capture stored in your vault.',
      category: 'image',
      tags,
      aiSummary: contentIn ? firstSentences(contentIn, 1) : 'Image indexed for visual search.',
      dominantColor: vibeFromTopics(topics, 'grey'),
      analyzedBy: 'brain',
    };
  }

  // Links, articles, videos, music, tweets, documents, generic
  const classified = classifyUrl(item.url, corpus);
  const category = (['link', 'article', 'video', 'music', 'tweet', 'recipe', 'document'].includes(type)
    ? (type === 'link' || type === 'article' ? classified.category : type)
    : classified.category) as MindItemType;

  const siteName = item.siteName || classified.siteName;
  const title = cleanTitle(titleIn, siteName) || siteName || 'Saved link';
  const summarySource = contentIn || body || title;
  const aiSummary = firstSentences(summarySource, 1) || `Saved from ${siteName || 'the web'}.`;
  const content = firstSentences(contentIn || body, 2) || aiSummary;

  const hostTokens = tokenize(hostnameOf(item.url).replace(/\./g, ' '));
  const tags = uniqueTags([
    category,
    ...classified.tags,
    ...topics,
    ...tokenize(title).slice(0, 5),
    ...tokenize(contentIn).slice(0, 6),
    ...hostTokens.slice(0, 2),
    siteName?.toLowerCase() || '',
  ]);

  const result: BrainResult = {
    success: true,
    title,
    content,
    category,
    tags,
    aiSummary,
    dominantColor: classified.color || vibeFromTopics(topics, 'grey'),
    siteName,
    analyzedBy: 'brain',
  };

  if (category === 'article') {
    result.readingTime = readingMinutes(body || contentIn || title);
  }
  if (category === 'recipe') {
    Object.assign(result, extractRecipeBits(body || contentIn));
  }
  if (category === 'tweet') {
    const handle = (item.url || '').match(/(?:twitter|x)\.com\/([^/]+)/i);
    if (handle && handle[1] && !['i', 'home', 'search'].includes(handle[1])) {
      result.authorUsername = `@${handle[1]}`;
      result.author = handle[1];
    }
  }

  return result;
}
