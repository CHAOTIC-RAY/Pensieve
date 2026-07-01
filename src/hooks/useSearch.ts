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

    const queryLower = query.trim().toLowerCase();

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

    // Apply special keyword filters
    if (isReadKeyword) {
      const readItems = items.filter(item => item.isRead);
      return readItems.map(item => ({ item, score: 0 }));
    }

    if (isWatchedKeyword) {
      const watchedItems = items.filter(item => item.isWatched);
      return watchedItems.map(item => ({ item, score: 0 }));
    }

    if (isFilmKeyword) {
      const filmItems = items.filter(item => item.type === 'film');
      return filmItems.map(item => ({ item, score: 0 }));
    }

    if (isAlbumKeyword) {
      const albumItems = items.filter(item => item.type === 'album');
      return albumItems.map(item => ({ item, score: 0 }));
    }

    if (isFavoriteKeyword) {
      const favItems = items.filter(item => item.isFavorite);
      return favItems.map(item => ({ item, score: 0 }));
    }

    if (isNoteKeyword) {
      const noteItems = items.filter(item => item.type === 'note');
      return noteItems.map(item => ({ item, score: 0 }));
    }

    if (isBookmarkKeyword) {
      const bookmarkItems = items.filter(item => item.type === 'link');
      return bookmarkItems.map(item => ({ item, score: 0 }));
    }

    if (isImageKeyword) {
      const imgItems = items.filter(item => item.type === 'image');
      return imgItems.map(item => ({ item, score: 0 }));
    }

    if (isQuoteKeyword) {
      const quoteItems = items.filter(item => item.type === 'quote');
      return quoteItems.map(item => ({ item, score: 0 }));
    }

    if (isVideoKeyword) {
      const videoItems = items.filter(item => item.type === 'video');
      return videoItems.map(item => ({ item, score: 0 }));
    }

    if (isMusicKeyword) {
      const musicItems = items.filter(item => item.type === 'music');
      return musicItems.map(item => ({ item, score: 0 }));
    }

    if (isTweetKeyword) {
      const tweetItems = items.filter(item => item.type === 'tweet');
      return tweetItems.map(item => ({ item, score: 0 }));
    }

    if (isArticleKeyword) {
      const articleItems = items.filter(item => item.type === 'article');
      return articleItems.map(item => ({ item, score: 0 }));
    }

    if (isRecipeKeyword) {
      const recipeItems = items.filter(item => item.type === 'recipe');
      return recipeItems.map(item => ({ item, score: 0 }));
    }

    if (isProductKeyword) {
      const productItems = items.filter(item => item.type === 'product');
      return productItems.map(item => ({ item, score: 0 }));
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
