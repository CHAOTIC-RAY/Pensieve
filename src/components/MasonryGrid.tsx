/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Inbox, Sparkles } from 'lucide-react';
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
  onOpenReader?: (item: MindItem) => void;
  onComposeNote?: () => void;
}

export default function MasonryGrid({ 
  items, 
  onItemClick, 
  onToggleFavorite, 
  onDeleteItem,
  onToggleTopMind,
  onUpdateChecklist,
  onOpenReader,
  onComposeNote,
}: MasonryGridProps) {
  const [columnCount, setColumnCount] = useState(3);

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

  const getColumns = () => {
    const columns: MindItem[][] = Array.from({ length: columnCount }, () => []);
    items.forEach((item, index) => {
      columns[index % columnCount].push(item);
    });
    return columns;
  };

  const columns = getColumns();

  const AddNoteCard = (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onComposeNote?.()}
      className="w-full mb-5 text-left cursor-pointer group/add"
    >
      <div className="mind-card-shell px-5 py-5 min-h-[108px] flex flex-col gap-2.5 bg-white hover:shadow-[var(--shadow-premium-hover)] transition-shadow">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#FF6B35]">
          Add New Note
        </span>
        <p className="text-[14px] text-neutral-400 font-sans group-hover/add:text-neutral-500 transition-colors">
          Start typing here...
        </p>
      </div>
    </motion.button>
  );

  if (items.length === 0) {
    return (
      <div 
        id="pensieve-empty-state"
        className="w-full max-w-7xl mx-auto px-5 md:px-8 mt-6 md:mt-10 pb-32"
      >
        <div className="flex gap-3.5 md:gap-4 justify-center">
          <div className="flex flex-col flex-1 max-w-[300px]">
            {AddNoteCard}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mind-card-shell p-6 flex flex-col items-center gap-3 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                <Inbox className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-medium text-sm text-neutral-800">Your mind is still</h3>
                <p className="text-xs text-neutral-500 leading-relaxed max-w-[220px]">
                  Save a note, color, quote, or link — it will appear here, organized for you.
                </p>
              </div>
              <div className="text-[10px] font-sans text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#FF6B35]" />
                Try a hex code or paste a URL above
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-5 md:px-8 mt-6 md:mt-10 pb-32 md:pb-24">
      <div className="flex gap-3.5 md:gap-4 justify-center">
        {columns.map((columnItems, colIdx) => (
          <div 
            key={colIdx} 
            className="flex flex-col flex-1 max-w-[300px]"
          >
            {colIdx === 0 && AddNoteCard}
            <AnimatePresence mode="popLayout">
              {columnItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
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
                    onOpenReader={onOpenReader}
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
