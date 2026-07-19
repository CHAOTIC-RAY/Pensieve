/**
 * Pensieve Brain — deterministic local intelligence (no models).
 *
 * 1) organizeWithBrain — enrich captures (classify, tag, summarize)
 * 2) answerWithBrain — conversational vault assistant for the playground
 */

import type { MindItem, MindItemType } from '../types';

const STOP = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her',
  'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its',
  'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'did', 'let',
  'put', 'say', 'she', 'too', 'use', 'with', 'this', 'that', 'from', 'have',
  'been', 'were', 'they', 'will', 'your', 'what', 'when', 'them', 'than',
  'then', 'some', 'into', 'could', 'other', 'about', 'which', 'their', 'there',
  'would', 'make', 'like', 'just', 'over', 'such', 'also', 'back', 'after',
  'https', 'http', 'www', 'com', 'org', 'net', 'html', 'null', 'undefined',
  'untitled', 'saved', 'item', 'link', 'page', 'here', 'thing', 'really',
  'very', 'much', 'more', 'most', 'only', 'also', 'into', 'than', 'then',
]);

const TOPIC_LEXICON: Record<string, string[]> = {
  design: ['design', 'ui', 'ux', 'figma', 'typography', 'layout', 'palette', 'aesthetic', 'minimal', 'brutalist', 'wireframe', 'mockup'],
  coding: ['code', 'programming', 'javascript', 'typescript', 'python', 'api', 'github', 'dev', 'software', 'bug', 'refactor', 'react', 'node'],
  productivity: ['todo', 'task', 'habit', 'focus', 'pomodoro', 'notion', 'checklist', 'goal', 'plan', 'deadline', 'priority'],
  cooking: ['recipe', 'ingredient', 'bake', 'cook', 'oven', 'garlic', 'sauce', 'meal', 'kitchen', 'tbsp', 'tsp', 'cup', 'simmer'],
  music: ['album', 'song', 'playlist', 'spotify', 'band', 'lyrics', 'concert', 'jazz', 'vinyl', 'track', 'podcast'],
  film: ['movie', 'film', 'cinema', 'trailer', 'director', 'netflix', 'imdb', 'watch', 'series', 'episode'],
  health: ['workout', 'fitness', 'sleep', 'nutrition', 'mental', 'therapy', 'yoga', 'run', 'meditat'],
  finance: ['money', 'invest', 'stock', 'budget', 'crypto', 'salary', 'tax', 'invoice'],
  travel: ['travel', 'flight', 'hotel', 'city', 'map', 'trip', 'airport', 'itinerary'],
  learning: ['learn', 'course', 'tutorial', 'book', 'study', 'lecture', 'research', 'essay'],
  philosophy: ['philosophy', 'stoic', 'meaning', 'wisdom', 'ethics', 'existence', 'mindful'],
  nature: ['forest', 'ocean', 'mountain', 'garden', 'plant', 'wildlife', 'sky', 'landscape'],
  writing: ['draft', 'journal', 'essay', 'blog', 'story', 'poem', 'chapter'],
  work: ['meeting', 'standup', 'client', 'project', 'sprint', 'roadmap', 'okr'],
};

