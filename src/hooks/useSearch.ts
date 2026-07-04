import { useMemo } from 'react';
import Fuse from 'fuse.js';
import * as chrono from 'chrono-node';
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

    let parsedTextQuery = query;
    let dateRange: { start: Date, end: Date } | null = null;
    
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
                   let temp = startDate;
                   startDate = endDate;
                   endDate = temp;
               }
           } else {
               endDate = new Date(startDate);
               // If the user specified a month/year without specific day, chrono might just give the 1st of that month.
               // We will just pad the end date to end of month if it mentions 'month' or 'year' and no day is specified, 
               // but a simple 24 hour padding is safer for specific days.
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

    // Special keyword detection for status and type filters
    const isReadKeyword = queryLower === 'read' || queryLower === 'read items';
    const isWatchedKeyword = queryLower === 'watched' || queryLower === 'watched items';
    const isFilmKeyword = queryLower === 'films' || queryLower === 'movies' || queryLower === 'film';
    const isAlbumKeyword = queryLower === 'albums' || queryLower === 'album';
    const isFavoriteKeyword = queryLower === 'favorites' || queryLower === 'favorite' || queryLower === 'faved';
    const isNoteKeyword = queryLower === 'notes' || queryLower === 'note';
    const isBookmarkKeyword = queryLower === 'bookmarks' || queryLower === 'bookmark' || queryLower === 'links' || queryLower === 'link';
    const isImageKeyword = queryLower === 'images' || queryLower === 'image' || queryLower === 'photos' || queryLower === 'photo';
    const isQuoteKeyword = queryLower === 'quotes' || queryLower === 'quote';
    const isVideoKeyword = queryLower === 'videos' || queryLower === 'video';
    const isMusicKeyword = queryLower === 'music' || queryLower === 'songs' || queryLower === 'song';
    const isTweetKeyword = queryLower === 'tweets' || queryLower === 'tweet' || queryLower === 'twitter';
    const isArticleKeyword = queryLower === 'articles' || queryLower === 'article';
    const isRecipeKeyword = queryLower === 'recipes' || queryLower === 'recipe';
    const isProductKeyword = queryLower === 'products' || queryLower === 'product' || queryLower === 'shopping';

    let baseItems = items;
    
    // Apply Date Filter
    if (dateRange) {
       baseItems = baseItems.filter(item => {
           const created = new Date(item.createdAt);
           return created >= dateRange!.start && created <= dateRange!.end;
       });
    }

    // Apply special keyword filters
    if (isReadKeyword) {
      baseItems = baseItems.filter(item => item.isRead);
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isWatchedKeyword) {
      baseItems = baseItems.filter(item => item.isWatched);
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isFilmKeyword) {
      baseItems = baseItems.filter(item => item.type === 'film');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isAlbumKeyword) {
      baseItems = baseItems.filter(item => item.type === 'album');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isFavoriteKeyword) {
      baseItems = baseItems.filter(item => item.isFavorite);
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isNoteKeyword) {
      baseItems = baseItems.filter(item => item.type === 'note');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isBookmarkKeyword) {
      baseItems = baseItems.filter(item => item.type === 'link');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isImageKeyword) {
      baseItems = baseItems.filter(item => item.type === 'image');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isQuoteKeyword) {
      baseItems = baseItems.filter(item => item.type === 'quote');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isVideoKeyword) {
      baseItems = baseItems.filter(item => item.type === 'video');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isMusicKeyword) {
      baseItems = baseItems.filter(item => item.type === 'music');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isTweetKeyword) {
      baseItems = baseItems.filter(item => item.type === 'tweet');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isArticleKeyword) {
      baseItems = baseItems.filter(item => item.type === 'article');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isRecipeKeyword) {
      baseItems = baseItems.filter(item => item.type === 'recipe');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    if (isProductKeyword) {
      baseItems = baseItems.filter(item => item.type === 'product');
      return baseItems.map(item => ({ item, score: 0 }));
    }

    // If query is empty after date extraction, return filtered list without fuse search
    if (queryLower.trim() === '') {
       return baseItems.map(item => ({ item, score: 0 }));
    }

    // Advanced: Link detection
    const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(queryLower.trim());
    
    // Advanced: Topic detection (simple heuristic for now)
    const topics = queryLower.split(' ').filter(word => word.startsWith('#')).map(t => t.slice(1));

    // Make sure to use the filtered baseItems in fuse search.
    // However, fuse is initialized with the original items.
    // It's better to search first on fuse, then filter by date.
    let fuseResults = fuse.search(parsedTextQuery);
    
    if (dateRange) {
        fuseResults = fuseResults.filter(res => {
           const created = new Date(res.item.createdAt);
           return created >= dateRange!.start && created <= dateRange!.end;
        });
    }

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
