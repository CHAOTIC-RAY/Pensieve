/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { 
  Heart, Trash2, ExternalLink, BookOpen, Check, 
  Copy, Quote as QuoteIcon, Palette, Eye,
  Play, Music, FileText, Twitter, Utensils, Tv, Pin,
  Film, Disc, ShoppingBag, Star, Clock, Tag,
  CheckCircle2, Volume2, Github, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MindItem, NoteStyle } from '../types';
import LogoDrawing from './LogoDrawing';

interface MindCardProps {
  item: MindItem;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleTopMind?: (e: React.MouseEvent) => void;
  onUpdateChecklist?: (item: MindItem, updatedContent: string) => void;
  onUpdateItem?: (item: MindItem) => Promise<void>;
  onOpenReader?: (item: MindItem) => void;
}

// Film genre gradient map
const GENRE_GRADIENTS: Record<string, string> = {
  'sci-fi':     'from-blue-950 via-indigo-900 to-slate-900',
  'thriller':   'from-gray-950 via-gray-900 to-zinc-800',
  'horror':     'from-red-950 via-gray-900 to-black',
  'romance':    'from-rose-900 via-pink-900 to-purple-950',
  'comedy':     'from-amber-900 via-yellow-900 to-orange-950',
  'drama':      'from-slate-900 via-neutral-900 to-stone-900',
  'action':     'from-orange-950 via-red-900 to-zinc-900',
  'animation':  'from-violet-900 via-purple-900 to-indigo-900',
  'documentary':'from-teal-950 via-emerald-900 to-slate-900',
  'default':    'from-neutral-900 via-zinc-900 to-stone-900',
};

function getFilmGradient(genres?: string[]) {
  if (!genres?.length) return GENRE_GRADIENTS['default'];
  const key = genres[0].toLowerCase().replace(/\s/g, '-');
  return GENRE_GRADIENTS[key] || GENRE_GRADIENTS['default'];
}

// Note style helper
function getNoteStyles(style?: NoteStyle): React.CSSProperties {
  const fontFamilies = {
    serif: "'Georgia', 'Times New Roman', serif",
    sans: "'Inter', 'Helvetica Neue', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
    display: "'Playfair Display', Georgia, serif",
  };
  const fontSizes = { sm: '11px', base: '13px', lg: '15px', xl: '18px' };
  return {
    fontFamily: fontFamilies[style?.fontFamily || 'sans'],
    fontSize: fontSizes[style?.fontSize || 'base'],
    color: style?.color || undefined,
    backgroundColor: style?.bgColor || undefined,
    fontWeight: style?.bold ? 700 : undefined,
    fontStyle: style?.italic ? 'italic' : undefined,
  };
}