const HOST_CATEGORY: Array<{ test: RegExp; category: MindItemType; site: string; color: string; tags: string[] }> = [
  { test: /youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|netflix\.com|imdb\.com|disneyplus|hulu\.com/i, category: 'video', site: 'Video', color: 'red', tags: ['video', 'watch'] },
  { test: /spotify\.com|music\.apple\.com|soundcloud\.com|bandcamp\.com|tidal\.com|podcasts\.apple/i, category: 'music', site: 'Music', color: 'green', tags: ['music', 'listen'] },
  { test: /twitter\.com|x\.com|threads\.net|mastodon|bluesky|bsky\.app/i, category: 'tweet', site: 'Social', color: 'blue', tags: ['tweet', 'social'] },
  { test: /medium\.com|substack\.com|ghost\.io|blog\.|hashnode|dev\.to/i, category: 'article', site: 'Article', color: 'green', tags: ['article', 'read'] },
  { test: /wikipedia\.org|britannica\.com/i, category: 'article', site: 'Wikipedia', color: 'grey', tags: ['wiki', 'reference'] },
  { test: /github\.com|gitlab\.com|stackoverflow\.com|npmjs\.com|crates\.io/i, category: 'link', site: 'Dev', color: 'purple', tags: ['code', 'devtools'] },
  { test: /figma\.com|dribbble\.com|behance\.net|pinterest\.com|are\.na/i, category: 'link', site: 'Design', color: 'pink', tags: ['design', 'inspiration'] },
  { test: /docs\.google\.com|notion\.so|dropbox\.com|drive\.google|\.pdf($|\?)|paper\.dropbox/i, category: 'document', site: 'Docs', color: 'blue', tags: ['document'] },
  { test: /allrecipes\.com|bbcgoodfood|seriouseats|nytimes\.com\/.*recipe|bonappetit|epicurious/i, category: 'recipe', site: 'Recipe', color: 'orange', tags: ['recipe', 'cooking'] },
  { test: /amazon\.|ebay\.|etsy\.|shopify|producthunt/i, category: 'product', site: 'Shop', color: 'yellow', tags: ['product', 'shopping'] },
  { test: /linkedin\.com/i, category: 'link', site: 'LinkedIn', color: 'blue', tags: ['career', 'work'] },
  { test: /reddit\.com/i, category: 'link', site: 'Reddit', color: 'orange', tags: ['discussion', 'forum'] },
  { test: /news\.ycombinator|arstechnica|techcrunch|theverge|wired\.com/i, category: 'article', site: 'Tech News', color: 'orange', tags: ['news', 'tech'] },
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
  confidence?: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s#_@-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP.has(w) && !/^\d+$/.test(w));
}

