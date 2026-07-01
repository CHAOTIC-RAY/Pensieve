/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Inbox, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MindItem } from '../types';
import MindCard from './MindCard';

interface MasonryGridProps {
  items: MindItem[];
  onItemClick: (item: MindItem) => void;
  onToggleFavorite: (item: MindItem) => void;
  onDeleteItem: (item: MindItem) => void;
  onToggleTopMind: (item: MindItem) => void;
  onUpdateChecklist: (item: MindItem, updatedContent: string) => void;
}

export default function MasonryGrid({ 
  items, 
  onItemClick, 
  onToggleFavorite, 
  onDeleteItem,
  onToggleTopMind,
  onUpdateChecklist
}: MasonryGridProps) {
  const [columnCount, setColumnCount] = useState(3);

  // Dynamic columns count based on window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnCount(1);
      } else if (width < 1024) {
        setColumnCount(2);
      } else if (width < 1280) {
        setColumnCount(3);
      } else {
        setColumnCount(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Split items into columns
  const getColumns = () => {
    const columns: MindItem[][] = Array.from({ length: columnCount }, () => []);
    items.forEach((item, index) => {
      columns[index % columnCount].push(item);
    });
    return columns;
  };

  const columns = getColumns();

  if (items.length === 0) {
    return (
      <div 
        id="pensieve-empty-state"
        className="w-full flex flex-col items-center justify-center py-12 md:py-20 px-4 text-center max-w-md mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-transparent md:bg-card-bg md:p-6 md:rounded-3xl md:border md:border-border-subtle md:shadow-premium flex flex-col items-center gap-4.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-foreground/[0.03] flex items-center justify-center border border-border-subtle/40">
            <Inbox className="w-5 h-5 text-foreground/40" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-medium text-base text-text-heading">Your mind is perfectly still</h3>
            <p className="text-xs text-foreground/60 leading-relaxed font-sans max-w-xs">
              Every note, image, color, link, and quote you save will float here in an elegant visual flow. No folders, no manual work.
            </p>
          </div>
          <div className="text-[10px] font-mono text-foreground/50 bg-foreground/[0.02] px-2.5 py-1 rounded-md border border-border-subtle/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Try entering a hex code or pasting a URL above</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-8 mt-6 md:mt-12 pb-32 md:pb-24">
      <div className="flex gap-4 md:gap-6 justify-center">
        {columns.map((columnItems, colIdx) => (
          <div 
            key={colIdx} 
            className="flex flex-col flex-1 max-w-[340px]"
          >
            <AnimatePresence mode="popLayout">
              {columnItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-full"
                >
                  <MindCard
                    item={item}
                    onClick={() => onItemClick(item)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item);
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item);
                    }}
                    onToggleTopMind={(e) => {
                      e.stopPropagation();
                      onToggleTopMind(item);
                    }}
                    onUpdateChecklist={onUpdateChecklist}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
