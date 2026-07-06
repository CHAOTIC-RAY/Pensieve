import { useMemo } from 'react';
import Fuse from 'fuse.js';
import * as chrono from 'chrono-node';
import { MindItem } from '../types';

export interface SearchResult {
  item: MindItem;
  score: number;
  matches?: any[];
}

/**
 * Advanced Search Optimization Engine
 * Implements Inverted Index, Heuristic Rule-Based Optimization,
 * and Cardinality Estimation for performance.
 */
class SearchOptimizer {
  private index: Map<string, Set<string>> = new Map();
  private itemsMap: Map<string, MindItem> = new Map();
  private termFrequency: Map<string, number> = new Map();
  private temporalIndex: { id: string, date: number }[] = [];

  constructor(items: MindItem[]) {
    this.buildIndex(items);
  }

  private buildIndex(items: MindItem[]) {
    const startTime = performance.now();
    this.index.clear();
    this.itemsMap.clear();
    this.termFrequency.clear();
    this.temporalIndex = [];

    for (const item of items) {
      this.itemsMap.set(item.id, item);
      const timestamp = new Date(item.createdAt).getTime();
      this.temporalIndex.push({ id: item.id, date: timestamp });
      
      // Extract terms from searchable fields
      const text = ` ${item.title || ''} ${item.content || ''} ${(item.tags || []).join(' ')} ${item.url || ''} `.toLowerCase();
      const terms = text.split(/[^a-z0-9]/).filter(t => t.length > 1);
      
      const uniqueTerms = new Set(terms);
      for (const term of uniqueTerms) {
        if (!this.index.has(term)) {
          this.index.set(term, new Set());
        }
        this.index.get(term)!.add(item.id);
        this.termFrequency.set(term, (this.termFrequency.get(term) || 0) + 1);
      }
    }

    // Temporal Index Optimization: Sort by date for efficient binary search (B-Tree like lookup)
    this.temporalIndex.sort((a, b) => a.date - b.date);

    console.log(`[Search Optimizer] Index built in ${(performance.now() - startTime).toFixed(2)}ms for ${items.length} items.`);
  }

  /**
   * Optimized Temporal Range Query using Binary Search (Selective Scan Elimination)
   */
  public filterByDate(start: Date, end: Date): Set<string> {
    const startTime = start.getTime();
    const endTime = end.getTime();
    
    // Find start index (Binary Search)
    let left = 0;
    let right = this.temporalIndex.length - 1;
    let startIndex = this.temporalIndex.length;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (this.temporalIndex[mid].date >= startTime) {
        startIndex = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    const result = new Set<string>();
    for (let i = startIndex; i < this.temporalIndex.length; i++) {
      if (this.temporalIndex[i].date > endTime) break;
      result.add(this.temporalIndex[i].id);
    }
    return result;
  }

  /**
   * Heuristic Rule-Based Optimization (RBO) & Cardinality Selection
   */
  public search(query: string): { id: string, score: number }[] {
    const terms = query.toLowerCase().split(/[^a-z0-9]/).filter(t => t.length > 1);
    if (terms.length === 0) return [];

    // Cardinality & Selectivity Estimation:
    // Sort terms by rarity (lowest frequency first) to optimize execution plan.
    // This is a form of Cost-Based Optimization (CBO).
    const sortedTerms = terms.sort((a, b) => 
      (this.termFrequency.get(a) || 0) - (this.termFrequency.get(b) || 0)
    );

    // Initial result set from the rarest term (highest selectivity)
    let candidateIds: Set<string> | null = null;
    
    for (const term of sortedTerms) {
      const matches = this.index.get(term);
      if (!matches) {
        // If an exact term has no matches, we might want to still return other matches 
        // depending on OR vs AND logic. Here we use AND for strictness but allow partials via scoring.
        continue;
      }
      
      if (candidateIds === null) {
        candidateIds = new Set(matches);
      } else {
        // Intersection for strict matching (Rule-Based Optimization)
        const nextCandidates = new Set<string>();
        for (const id of candidateIds) {
          if (matches.has(id)) nextCandidates.add(id);
        }
        candidateIds = nextCandidates;
      }
    }

    if (!candidateIds || candidateIds.size === 0) {
      // Fallback: If no strict intersection, collect all IDs from all terms (OR logic)
      const allIds = new Map<string, number>();
      for (const term of terms) {
        const matches = this.index.get(term);
        if (matches) {
          for (const id of matches) {
            allIds.set(id, (allIds.get(id) || 0) + 1);
          }
        }
      }
      return Array.from(allIds.entries()).map(([id, count]) => ({
        id,
        score: 1 / (count + 0.1) // Higher count = better score
      }));
    }

    // Heuristic Scoring:
    // 1. Title match boost
    // 2. Exact phrase match boost
    // 3. Recency boost
    return Array.from(candidateIds).map(id => {
      const item = this.itemsMap.get(id)!;
      let score = 1.0;
      
      const queryLower = query.toLowerCase();
      if (item.title?.toLowerCase().includes(queryLower)) score *= 0.5;
      if (item.content?.toLowerCase().includes(queryLower)) score *= 0.8;
      
      // Recency boost (Cardinality/Temporal weight)
      const ageInDays = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0.7, 1 - (1 / (ageInDays + 1))); 
      score *= recencyBoost;

      return { id, score };
    });
  }
}