function scoreKeywords(text: string, limit = 10): string[] {
  const freq = new Map<string, number>();
  for (const t of tokenize(text)) {
    const weight = t.startsWith('#') || t.startsWith('@') ? 3 : t.length > 6 ? 2 : 1;
    freq.set(t.replace(/^[#@]/, ''), (freq.get(t.replace(/^[#@]/, '')) || 0) + weight);
  }
  // bigrams
  const words = tokenize(text);
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i].replace(/^[#@]/, '');
    const b = words[i + 1].replace(/^[#@]/, '');
    if (a.length < 3 || b.length < 3) continue;
    const big = `${a}-${b}`;
    if (big.length > 24) continue;
    freq.set(big, (freq.get(big) || 0) + 1.5);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .filter((k) => !STOP.has(k))
    .slice(0, limit);
}

function uniqueTags(tags: string[], limit = 14): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.toLowerCase().replace(/[^a-z0-9#_-]/g, '').slice(0, 32);
    if (!t || STOP.has(t) || seen.has(t) || t.length < 2) continue;
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
  return parts.slice(0, max).join(' ').slice(0, 320);
}

function cleanTitle(title: string, siteName?: string): string {
  let t = (title || '').trim();
  if (!t) return '';
  t = t.replace(/\s*[\|\u2013\u2014\-]\s*[^\|\u2013\u2014\-]{2,40}$/, '').trim();
  if (siteName) {
    const re = new RegExp(`\\s*[\\|\\-]\\s*${siteName}\\s*$`, 'i');
    t = t.replace(re, '').trim();
  }
  t = t.replace(/^\(\d+\)\s*/, '').replace(/\s+-\s+YouTube$/i, '');
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

function classifyUrl(url?: string, text = ''): { category: MindItemType; siteName: string; color: string; tags: string[]; confidence: number } {
  const blob = `${url || ''} ${text}`.toLowerCase();
  for (const rule of HOST_CATEGORY) {
    if (rule.test.test(blob)) {
      return {
        category: rule.category,
        siteName: brandFromHost(hostnameOf(url)) || rule.site,
        color: rule.color,
        tags: rule.tags,
        confidence: 0.92,
      };
    }
  }
  if (/\b(ingredient|tablespoon|preheat|bake for|serves\s+\d)\b/i.test(text)) {
    return { category: 'recipe', siteName: brandFromHost(hostnameOf(url)) || 'Recipe', color: 'orange', tags: ['recipe', 'cooking'], confidence: 0.8 };
  }
  if (url && /\.pdf($|\?)/i.test(url)) {
    return { category: 'document', siteName: 'PDF', color: 'blue', tags: ['document', 'pdf'], confidence: 0.9 };
  }
  if (text.length > 600 || /\b(published|min read|minutes read|by )\b/i.test(text)) {
    return { category: 'article', siteName: brandFromHost(hostnameOf(url)) || 'Article', color: 'green', tags: ['article', 'read'], confidence: 0.7 };
  }
  return {
    category: 'link',
    siteName: brandFromHost(hostnameOf(url)) || 'Link',
    color: 'grey',
    tags: ['link', 'bookmark'],
    confidence: 0.55,
  };
}

function topicTags(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [topic, words] of Object.entries(TOPIC_LEXICON)) {
    const hits = words.filter((w) => lower.includes(w)).length;
    if (hits > 0) found.push(topic);
  }
  return found;
}

function detectMood(text: string): string | null {
  const t = text.toLowerCase();
  if (/\b(urgent|asap|deadline|critical)\b/.test(t)) return 'urgent';
  if (/\b(idea|brainstorm|what if|maybe)\b/.test(t)) return 'idea';
  if (/\b(grateful|love|beautiful|joy|happy)\b/.test(t)) return 'uplifting';
  if (/\b(worried|anxious|stress|hard|difficult)\b/.test(t)) return 'heavy';
  if (/\b(todo|checklist|remind|later)\b/.test(t)) return 'actionable';
  return null;
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
  red: ['Crimson Ember', 'Cherry Signal', 'Brick Warmth', 'Ruby Pulse'],
  orange: ['Warm Terracotta', 'Apricot Glow', 'Sunset Clay', 'Copper Dawn'],
  yellow: ['Soft Saffron', 'Candlelight', 'Honey Mist', 'Lemon Quiet'],
  green: ['Sage Quiet', 'Forest Breath', 'Moss Note', 'Olive Room'],
  blue: ['Harbor Blue', 'Clear Horizon', 'Ink Tide', 'Sky Archive'],
  purple: ['Dusk Violet', 'Quiet Plum', 'Amethyst Air', 'Iris Study'],
  pink: ['Blush Petal', 'Rose Quartz', 'Soft Coral', 'Peony Dust'],
  brown: ['Walnut Study', 'Cocoa Dust', 'Amber Earth', 'Cedar Note'],
  black: ['Deep Ink', 'Night Graphite', 'Obsidian', 'Charcoal'],
  white: ['Paper White', 'Cloud Quiet', 'Porcelain', 'Chalk Soft'],
  grey: ['Soft Slate', 'Fog Grey', 'Stone Calm', 'Ash Mist'],
};

function nameColor(hex: string, group: string): string {
  const list = COLOR_NAMES[group] || COLOR_NAMES.grey;
  const n = (hex.replace('#', '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % list.length;
  return list[n];
}

function extractQuoteAuthor(content: string): { quote: string; author?: string } {
  const text = content.trim();
  const m =
    text.match(/["“](.+?)["”]\s*[\u2014\u2013\-—]\s*(.+)$/s) ||
    text.match(/^(.+?)\s*[\u2014\u2013—]\s*([A-Z][\w .']{1,40})$/s) ||
    text.match(/^(.+?)\n+[-–—]\s*(.+)$/s);
  if (m) {
    return { quote: m[1].replace(/^["“]|["”]$/g, '').trim(), author: m[2].trim() };
  }
  return { quote: text };
}

function extractRecipeBits(text: string): { ingredients?: string[]; steps?: string[] } {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const ingredients = lines
    .filter((l) => /^[-*•]|\b(cup|tbsp|tsp|grams?|oz|ml|clove|onion|salt|pepper|butter|oil)\b/i.test(l))
    .slice(0, 20);
  const steps = lines
    .filter((l) => /^\d+[\).\]]\s+|^(then|next|finally|mix|stir|bake|heat|add)\b/i.test(l))
    .slice(0, 20);
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
    writing: 'brown',
    work: 'blue',
  };
  for (const t of topics) {
    if (map[t]) return map[t];
  }
  return fallback;
}

function extractHashtags(text: string): string[] {
  return (text.match(/#[a-z0-9_]{2,30}/gi) || []).map((h) => h.slice(1).toLowerCase());
}

function noteTitleFromBody(content: string): string {
  const line = content
    .split(/\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 2 && !/^[-*•\d]/.test(l));
  if (!line) return '';
  return line.length > 72 ? `${line.slice(0, 69)}…` : line;
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
  const topics = topicTags(corpus);
  const keywords = scoreKeywords(corpus, 12);
  const hashtags = extractHashtags(corpus);
  const mood = detectMood(corpus);

  if (type === 'color' && item.colorHex) {
    const dominantColor = nearestColorName(item.colorHex);
    const title = nameColor(item.colorHex, dominantColor);
    const tags = uniqueTags([
      'color',
      'palette',
      dominantColor,
      item.colorHex.toLowerCase(),
      ...topics,
      mood || (dominantColor === 'blue' || dominantColor === 'green' ? 'calm' : 'accent'),
      'swatch',
    ]);
    return {
      success: true,
      title,
      content: `${title} (${item.colorHex}) — a ${dominantColor} tone suited for boards, accents, and mood matching.`,
      category: 'color',
      tags,
      aiSummary: `${title}: ${dominantColor} swatch ready for palette search.`,
      dominantColor,
      analyzedBy: 'brain',
      confidence: 0.95,
    };
  }

  if (type === 'quote') {
    const { quote, author } = extractQuoteAuthor(contentIn || titleIn);
    const tags = uniqueTags([
      'quote',
      'wisdom',
      ...topics,
      ...scoreKeywords(quote, 6),
      ...hashtags,
      author ? 'attribution' : 'reflection',
      mood || '',
    ]);
    const title = topics[0]
      ? `On ${topics[0].charAt(0).toUpperCase()}${topics[0].slice(1)}`
      : cleanTitle(titleIn) || scoreKeywords(quote, 3).slice(0, 2).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') || 'Saved Quote';
    return {
      success: true,
      title,
      content: quote,
      author: author || item.author,
      category: 'quote',
      tags,
      aiSummary: author
        ? `"${firstSentences(quote, 1).slice(0, 100)}" — ${author}`
        : firstSentences(quote, 1) || 'Quote saved for later reflection.',
      dominantColor: vibeFromTopics(topics, mood === 'uplifting' ? 'yellow' : 'grey'),
      analyzedBy: 'brain',
      confidence: author ? 0.85 : 0.7,
    };
  }

  if (type === 'note' || type === 'recipe') {
    const recipeBits = extractRecipeBits(contentIn);
    const isRecipe =
      type === 'recipe' ||
      Boolean(recipeBits.ingredients?.length && recipeBits.steps?.length) ||
      /\b(ingredient|preheat|tablespoon|serves\s+\d)\b/i.test(contentIn);
    const isTodo = /^(\s*[-*•]|\s*\[[ x]\]|\s*\d+[\).])/im.test(contentIn) || /\b(todo|checklist)\b/i.test(contentIn);
    const category: MindItemType = isRecipe ? 'recipe' : 'note';
    const tags = uniqueTags([
      category,
      ...topics,
      ...keywords.slice(0, 8),
      ...hashtags,
      isRecipe ? 'cooking' : isTodo ? 'todo' : 'personal',
      mood || '',
    ]);
    const title =
      cleanTitle(titleIn) ||
      noteTitleFromBody(contentIn) ||
      (isRecipe ? 'Recipe note' : isTodo ? 'Checklist' : 'Untitled note');
    return {
      success: true,
      title,
      content: contentIn,
      category,
      tags,
      aiSummary:
        firstSentences(contentIn, 1) ||
        (isTodo ? 'Actionable checklist captured in your vault.' : `${category} indexed with ${tags.length} tags.`),
      dominantColor: vibeFromTopics(topics, isRecipe ? 'orange' : mood === 'urgent' ? 'red' : 'yellow'),
      ingredients: recipeBits.ingredients,
      steps: recipeBits.steps,
      analyzedBy: 'brain',
      confidence: isRecipe ? 0.88 : 0.75,
    };
  }

  if (type === 'image') {
    const tags = uniqueTags(['image', 'visual', ...topics, ...keywords, ...hashtags, 'capture', mood || '']);
    const title = cleanTitle(titleIn) || (topics[0] ? `${topics[0][0].toUpperCase()}${topics[0].slice(1)} image` : 'Saved image');
    return {
      success: true,
      title,
      content: contentIn || 'Visual capture stored in your vault.',
      category: 'image',
      tags,
      aiSummary: contentIn ? firstSentences(contentIn, 1) : `Image tagged for ${topics[0] || 'visual'} search.`,
      dominantColor: vibeFromTopics(topics, 'grey'),
      analyzedBy: 'brain',
      confidence: 0.6,
    };
  }

  const classified = classifyUrl(item.url, corpus);
  const category = (
    ['link', 'article', 'video', 'music', 'tweet', 'recipe', 'document', 'product'].includes(type)
      ? type === 'link' || type === 'article'
        ? classified.category
        : type
      : classified.category
  ) as MindItemType;

  const siteName = item.siteName || classified.siteName;
  const title = cleanTitle(titleIn, siteName) || siteName || 'Saved link';
  const summarySource = contentIn || body || title;
  const aiSummary = firstSentences(summarySource, 1) || `${category} from ${siteName || 'the web'} — tagged for recall.`;
  const content = firstSentences(contentIn || body, 2) || aiSummary;
  const hostTokens = tokenize(hostnameOf(item.url).replace(/\./g, ' '));

  const tags = uniqueTags([
    category,
    ...classified.tags,
    ...topics,
    ...keywords.slice(0, 6),
    ...hashtags,
    ...hostTokens.slice(0, 2),
    siteName?.toLowerCase() || '',
    mood || '',
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
    confidence: classified.confidence,
  };

  if (category === 'article') {
    result.readingTime = readingMinutes(body || contentIn || title);
  }
  if (category === 'recipe') {
    Object.assign(result, extractRecipeBits(body || contentIn));
  }
  if (category === 'tweet') {
    const handle = (item.url || '').match(/(?:twitter|x)\.com\/([^/]+)/i);
    if (handle?.[1] && !['i', 'home', 'search'].includes(handle[1])) {
      result.authorUsername = `@${handle[1]}`;
      result.author = handle[1];
    }
  }

  return result;
}

/* ─── Conversational vault brain ─────────────────────────────────────────── */

type BrainIntent =
  | 'greet'
  | 'help'
  | 'stats'
  | 'search'
  | 'recent'
  | 'favorites'
  | 'topics'
  | 'enrich'
  | 'compare'
  | 'unknown';

function detectIntent(query: string): { intent: BrainIntent; searchQuery: string } {
  const q = query.trim();
  const lower = q.toLowerCase();

  if (/^(hi|hello|hey|yo|sup|good\s*(morning|afternoon|evening)|howdy)\b/.test(lower) || lower.length < 3) {
    if (/^(hi|hello|hey|yo|sup|howdy|good\s)/.test(lower)) return { intent: 'greet', searchQuery: '' };
  }
  if (/\b(help|what can you|capabilities|how do you|commands)\b/.test(lower)) {
    return { intent: 'help', searchQuery: '' };
  }
  if (/\b(stats?|overview|how many|vault size|summary of (my )?vault|dashboard)\b/.test(lower)) {
    return { intent: 'stats', searchQuery: '' };
  }
  if (/\b(recent|latest|last saved|what did i (save|add)|newest)\b/.test(lower)) {
    return { intent: 'recent', searchQuery: '' };
  }
  if (/\b(favorite|favourites|starred|pinned|top mind)\b/.test(lower)) {
    return { intent: 'favorites', searchQuery: '' };
  }
  if (/\b(topics?|themes?|what am i (into|collecting)|interests)\b/.test(lower)) {
    return { intent: 'topics', searchQuery: '' };
  }
  if (/\b(index|enrich|tag|classify|organize)\b/.test(lower) || /^(https?:\/\/\S+)$/i.test(q.trim())) {
    const url = q.match(/https?:\/\/\S+/i)?.[0];
    const rest = q.replace(/https?:\/\/\S+/gi, '').replace(/\b(index|enrich|tag|classify|organize)\b/gi, '').trim();
    return { intent: 'enrich', searchQuery: url || rest || q };
  }
  if (/\b(find|search|show|list|where is|look for|about|related to|do i have)\b/.test(lower)) {
    const cleaned = lower
      .replace(/\b(find|search|show|list|me|please|where is|look for|about|related to|do i have|any|some)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return { intent: 'search', searchQuery: cleaned || q };
  }

  // Default: treat as vault search if query has substance
  if (tokenize(q).length >= 1) return { intent: 'search', searchQuery: q };
  return { intent: 'unknown', searchQuery: q };
}

function itemBlob(item: MindItem): string {
  return [
    item.title,
    item.content,
    item.aiSummary,
    item.url,
    item.siteName,
    item.author,
    ...(item.tags || []),
    ...(item.aiTags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function scoreItem(item: MindItem, terms: string[]): number {
  if (!terms.length) return 0;
  const blob = itemBlob(item);
  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    if ((item.title || '').toLowerCase().includes(term)) score += 4;
    if ((item.tags || []).some((t) => t.toLowerCase().includes(term))) score += 3;
    if ((item.aiTags || []).some((t) => t.toLowerCase().includes(term))) score += 2.5;
    if (blob.includes(term)) score += 1;
    if (item.type === term) score += 2;
  }
  if (item.isFavorite || item.isTopMind) score += 0.5;
  return score;
}

function searchVault(items: MindItem[], query: string, limit = 8): Array<{ item: MindItem; score: number }> {
  const terms = tokenize(query);
  if (!terms.length) return [];
  return items
    .map((item) => ({ item, score: scoreItem(item, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || (b.item.createdAt || '').localeCompare(a.item.createdAt || ''))
    .slice(0, limit);
}

function vaultStats(items: MindItem[]) {
  const byType = new Map<string, number>();
  const tagFreq = new Map<string, number>();
  let favorites = 0;
  let needsAnalysis = 0;
  for (const it of items) {
    byType.set(it.type, (byType.get(it.type) || 0) + 1);
    if (it.isFavorite || it.isTopMind) favorites++;
    if (it.needsAnalysis) needsAnalysis++;
    for (const t of [...(it.tags || []), ...(it.aiTags || [])]) {
      const k = t.toLowerCase();
      tagFreq.set(k, (tagFreq.get(k) || 0) + 1);
    }
  }
  const topTypes = [...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topTags = [...tagFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topics = topicTags(items.map((i) => `${i.title} ${i.content}`).join(' ').slice(0, 8000));
  return { byType, topTypes, topTags, favorites, needsAnalysis, topics };
}

function formatItemLine(item: MindItem, idx: number): string {
  const bits = [
    `${idx + 1}. [${item.type}] ${item.title || 'Untitled'}`,
    item.aiSummary ? `— ${item.aiSummary.slice(0, 100)}` : item.content ? `— ${item.content.slice(0, 80).replace(/\s+/g, ' ')}` : '',
  ];
  return bits.filter(Boolean).join(' ');
}

/**
 * Conversational / vault-aware brain for the Intelligence Playground.
 * No LLMs — intent routing + vault search + enrichment demos.
 */
export function answerWithBrain(
  query: string,
  items: MindItem[] = [],
  _history: { role: string; content: string }[] = [],
): string {
  const { intent, searchQuery } = detectIntent(query);
  const q = query.trim();

  if (intent === 'greet') {
    const n = items.length;
    const recent = [...items]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 3);
    const lines = [
      `Hey — I'm Pensieve Brain, your local vault intelligence (no AI models).`,
      n
        ? `You're holding **${n}** mind item${n === 1 ? '' : 's'}.`
        : `Your vault is empty — capture a link, note, or color and I'll index it.`,
    ];
    if (recent.length) {
      lines.push('', 'Recent captures:');
      recent.forEach((it, i) => lines.push(formatItemLine(it, i)));
    }
    lines.push('', 'Try: “stats”, “find design”, “recent”, “topics”, or paste a URL to index.');
    return lines.join('\n');
  }

  if (intent === 'help') {
    return [
      'Pensieve Brain can (without AI models):',
      '',
      '• **Index** captures — classify type, tags, summary, color vibe',
      '• **Search** your vault — “find recipes”, “show coding”',
      '• **Stats** — “how many items”, “vault overview”',
      '• **Recent / favorites** — “what did I save”, “show favorites”',
      '• **Topics** — cluster interests from tags & content',
      '• **Enrich a URL** — paste https://… to preview indexing',
      '',
      'Turn on **Local AI** or **Cloud AI** only if you want model chat upgrades.',
    ].join('\n');
  }

  if (intent === 'stats') {
    const s = vaultStats(items);
    if (!items.length) return 'Vault is empty — nothing to summarize yet.';
    return [
      `**Vault overview** (${items.length} items)`,
      '',
      'By type: ' + s.topTypes.map(([t, c]) => `${t} ${c}`).join(' · '),
      s.favorites ? `Favorites / top minds: ${s.favorites}` : null,
      s.needsAnalysis ? `Still queued for enrichment: ${s.needsAnalysis}` : null,
      s.topics.length ? `Detected themes: ${s.topics.join(', ')}` : null,
      s.topTags.length ? `Top tags: ${s.topTags.map(([t, c]) => `${t}(${c})`).join(', ')}` : null,
      '',
      'Ask me to **find** something, or say **recent**.',
    ]
      .filter((l) => l !== null)
      .join('\n');
  }

  if (intent === 'recent') {
    const recent = [...items]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 8);
    if (!recent.length) return 'Nothing saved yet.';
    return ['**Latest in your vault:**', '', ...recent.map((it, i) => formatItemLine(it, i))].join('\n');
  }

  if (intent === 'favorites') {
    const favs = items.filter((i) => i.isFavorite || i.isTopMind || i.readLater).slice(0, 10);
    if (!favs.length) return 'No favorites or top minds yet — star something in the vault.';
    return ['**Favorites & focus:**', '', ...favs.map((it, i) => formatItemLine(it, i))].join('\n');
  }

  if (intent === 'topics') {
    const s = vaultStats(items);
    if (!items.length) return 'Capture a few items first — topics emerge from tags and text.';
    const topicHits = s.topics.length
      ? s.topics.map((t) => {
          const hits = items.filter((i) => itemBlob(i).includes(t)).length;
          return `• ${t} — ~${hits} related item${hits === 1 ? '' : 's'}`;
        })
      : ['• Themes still forming — add more tagged captures'];
    return [
      '**What your vault is collecting:**',
      '',
      ...topicHits,
      '',
      s.topTags.length ? `Strong tags: ${s.topTags.slice(0, 6).map(([t]) => t).join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (intent === 'enrich') {
    const url = searchQuery.match(/https?:\/\/\S+/i)?.[0];
    const text = searchQuery.replace(/https?:\/\/\S+/gi, '').trim() || q;
    const draft: Partial<MindItem> = url
      ? { type: 'link', url, title: text || url, content: text }
      : { type: 'note', title: text.slice(0, 80), content: text };
    const brain = organizeWithBrain(draft);
    return [
      '**Brain index preview** (no AI models):',
      '',
      `• Title: ${brain.title}`,
      `• Type: ${brain.category}`,
      `• Tags: ${brain.tags.join(', ')}`,
      `• Summary: ${brain.aiSummary}`,
      `• Color vibe: ${brain.dominantColor}`,
      brain.siteName ? `• Site: ${brain.siteName}` : null,
      brain.readingTime ? `• Reading time: ~${brain.readingTime} min` : null,
      brain.confidence != null ? `• Confidence: ${Math.round(brain.confidence * 100)}%` : null,
      '',
      'Save this capture in the vault to keep it permanently.',
    ]
      .filter((l) => l !== null)
      .join('\n');
  }

  if (intent === 'search') {
    const hits = searchVault(items, searchQuery || q, 8);
    if (!hits.length) {
      const s = vaultStats(items);
      return [
        `I couldn't find a strong match for “${searchQuery || q}”.`,
        s.topTags.length ? `Nearby tags in your vault: ${s.topTags.slice(0, 5).map(([t]) => t).join(', ')}` : '',
        'Try fewer words, a tag, or a type name (e.g. “article”, “recipe”).',
      ]
        .filter(Boolean)
        .join('\n');
    }
    return [
      `**Found ${hits.length} match${hits.length === 1 ? '' : 'es'} for “${searchQuery || q}”:**`,
      '',
      ...hits.map((h, i) => `${formatItemLine(h.item, i)}  · score ${h.score.toFixed(1)}`),
      '',
      'Say **stats** for an overview, or paste a URL to preview indexing.',
    ].join('\n');
  }

  // unknown
  return [
    `I heard “${q.slice(0, 120)}”.`,
    '',
    'As Pensieve Brain I can search your vault, summarize stats, list recent/favorites, or index a URL — without AI models.',
    'Try **help** for commands.',
  ].join('\n');
}
