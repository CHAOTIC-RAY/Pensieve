/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, X, RefreshCw, Star, Heart, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MindItem } from '../types';

interface SerendipityViewProps {
  isOpen: boolean;
  onClose: () => void;
  items: MindItem[];
  onInspectItem: (item: MindItem) => void;
  onToggleFavorite: (item: MindItem) => void;
}

const MEMORY_PROMPTS: Record<string, string[]> = {
  note: [
    'An idea you noted down a while ago...',
    'Remember this reflection?',
    'A thought you captured for safekeeping...',
    'A list or note you saved in the past:'
  ],
  quote: [
    'A quote that inspired you...',
    'Words of wisdom you wanted to live by...',
    'Remember this philosophical reflection?',
    'An echo from your private library...'
  ],
  color: [
    'A color code that caught your eye...',
    'A visual hue you wanted to remember...',
    'Remember this visual palette swatch?',
    'An aesthetic tone from your canvas...'
  ],
  link: [
    'A visual bookmark you saved...',
    'A link you wanted to return to...',
    'Remember this reference page?',
    'A corner of the web you collected...'
  ],
  article: [
    'An article you wanted to read...',
    'Remember this essay?',
    'Some knowledge you wanted to absorb...',
    'An editorial piece you saved in your mind:'
  ],
  image: [
    'A visual memory you saved...',
    'An image that captured your attention...',
    'An aesthetic shot you archived...',
    'Remember this creative image?'
  ]
};

export default function SerendipityView({ 
  isOpen, 
  onClose, 
  items, 
  onInspectItem,
  onToggleFavorite
}: SerendipityViewProps) {
  const [randomItem, setRandomItem] = useState<MindItem | null>(null);
  const [prompt, setPrompt] = useState('');

  const pickRandomMemory = () => {
    if (items.length === 0) {
      setRandomItem(null);
      return;
    }

    const index = Math.floor(Math.random() * items.length);
    const selectedItem = items[index];
    setRandomItem(selectedItem);

    // Pick a cute category-specific prompt
    const categoryPrompts = MEMORY_PROMPTS[selectedItem.type] || ['Something you saved in your mind...'];
    const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
    setPrompt(randomPrompt);
  };

  useEffect(() => {
    if (isOpen) {
      pickRandomMemory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="mymind-serendipity-overlay" className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        {/* Ambient background blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md cursor-pointer"
        />

        {/* Modal content box */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative bg-card-bg border border-border-subtle rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl flex flex-col gap-6 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle/50 pb-4">
            <div className="flex items-center gap-2 text-amber-500 font-display font-semibold text-sm">
              <Sparkles className="w-4.5 h-4.5 fill-amber-500/10" />
              <span>Serendipity Portal</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-foreground/5 text-foreground/50 hover:text-foreground transition"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Prompt Header */}
          <div className="text-center space-y-1 py-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-foreground/45 font-semibold">Memory Recall</span>
            <p className="font-display font-medium text-[15px] text-text-heading italic leading-relaxed">
              "{prompt}"
            </p>
          </div>

          {/* Surfaced Card Container */}
          <div className="flex-1 min-h-[160px] flex items-center justify-center">
            {randomItem ? (
              <div 
                onClick={() => {
                  onInspectItem(randomItem);
                  onClose();
                }}
                className="w-full bg-neutral-50/50 border border-neutral-200/60 p-5 rounded-2xl cursor-pointer hover:border-neutral-300 transition-all duration-300 relative group shadow-sm flex flex-col gap-3"
              >
                {/* Specific layouts */}
                {randomItem.type === 'color' && randomItem.colorHex && (
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl border shadow-inner shrink-0" style={{ backgroundColor: randomItem.colorHex }} />
                    <div>
                      <h4 className="font-display font-semibold text-sm text-neutral-800 leading-tight">{randomItem.title}</h4>
                      <p className="text-xs font-mono text-neutral-400 uppercase tracking-tight">{randomItem.colorHex}</p>
                    </div>
                  </div>
                )}

                {randomItem.type === 'quote' && (
                  <div className="border-l-[3px] border-amber-300 pl-4 space-y-2">
                    <p className="font-serif italic text-sm text-neutral-700 leading-relaxed">"{randomItem.content}"</p>
                    {randomItem.author && <span className="text-right block text-[10px] font-mono text-neutral-400">— {randomItem.author}</span>}
                  </div>
                )}

                {randomItem.type === 'note' && (
                  <div className="space-y-1.5">
                    <h4 className="font-display font-semibold text-sm text-neutral-800 leading-tight">{randomItem.title}</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed font-sans line-clamp-3">{randomItem.content}</p>
                  </div>
                )}

                {(randomItem.type === 'link' || randomItem.type === 'article') && (
                  <div className="flex gap-4">
                    {randomItem.imageUrl && (
                      <img src={randomItem.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-neutral-100 shrink-0" referrerPolicy="no-referrer" />
                    )}
                    <div className="space-y-1 overflow-hidden">
                      <span className="text-[9px] font-mono text-indigo-600 uppercase font-bold">{randomItem.siteName}</span>
                      <h4 className="font-display font-semibold text-sm text-neutral-800 leading-tight truncate">{randomItem.title}</h4>
                      <p className="text-xs text-neutral-400 leading-normal line-clamp-1 truncate">{randomItem.url}</p>
                    </div>
                  </div>
                )}

                {randomItem.type === 'image' && randomItem.imageUrl && (
                  <div className="flex gap-4">
                    <img src={randomItem.imageUrl} alt="" className="w-20 h-16 rounded-xl object-cover border border-neutral-100 shrink-0" referrerPolicy="no-referrer" />
                    <div className="space-y-1">
                      <h4 className="font-display font-semibold text-sm text-neutral-800 leading-tight">{randomItem.title}</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{randomItem.content}</p>
                    </div>
                  </div>
                )}

                {/* Tags preview */}
                {randomItem.tags && randomItem.tags.length > 0 && (
                  <div className="flex gap-1 pt-1.5 border-t border-border-subtle/50 mt-1 flex-wrap overflow-hidden h-6.5">
                    {randomItem.tags.slice(0, 4).map((t, idx) => (
                      <span key={idx} className="text-[9px] font-mono text-foreground/60 bg-foreground/5 px-1.5 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Inspect Link floating overlay on hover */}
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center gap-1">
                  <span className="text-[10px] font-sans font-medium text-foreground/40">Inspect</span>
                  <div className="p-1 rounded-full bg-card-bg text-foreground/70 border border-border-subtle shadow-sm">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-foreground/50 font-sans">
                No items saved in your mind yet to recall. Try saving a few things first!
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-border-subtle/50 pt-5">
            <button
              onClick={() => {
                if (randomItem) {
                  onToggleFavorite(randomItem);
                  // Optimistic update
                  setRandomItem({ ...randomItem, isFavorite: !randomItem.isFavorite });
                }
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border transition ${
                randomItem?.isFavorite 
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                  : 'bg-card-bg text-foreground/70 border border-border-subtle hover:text-foreground hover:bg-foreground/[0.02]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${randomItem?.isFavorite ? 'fill-rose-500' : ''}`} />
              <span>{randomItem?.isFavorite ? 'Favorited' : 'Pin to Favorites'}</span>
            </button>

            <button
              onClick={pickRandomMemory}
              disabled={items.length <= 1}
              className="flex items-center gap-1.5 bg-foreground hover:bg-foreground/90 disabled:opacity-40 text-background text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Surf Again</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