export const useSearch = (items: MindItem[], query: string) => {
  // Memoized Search Optimizer (Inverted Index)
  const optimizer = useMemo(() => new SearchOptimizer(items), [items]);

  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'content', weight: 1 },
        { name: 'tags', weight: 1.5 },
        { name: 'url', weight: 1.2 },
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      useExtendedSearch: true,
    });
  }, [items]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return items.map(item => ({ item, score: 0 }));
    }

    let parsedTextQuery = query;
    let dateRange: { start: Date, end: Date } | null = null;
    
    // Natural Language Date Parsing (chrono-node)
    if (query.trim().length > 0) {
      const parsedDates = chrono.parse(query);
      if (parsedDates.length > 0) {
        const result = parsedDates[0];
        let startDate = result.start.date();
        let endDate = result.end ? result.end.date() : null;
        
        if (!endDate) {
           const isRelativePast = result.text.toLowerCase().includes('last') || result.text.toLowerCase().includes('past');
           if (isRelativePast) {
               endDate = new Date();
               if (startDate > endDate) {
                   const temp = startDate;
                   startDate = endDate;
                   endDate = temp;
               }
           } else {
               endDate = new Date(startDate);
               if (result.text.toLowerCase().includes('month')) {
                  endDate.setMonth(endDate.getMonth() + 1);
                  endDate.setDate(0);
               }
               endDate.setHours(23, 59, 59, 999);
               startDate.setHours(0, 0, 0, 0);
           }
        }
        
        dateRange = { start: startDate, end: endDate };
        parsedTextQuery = query.replace(result.text, '').replace(/between|from|to|on/gi, '').trim();
      }
    }

    const queryLower = parsedTextQuery.trim().toLowerCase();

    // Heuristic Rule: Special keyword detection for status and type filters
    const specialFilters: Record<string, (item: MindItem) => boolean> = {
      'read': (i) => !!i.isRead,
      'watched': (i) => !!i.isWatched,
      'films': (i) => i.type === 'film',
      'movies': (i) => i.type === 'film',
      'albums': (i) => i.type === 'album',
      'favorites': (i) => !!i.isFavorite,
      'faved': (i) => !!i.isFavorite,
      'notes': (i) => i.type === 'note',
      'bookmarks': (i) => i.type === 'link',
      'links': (i) => i.type === 'link',
      'images': (i) => i.type === 'image',
      'photos': (i) => i.type === 'image',
      'quotes': (i) => i.type === 'quote',
      'videos': (i) => i.type === 'video',
      'music': (i) => i.type === 'music',
      'songs': (i) => i.type === 'music',
      'tweets': (i) => i.type === 'tweet',
      'articles': (i) => i.type === 'article',
      'recipes': (i) => i.type === 'recipe',
      'products': (i) => i.type === 'product',
      'shopping': (i) => i.type === 'product',
    };

    if (specialFilters[queryLower]) {
      const filtered = items.filter(specialFilters[queryLower]);
      return filtered.map(item => ({ item, score: 0 }));
    }

    // Apply Index-Based Search (Primary Optimization)
    const indexedMatches = optimizer.search(parsedTextQuery);
    
    // Fallback/Augmentation with Fuse.js for fuzzy matching
    let fuseResults = fuse.search(parsedTextQuery);
    
    // Rule-Based Merging: Prioritize index exact matches, then fuzzy
    const mergedResultsMap = new Map<string, SearchResult>();
    
    // Add indexed matches first (higher confidence)
    for (const match of indexedMatches) {
      const item = items.find(i => i.id === match.id);
      if (item) {
        mergedResultsMap.set(item.id, { item, score: match.score });
      }
    }

    // Fill in with Fuse results (lower confidence fuzzy matches)
    for (const res of fuseResults) {
      if (!mergedResultsMap.has(res.item.id)) {
        mergedResultsMap.set(res.item.id, { item: res.item, score: (res.score || 0.5) + 0.5 });
      }
    }

    let finalResults = Array.from(mergedResultsMap.values());

    // Apply Date Filter (Post-Search Filtering / Selectivity Optimization)
    if (dateRange) {
        const dateValidIds = optimizer.filterByDate(dateRange.start, dateRange.end);
        finalResults = finalResults.filter(res => dateValidIds.has(res.item.id));
    }

    // Advanced: Topic detection boost (#topic)
    const topics = queryLower.split(' ').filter(word => word.startsWith('#')).map(t => t.slice(1));
    if (topics.length > 0) {
      finalResults = finalResults.map(res => {
        const hasTopic = topics.some(topic => 
          res.item.tags?.some(tag => tag.toLowerCase() === topic.toLowerCase())
        );
        if (hasTopic) {
          return { ...res, score: res.score * 0.4 }; 
        }
        return res;
      });
    }

    // Sort by score (lower is better)
    return finalResults.sort((a, b) => a.score - b.score);
  }, [optimizer, fuse, query, items]);

  return {
    results: results.map(r => r.item),
    allResults: results,
    isSearching: query.length > 0
  };
};
