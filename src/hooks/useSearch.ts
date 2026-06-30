import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { MindItem } from '../types';

export interface SearchResult {
  item: MindItem;
  score: number;
  matches?: any[];
}

export const useSearch = (items: MindItem[], query: string) => {
  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'content', weight: 1 },
        { name: 'tags', weight: 1.5 },
        { name: 'url', weight: 1.2 },
        { name: 'quote', weight: 1 },
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

    // Advanced: Link detection
    const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(query.trim());
    
    // Advanced: Topic detection (simple heuristic for now)
    const topics = query.split(' ').filter(word => word.startsWith('#')).map(t => t.slice(1));

    let fuseResults = fuse.search(query);

    // Boost results that match topics exactly if detected
    if (topics.length > 0) {
      fuseResults = fuseResults.map(res => {
        const hasTopic = topics.some(topic => 
          res.item.tags?.some(tag => tag.toLowerCase() === topic.toLowerCase())
        );
        if (hasTopic) {
          return { ...res, score: (res.score || 0) * 0.5 }; // Lower score is better in Fuse
        }
        return res;
      });
    }

    // Sort by score (ascending, 0 is perfect match)
    return fuseResults.sort((a, b) => (a.score || 0) - (b.score || 0));
  }, [fuse, query, items]);

  return {
    results: results.map(r => r.item),
    allResults: results,
    isSearching: query.length > 0
  };
};
