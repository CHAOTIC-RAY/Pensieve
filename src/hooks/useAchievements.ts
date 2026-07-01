import { useState, useEffect, useCallback } from 'react';
import { MindItem, Achievement } from '../types';
import { ACHIEVEMENTS } from '../lib/achievements';

const STORAGE_KEY = 'pensieve_unlocked_achievements';

export function useAchievements(items: MindItem[]) {
  const [unlockedIds, setUnlockedIds] = useState<Record<string, string>>({});
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  // Load unlocked from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUnlockedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load achievements", e);
    }
  }, []);

  const unlock = useCallback((id: string) => {
    setUnlockedIds(prev => {
      if (prev[id]) return prev; // Already unlocked

      const now = new Date().toISOString();
      const updated = { ...prev, [id]: now };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        setToastQueue(q => [...q, { ...achievement, unlockedAt: now }]);
      }
      return updated;
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToastQueue(q => q.slice(1));
  }, []);

  // Evaluators
  useEffect(() => {
    if (!items || items.length === 0) return;

    // First Spark: Save 1 item
    if (items.length >= 1 && !unlockedIds['first_spark']) {
      unlock('first_spark');
    }

    // Hoarder: Save 20 items
    if (items.length >= 20 && !unlockedIds['hoarder']) {
      unlock('hoarder');
    }

    // Curator: Favorite 5 items
    const favoritesCount = items.filter(i => i.isFavorite).length;
    if (favoritesCount >= 5 && !unlockedIds['curator']) {
      unlock('curator');
    }

    // Colorful Thinker: Have at least one color swatch
    const hasColor = items.some(i => i.type === 'color');
    if (hasColor && !unlockedIds['colorful_thinker']) {
      unlock('colorful_thinker');
    }

    // Knowledge Seeker: Have 3 articles or links
    const linksCount = items.filter(i => i.type === 'link' || i.type === 'article').length;
    if (linksCount >= 3 && !unlockedIds['knowledge_seeker']) {
      unlock('knowledge_seeker');
    }

    // Deep Thinker: 5 items with AI summaries
    const aiCount = items.filter(i => i.aiSummary && i.aiSummary.length > 0).length;
    if (aiCount >= 5 && !unlockedIds['deep_thinker']) {
      unlock('deep_thinker');
    }
  }, [items, unlockedIds, unlock]);

  const triggerSerendipity = useCallback(() => {
    if (!unlockedIds['wandering_mind']) {
      unlock('wandering_mind');
    }
  }, [unlockedIds, unlock]);

  // Combine definitions with unlock status
  const allAchievements: Achievement[] = ACHIEVEMENTS.map(ach => ({
    ...ach,
    unlockedAt: unlockedIds[ach.id]
  }));

  return {
    achievements: allAchievements,
    activeToast: toastQueue.length > 0 ? toastQueue[0] : null,
    dismissToast,
    triggerSerendipity
  };
}