export default function MindCard({ 
  item, 
  onClick, 
  onToggleFavorite, 
  onDelete,
  onToggleTopMind,
  onUpdateChecklist,
  onUpdateItem,
  onOpenReader,
}: MindCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);
  const [addingTag, setAddingTag] = React.useState(false);
  const [tagInput, setTagInput] = React.useState('');

  // Close context menu on outside click
  React.useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [contextMenu]);

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCopyColor = (e: React.MouseEvent, color: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.content || item.title);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setContextMenu(null);
  };

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    if (!onUpdateItem) return;
    await onUpdateItem({ ...item, isRead: !item.isRead, readAt: !item.isRead ? new Date().toISOString() : undefined });
  };

  const handleMarkWatched = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    if (!onUpdateItem) return;
    await onUpdateItem({ ...item, isWatched: !item.isWatched, watchedAt: !item.isWatched ? new Date().toISOString() : undefined });
  };

  const handleToggleReadLater = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    if (!onUpdateItem) return;
    await onUpdateItem({ ...item, readLater: !item.readLater });
  };

  const handleAddTag = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '').replace(',', '');
      if (!newTag) return;
      if (!onUpdateItem) return;
      const updatedTags = Array.from(new Set([...(item.tags || []), newTag]));
      const updatedManualTags = Array.from(new Set([...(item.manualTags || []), newTag]));
      await onUpdateItem({ ...item, tags: updatedTags, manualTags: updatedManualTags });
      setTagInput('');
      setAddingTag(false);
      setContextMenu(null);
    }
    if (e.key === 'Escape') {
      setAddingTag(false);
      setTagInput('');
      setContextMenu(null);
    }
  };

  // Check if note is a checklist
  const isChecklist = item.type === 'note' && 
    (item.content.includes('- [ ]') || item.content.includes('- [x]'));

  // Toggle checklist status
  const handleToggleCheck = (e: React.MouseEvent, index: number, currentDone: boolean) => {
    e.stopPropagation();
    if (!onUpdateChecklist) return;

    const lines = item.content.split('\n');
    let checkCounter = 0;
    const updatedLines = lines.map(line => {
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        if (checkCounter === index) {
          checkCounter++;
          return line.replace(/- \[[ xX]\]/, !currentDone ? '- [x]' : '- [ ]');
        }
        checkCounter++;
      }
      return line;
    });

    onUpdateChecklist(item, updatedLines.join('\n'));
  };

  // Render checklist helper
  const renderChecklist = () => {
    const lines = item.content.split('\n');
    let checkCounter = 0;

    return (
      <div className="space-y-1.5 pt-1">
        {lines.map((line, idx) => {
          const isTask = line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]');
          if (!isTask) {
            return line.trim() ? (
              <p key={idx} className="text-card-desc text-xs tracking-tight">{line}</p>
            ) : null;
          }

          const done = line.trim().startsWith('- [x]');
          const text = line.replace(/- \[[ xX]\]/, '').trim();
          const currentIdx = checkCounter;
          checkCounter++;

          return (
            <div 
              key={idx} 
              className="flex items-start gap-2 group/task cursor-pointer"
              onClick={(e) => handleToggleCheck(e, currentIdx, done)}
            >
              <button 
                type="button"
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  done 
                    ? 'bg-primary border-primary text-white' 
                    : 'border-card-border hover:border-primary bg-card-bg'
                }`}
              >
                {done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </button>
              <span className={`text-xs tracking-tight transition-all leading-tight ${
                done ? 'line-through text-foreground/40 font-normal' : 'text-card-title font-medium'
              }`}>
                {text}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Shimmer state removed - actual card is now rendered with a beautiful drawing-logo overlay instead of being hidden

  const canMarkRead = item.type === 'article' || item.type === 'document';
  const canMarkWatched = item.type === 'film' || item.type === 'video';

  return (
    <>
      <motion.div
        id={`mind-card-${item.id}`}
        onClick={onClick}
        onContextMenu={handleRightClick}
        className={`group relative break-inside-avoid w-full cursor-pointer transition-all duration-500 flex flex-col text-foreground ${
          item.type === 'color' ? 'mb-4' : 'mb-6'
        }`}
        whileHover={{ y: item.type === 'color' ? -2 : -4 }}
      >
        {/* Animated glow effects visible on hover, matching key tags/colors */}
        <div className="absolute -inset-[3px] bg-gradient-to-r from-primary via-[#a855f7] to-[#8b5cf6] rounded-[26px] opacity-0 group-hover:opacity-75 transition-all duration-500 blur-[8px] z-0 animate-gradient pointer-events-none" />
        <div className="absolute -inset-[6px] bg-gradient-to-r from-primary via-[#a855f7] to-[#8b5cf6] rounded-[28px] opacity-0 group-hover:opacity-40 transition-all duration-500 blur-[18px] z-0 animate-gradient pointer-events-none" />
        
        {/* Actual Card Body with overflow-hidden */}
        <div 
          style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
          className="w-full h-full bg-card-bg border border-card-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-foreground/20 transition-all duration-300 flex flex-col text-foreground z-10 relative isolation-isolate"
        >
        {/* Top action rail - only visible on hover */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 z-20">
          {(item.type === 'article' || item.type === 'link') && onUpdateItem && (
            <button
              onClick={handleToggleReadLater}
              title={item.readLater ? 'Remove from Read Later' : 'Read Later'}
              className={`p-1.5 rounded-full backdrop-blur-md border shadow-sm hover:scale-105 transition cursor-pointer ${
                item.readLater 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                  : 'bg-card-bg/90 text-foreground/50 hover:text-amber-500 border-border-subtle hover:bg-card-bg'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${item.readLater ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
          )}
          {onToggleTopMind && (
            <button
              onClick={(e) => { e?.stopPropagation(); onToggleTopMind(e); }}
              title={item.isTopMind ? 'Remove from Top of Mind' : 'Set as Top of Mind'}
              className={`p-1.5 rounded-full backdrop-blur-md border shadow-sm hover:scale-105 transition cursor-pointer ${
                item.isTopMind 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                  : 'bg-card-bg/90 text-foreground/50 hover:text-amber-500 border-border-subtle hover:bg-card-bg'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${item.isTopMind ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
          )}
          <button
            onClick={(e) => { e?.stopPropagation(); onToggleFavorite(e); }}
            title={item.isFavorite ? 'Remove favorite' : 'Add to favorites'}
            className={`p-1.5 rounded-full backdrop-blur-md border shadow-sm hover:scale-105 transition cursor-pointer ${
              item.isFavorite 
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                : 'bg-card-bg/90 text-foreground/50 hover:text-rose-500 border-border-subtle hover:bg-card-bg'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-rose-500' : ''}`} />
          </button>
          <button
            onClick={(e) => { e?.stopPropagation(); onDelete(e); }}
            title="Delete item"
            className="p-1.5 rounded-full bg-card-bg/90 text-foreground/50 hover:text-red-500 border border-border-subtle shadow-sm hover:scale-105 transition cursor-pointer hover:bg-card-bg"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CARD CONTENT TYPES */}

        {/* 1. COLOR SWATCH — compact mymind-style card */}
        {item.type === 'color' && (item.colorHex || item.colorPalette) && (
          <div className="flex flex-col w-full">
            {item.colorPalette && item.colorPalette.length > 0 ? (
              <div className="w-full h-12 flex overflow-hidden relative group/palette">
                {item.colorPalette.map((colHex, index) => (
                  <div 
                    key={index}
                    className="flex-1 h-full hover:flex-[1.6] transition-all duration-300 relative cursor-pointer group/swatch"
                    style={{ backgroundColor: colHex }}
                    onClick={(e) => handleCopyColor(e, colHex)}
                    title={`Click to copy hex ${colHex}`}
                  >
                    <div className="absolute inset-0 bg-black/15 opacity-0 group-hover/swatch:opacity-100 flex items-center justify-center transition-opacity text-[9px] font-mono text-white select-none font-bold">
                      Copy
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="w-full h-12 relative flex items-center justify-end px-2.5"
                style={{ backgroundColor: item.colorHex }}
              >
                <button
                  onClick={(e) => handleCopyColor(e, item.colorHex || '')}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-black/35 text-white backdrop-blur-md hover:bg-black/55 transition flex items-center gap-1 text-[9px] font-mono font-medium"
                >
                  {copied ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
            <div className="px-3 py-2.5 flex flex-col gap-0.5 bg-card-bg">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-card-title tracking-tight uppercase truncate">
                  {item.colorPalette
                    ? item.colorPalette.slice(0, 2).join(' · ') + (item.colorPalette.length > 2 ? '…' : '')
                    : (item.colorHex || '').toUpperCase()}
                </span>
                <span className="text-[9px] font-sans font-medium text-card-desc flex items-center gap-1 shrink-0 opacity-70">
                  <Palette className="w-2.5 h-2.5" />
                  {item.colorPalette ? 'Palette' : 'Color'}
                </span>
              </div>
              {item.title && item.title.toLowerCase() !== 'color swatch' && item.title.toLowerCase() !== (item.colorHex || '').toLowerCase() && (
                <h3 className="font-display font-medium text-xs text-card-title/80 line-clamp-1 leading-snug">
                  {item.title}
                </h3>
              )}
            </div>
          </div>
        )}

        {/* 2. QUOTE */}
        {item.type === 'quote' && (
          <div className="p-6 flex flex-col gap-4 bg-[#121212] text-white min-h-[140px] justify-center items-center text-center">
            <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1 font-bold">Quote</span>
            <blockquote className="font-serif italic text-base text-white leading-snug">
              "{item.content}"
            </blockquote>
            {item.author && (
              <div className="text-[11px] font-mono text-white/50">
                — {item.author}
              </div>
            )}
          </div>
        )}

        {/* 3. NOTES & CHECKLISTS — with custom noteStyle */}
        {item.type === 'note' && (
          <div 
            className="flex flex-col h-full transition-colors duration-300"
            style={{
              backgroundColor: item.noteStyle?.bgColor || '#FEEBC8',
              color: item.noteStyle?.color || '#121212',
            }}
          >
            {/* Fallback image if categorized as note but has an image URL */}
            {item.imageUrl && (
              <div className="w-full h-32 overflow-hidden bg-black/5 border-b border-black/5 relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" 
                />
              </div>
            )}
            <div className="p-6 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">
                  {isChecklist ? 'List' : 'Note'}
                </span>
                <span className="text-[10px] font-mono opacity-40">
                  {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h3 
                className="font-semibold tracking-tight leading-snug"
                style={getNoteStyles({ ...item.noteStyle, fontSize: 'base', bold: true })}
              >
                {item.title}
              </h3>

              <div className="text-sm font-sans leading-relaxed break-words opacity-75" style={getNoteStyles(item.noteStyle)}>
                {isChecklist ? renderChecklist() : (
                  <p className="line-clamp-6 whitespace-pre-wrap">{item.content}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. VISUAL WEBPAGE BOOKMARK */}
        {item.type === 'link' && (
          <div className="flex flex-col w-full">
            {item.imageUrl ? (
              <div className="w-full max-h-48 overflow-hidden bg-card-footer border-b border-card-border relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-[10px] font-mono backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-sm">
                  {item.favicon && <img src={item.favicon} alt="" className="w-3 h-3 rounded-sm object-contain" referrerPolicy="no-referrer" />}
                  <span className="font-medium">{item.siteName || 'Bookmark'}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-card-footer border-b border-card-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.favicon && <img src={item.favicon} alt="" className="w-4 h-4 rounded-sm object-contain" referrerPolicy="no-referrer" />}
                  <span className="text-[10px] font-mono font-semibold text-card-desc uppercase">{item.siteName || 'Bookmark'}</span>
                </div>
                <span className="text-[10px] font-sans font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ExternalLink className="w-2.5 h-2.5" /> Link
                </span>
              </div>
            )}

            <div className="p-4 flex flex-col gap-1.5 bg-card-bg">
              <h3 className="font-display font-medium text-sm text-card-title line-clamp-2 leading-snug tracking-tight hover:text-card-title/90">
                {item.title}
              </h3>
              {item.content && (
                <p className="text-[11px] text-card-desc leading-relaxed font-sans line-clamp-2">
                  {item.content}
                </p>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-card-border mt-1">
                <span className="text-[10px] font-mono text-card-desc max-w-[60%] truncate opacity-80">
                  {item.url}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenReader?.(item);
                    }}
                    className="p-1.5 rounded-md text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10 transition flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                    title="Open in Reader Mode"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read</span>
                  </button>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-md text-card-desc hover:text-card-title hover:bg-card-footer transition cursor-pointer"
                    title="Open page in a new tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. DISTRACTION-FREE READABLE ARTICLE */}
        {item.type === 'article' && (
          <div className="flex flex-col w-full border-l-[3px] border-indigo-300/60 rounded-r-2xl">
            {/* Read badge */}
            {item.isRead && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" /> Read
              </div>
            )}
            {item.imageUrl ? (
              <div className="w-full h-32 overflow-hidden bg-neutral-50 border-b border-neutral-100 relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-indigo-600 text-white text-[9px] font-sans font-bold uppercase tracking-wider backdrop-blur-md px-2 py-0.5 rounded-md border border-indigo-400/30">
                  <BookOpen className="w-2.5 h-2.5" />
                  Reader Mode
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-[10px] font-mono backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-sm">
                  {item.favicon && <img src={item.favicon} alt="" className="w-3 h-3 rounded-sm object-contain" referrerPolicy="no-referrer" />}
                  <span className="font-medium">{item.siteName}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-card-footer border-b border-card-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.favicon && <img src={item.favicon} alt="" className="w-4 h-4 rounded-sm object-contain" referrerPolicy="no-referrer" />}
                  <span className="text-[10px] font-mono font-semibold text-card-desc uppercase">{item.siteName}</span>
                </div>
                <span className="text-[10px] font-sans font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <BookOpen className="w-2.5 h-2.5" /> Reader Mode
                </span>
              </div>
            )}

            <div className="p-4 flex flex-col gap-1.5 bg-card-bg">
              <h3 className="font-display font-medium text-sm text-card-title line-clamp-2 leading-snug tracking-tight">
                {item.title}
              </h3>
              {item.content && (
                <p className="text-[11px] text-card-desc leading-relaxed font-sans line-clamp-2">
                  {item.content}
                </p>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-card-border mt-1 text-[10px] font-mono">
                <span className="text-card-desc max-w-[50%] truncate opacity-80">
                  {item.url}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenReader?.(item);
                    }}
                    className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                    title="Open in Reader Mode"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Read</span>
                  </button>
                  {item.readingTime && (
                    <span className="text-indigo-400 font-semibold shrink-0">
                      {item.readingTime} min read
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. UPLOADED IMAGE */}
        {item.type === 'image' && item.imageUrl && (
          <div className="flex flex-col w-full relative">
            <div className="w-full overflow-hidden bg-card-footer relative">
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full object-cover max-h-[360px] transition-transform duration-500 group-hover:scale-102"
                loading="lazy"
              />
            </div>
            <div className="p-4 flex flex-col gap-1.5 bg-card-bg border-t border-card-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-card-desc">
                  {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[10px] font-sans font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Eye className="w-2.5 h-2.5" /> Image
                </span>
              </div>
              <h3 className="font-display font-medium text-sm text-card-title line-clamp-1 leading-snug">
                {item.title}
              </h3>
              <p className="text-[11px] text-card-desc font-sans leading-relaxed line-clamp-2">
                {item.content}
              </p>
            </div>
          </div>
        )}

        {/* 7. VIDEO BOOKMARK */}
        {item.type === 'video' && (
          <div className="flex flex-col w-full">
            {item.imageUrl ? (
              <div className="w-full h-44 overflow-hidden bg-neutral-950 relative group/video">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover opacity-85 transition-transform duration-500 group-hover/video:scale-102 group-hover/video:opacity-75"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg group-hover/video:scale-110 transition duration-300">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                </div>
                {item.duration && (
                  <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[9px] font-mono font-medium px-2 py-0.5 rounded backdrop-blur-sm">
                    {item.duration}
                  </div>
                )}
                {item.isWatched && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /> Watched
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-[10px] font-mono backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-sm">
                  <Tv className="w-3 h-3 text-red-400" />
                  <span className="font-medium">{item.siteName || 'Video'}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-card-footer border-b border-card-border flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-card-desc uppercase flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-foreground/40" /> {item.siteName || 'Video'}
                </span>
                <span className="text-[10px] font-sans font-medium text-red-600 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-red-600" /> Video
                </span>
              </div>
            )}
            <div className="p-4 flex flex-col gap-1.5 bg-card-bg">
              <h3 className="font-display font-medium text-sm text-card-title line-clamp-2 leading-snug tracking-tight">
                {item.title}
              </h3>
              {item.content && (
                <p className="text-[11px] text-card-desc leading-relaxed font-sans line-clamp-2">
                  {item.content}
                </p>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-card-border/50 mt-1">
                <span className="text-[10px] font-mono text-foreground/45 max-w-[75%] truncate">
                  {item.url || 'External Video'}
                </span>
                {item.url && (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-md text-foreground/45 hover:text-red-500 hover:bg-foreground/5 transition"
                    title="Watch Video"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. MUSIC BOOKMARK */}
        {item.type === 'music' && (
          <div className="flex flex-col w-full bg-[#121212] text-white rounded-3xl overflow-hidden p-5 gap-3.5 relative">
            <div className="flex items-center gap-3.5">
              {item.imageUrl ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-800 relative group/music flex-shrink-0 shadow-md">
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/music:opacity-100 flex items-center justify-center transition duration-200">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 border border-green-500/20 shadow-md">
                  <Music className="w-6 h-6 text-green-400" />
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[9px] uppercase tracking-widest text-green-400 font-bold mb-0.5">Song / Audio</span>
                <h3 className="font-sans font-semibold text-xs text-white truncate pr-2">
                  {item.title}
                </h3>
                {item.author && (
                  <span className="text-[10px] text-white/60 font-medium truncate">
                    {item.author}
                  </span>
                )}
              </div>
            </div>
            {item.content && (
              <p className="text-[11px] text-white/50 leading-relaxed font-sans line-clamp-2 border-t border-white/5 pt-2">
                {item.content}
              </p>
            )}
            <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-1">
              <span className="truncate max-w-[80%]">{item.siteName || 'Audio'}</span>
              {item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-green-400 hover:text-green-300 flex items-center gap-1 font-sans font-semibold"
                >
                  <span>Listen</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* 9. TWEET BOOKMARK */}
        {item.type === 'tweet' && (
          <div className="p-5 flex flex-col gap-3 bg-[#F7F9F9] text-[#0F1419] border border-[#EFF3F4] rounded-3xl w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-neutral-200 border border-black/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.authorAvatar ? (
                    <img src={item.authorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Twitter className="w-4 h-4 text-[#1D9BF0] fill-[#1D9BF0]" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-[#0F1419] truncate leading-tight">
                    {item.author || 'Social Post'}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono truncate leading-none mt-0.5">
                    {item.authorUsername || '@pensieve'}
                  </span>
                </div>
              </div>
              <Twitter className="w-4 h-4 text-[#1D9BF0] fill-[#1D9BF0] flex-shrink-0" />
            </div>
            <p className="text-xs leading-relaxed font-sans font-medium whitespace-pre-wrap break-words">
              {item.content}
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1.5 border-t border-neutral-100">
              <span>{item.siteName || 'Twitter'}</span>
              {item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#1D9BF0] hover:underline"
                >
                  View original
                </a>
              )}
            </div>
          </div>
        )}

        {/* 10. RECIPE SWATCH */}
        {item.type === 'recipe' && (
          <div className="p-5 flex flex-col gap-3.5 bg-[#FFFDF5] text-[#2C2114] border border-[#F3EFE0] rounded-3xl w-full">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest text-[#B28A54] font-bold flex items-center gap-1 bg-[#F9F4E3] border border-[#ECE4CE] px-2 py-0.5 rounded-md">
                <Utensils className="w-2.5 h-2.5 text-[#B28A54]" /> Recipe
              </span>
              {item.duration && (
                <span className="text-[10px] font-mono font-bold text-[#B28A54]/80">
                  {item.duration}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-display font-semibold text-sm text-[#2C2114] leading-snug tracking-tight">
                {item.title}
              </h3>
              {item.author && <span className="text-[10px] text-[#B28A54] font-medium">By {item.author}</span>}
            </div>
            
            {item.ingredients && item.ingredients.length > 0 && (
              <div className="flex flex-col gap-1 border-t border-[#F2EDE0] pt-2">
                <span className="text-[10px] font-mono text-[#B28A54]/70 font-semibold">Ingredients ({item.ingredients.length})</span>
                <ul className="text-[11px] text-neutral-600 list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto no-scrollbar">
                  {item.ingredients.slice(0, 4).map((ing, idx) => (
                    <li key={idx} className="truncate">{ing}</li>
                  ))}
                  {item.ingredients.length > 4 && (
                    <li className="text-[10px] text-[#B28A54] font-bold list-none italic mt-0.5">
                      +{item.ingredients.length - 4} more ingredients
                    </li>
                  )}
                </ul>
              </div>
            )}
            {!item.ingredients && item.content && (
              <p className="text-xs text-neutral-600 leading-relaxed line-clamp-4 font-serif">
                {item.content}
              </p>
            )}
            <div className="flex items-center justify-between text-[10px] font-mono text-[#B28A54]/50 pt-1.5 border-t border-[#F2EDE0]">
              <span>{item.siteName || 'Cooking'}</span>
              {item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#B28A54] hover:underline font-bold"
                >
                  Cook mode
                </a>
              )}
            </div>
          </div>
        )}

        {/* 11. DOCUMENT BOOKMARK */}
        {item.type === 'document' && (
          <div className="p-5 flex flex-col gap-3.5 bg-[#F4F7FB] text-[#1E293B] border border-[#E2E8F0] rounded-3xl w-full">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest text-blue-600 font-bold flex items-center gap-1 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                <FileText className="w-2.5 h-2.5 text-blue-500" /> Document
              </span>
              {item.fileSize && (
                <span className="text-[10px] font-mono text-neutral-400 font-medium">
                  {item.fileSize}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-display font-semibold text-sm text-[#1E293B] line-clamp-2 leading-snug tracking-tight">
                {item.title}
              </h3>
              {item.pageCount !== undefined && (
                <span className="text-[10px] font-mono font-semibold text-blue-500/80">
                  {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                </span>
              )}
            </div>
            {item.content && (
              <p className="text-[11px] text-neutral-500 leading-relaxed font-sans line-clamp-2 border-t border-neutral-100 pt-2">
                {item.content}
              </p>
            )}
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1.5 border-t border-neutral-100">
              <span>{item.siteName || 'PDF Document'}</span>
              {item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-sans font-semibold"
                >
                  <span>Read PDF</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* 12. VOICE NOTE */}
        {item.type === 'voice' && (
          <div className="p-5 flex flex-col gap-3.5 bg-gradient-to-tr from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 rounded-3xl w-full">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest text-amber-600 font-bold flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                <Volume2 className="w-2.5 h-2.5 text-amber-500" /> Voice Note
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-display font-semibold text-sm text-foreground line-clamp-1 leading-snug tracking-tight">
                {item.title}
              </h3>
              {item.audioUrl && (
                <audio 
                  src={item.audioUrl} 
                  controls 
                  onClick={(e) => e.stopPropagation()} 
                  className="w-full h-8 outline-none mt-2" 
                />
              )}
            </div>
          </div>
        )}

        {/* 13. FILM CARD — poster-forward with cinematic design */}
        {item.type === 'film' && (
          <div className={`relative flex flex-col w-full overflow-hidden min-h-[280px] bg-gradient-to-b ${getFilmGradient(item.genre)}`}>
            {/* Poster or gradient bg */}
            {item.moviePoster ? (
              <div className="absolute inset-0">
                <img 
                  src={item.moviePoster} 
                  alt={item.title} 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <Film className="w-24 h-24 text-white" />
              </div>
            )}

            {/* Watched badge */}
            {item.isWatched && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-emerald-500/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-400/30">
                <CheckCircle2 className="w-3 h-3" /> Watched
              </div>
            )}

            {/* Film icon badge */}
            <div className="absolute top-3 left-3 z-10">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Content overlay at bottom */}
            <div className="relative mt-auto p-5 z-10">
              {/* Genre chips */}
              {item.genre && item.genre.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.genre.slice(0, 3).map((g, i) => (
                    <span key={i} className="text-[9px] font-bold uppercase tracking-wider text-white/60 bg-white/10 border border-white/15 px-1.5 py-0.5 rounded-md">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <h3 className="font-display font-bold text-lg text-white leading-tight tracking-tight line-clamp-2 mb-1">
                {item.title}
              </h3>

              {/* Meta row */}
              <div className="flex items-center gap-3 text-[10px] font-mono text-white/50 mt-2">
                {item.releaseYear && <span>{item.releaseYear}</span>}
                {item.runtime && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" /> {item.runtime}
                  </span>
                )}
                {item.rating && (
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.rating}
                  </span>
                )}
              </div>

              {item.director && (
                <p className="text-[10px] text-white/40 mt-1 font-sans">Dir. {item.director}</p>
              )}
            </div>
          </div>
        )}

        {/* 14. ALBUM CARD */}
        {item.type === 'album' && (
          <div className="flex flex-col w-full bg-[#0D0D0D] text-white rounded-3xl overflow-hidden relative">
            {/* Album art */}
            <div className="w-full aspect-square relative overflow-hidden">
              {item.albumArtUrl ? (
                <>
                  <img 
                    src={item.albumArtUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-950 flex items-center justify-center">
                  <Disc className="w-16 h-16 text-white/20 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
              )}
              <div className="absolute bottom-3 left-3 right-3 z-10">
                <h3 className="font-display font-bold text-base text-white leading-tight line-clamp-1">{item.title}</h3>
                {item.author && <p className="text-[11px] text-white/60 font-medium mt-0.5">{item.author}</p>}
              </div>
            </div>

            {/* Album meta */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-purple-400">Album</span>
                {item.albumYear && <span className="text-[9px] font-mono text-white/30">· {item.albumYear}</span>}
              </div>
              {item.trackCount && (
                <span className="text-[10px] font-mono text-white/40">{item.trackCount} tracks</span>
              )}
            </div>
          </div>
        )}

        {/* 15. PRODUCT CARD */}
        {item.type === 'product' && (
          <div className="flex flex-col w-full bg-card-bg rounded-3xl overflow-hidden">
            {/* Product image */}
            {(item.productImageUrl || item.imageUrl) && (
              <div className="w-full h-48 bg-neutral-50 border-b border-card-border overflow-hidden relative">
                <img 
                  src={item.productImageUrl || item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}

            <div className="p-4 flex flex-col gap-2.5">
              {/* Brand + type */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-card-desc flex items-center gap-1">
                  <ShoppingBag className="w-2.5 h-2.5" /> {item.brand || 'Product'}
                </span>
                {item.price && (
                  <span className="text-sm font-bold text-foreground font-mono">
                    {item.currency || '$'}{item.price}
                  </span>
                )}
              </div>

              <h3 className="font-display font-semibold text-sm text-card-title leading-snug tracking-tight line-clamp-2">
                {item.title}
              </h3>

              {item.materials && (
                <p className="text-[10px] text-card-desc font-sans line-clamp-1">
                  {item.materials}
                </p>
              )}

              {item.content && (
                <p className="text-[11px] text-card-desc leading-relaxed font-sans line-clamp-2 border-t border-card-border pt-2">
                  {item.content}
                </p>
              )}

              {item.buyUrl && (
                <a
                  href={item.buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition"
                >
                  Buy Now <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Bottom info: Tags footer */}
        {item.tags && item.tags.length > 0 && (
          <div className={`flex items-center gap-1 flex-wrap overflow-hidden border-t border-card-border bg-foreground/[0.02] group-hover:bg-transparent ${
            item.type === 'color' ? 'px-3 pb-2 pt-1 min-h-0' : 'px-4 pb-3 pt-1 min-h-[28px]'
          }`}>
            {item.tags.slice(0, item.type === 'color' ? 2 : 3).map((tag, idx) => {
              const isAiTag = item.aiTags?.includes(tag);
              return (
                <span 
                  key={idx} 
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md border transition flex items-center gap-0.5 ${
                    isAiTag 
                      ? 'text-indigo-400 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/20 shadow-sm' 
                      : 'text-foreground/70 bg-foreground/[0.05] hover:bg-foreground/[0.08] border-card-border/60 hover:border-card-border shadow-sm'
                  }`}
                >
                  {isAiTag && <Sparkles className="w-2.5 h-2.5 opacity-70" />}
                  #{tag}
                </span>
              );
            })}
            {item.tags.length > 3 && (
              <span className="text-[9px] font-mono text-foreground/50 font-bold ml-0.5">
                +{item.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {item.analyzing && (
          <div 
            className="absolute inset-0 bg-card-bg/75 backdrop-blur-[2.5px] flex flex-col items-center justify-center gap-3 z-20 pointer-events-auto cursor-wait"
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick();
            }}
          >
            <LogoDrawing className="w-11 h-11" color="text-primary" />
            <div className="text-center px-4">
              <span className="text-[10px] font-mono font-bold text-foreground/85 uppercase tracking-widest animate-pulse block">
                AI is organizing...
              </span>
              <span className="text-[9px] text-neutral-400 font-sans mt-1">Click to open anyway</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>

      {/* RIGHT-CLICK CONTEXT MENU */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[999] bg-white/95 backdrop-blur-xl border border-black/8 rounded-2xl shadow-2xl overflow-hidden py-1.5 min-w-[180px]"
            style={{ top: Math.min(contextMenu.y, window.innerHeight - 260), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Add Tag */}
            {addingTag ? (
              <div className="px-3 py-2">
                <input
                  autoFocus
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="tag, press Enter"
                  className="w-full text-xs bg-neutral-100 border border-neutral-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary"
                />
                <p className="text-[9px] text-neutral-400 mt-1">Press Enter or comma to add</p>
              </div>
            ) : (
              <button
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                onClick={(e) => { e.stopPropagation(); setAddingTag(true); }}
              >
                <Tag className="w-3.5 h-3.5 text-neutral-400" /> Add Tag
              </button>
            )}

            {/* Copy to Clipboard (text-based only) */}
            {(item.type === 'note' || item.type === 'quote' || item.type === 'article') && (
              <button
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                onClick={handleCopyText}
              >
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            )}

             {/* Toggle Read Later */}
            {(item.type === 'article' || item.type === 'link') && (
              <>
                <button
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-indigo-600 hover:bg-indigo-50/50 flex items-center gap-2.5 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu(null);
                    onOpenReader?.(item);
                  }}
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Open Reader Mode</span>
                </button>
                <button
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                  onClick={handleToggleReadLater}
                >
                  <Clock className={`w-3.5 h-3.5 ${item.readLater ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
                  {item.readLater ? 'Remove from Read Later' : 'Read Later'}
                </button>
              </>
            )}

            {/* Mark as Read */}
            {canMarkRead && (
              <button
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                onClick={handleMarkRead}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${item.isRead ? 'text-emerald-500' : 'text-neutral-400'}`} />
                {item.isRead ? 'Mark as Unread' : 'Mark as Read'}
              </button>
            )}

            {/* Mark as Watched */}
            {canMarkWatched && (
              <button
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                onClick={handleMarkWatched}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${item.isWatched ? 'text-emerald-500' : 'text-neutral-400'}`} />
                {item.isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
              </button>
            )}

            {/* Toggle Favorite */}
            <button
              className="w-full px-4 py-2.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
              onClick={(e) => { onToggleFavorite(e); setContextMenu(null); }}
            >
              <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-neutral-400'}`} />
              {item.isFavorite ? 'Unfavorite' : 'Add to Favorites'}
            </button>

            <div className="h-px bg-neutral-100 my-1" />

            {/* Delete */}
            <button
              className="w-full px-4 py-2.5 text-left text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
              onClick={(e) => { onDelete(e); setContextMenu(null); }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
