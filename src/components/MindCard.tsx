/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Heart, Trash2, ExternalLink, BookOpen, Check, 
  Copy, ClipboardList, Quote as QuoteIcon, Palette, Eye,
  Play, Music, FileText, Twitter, Utensils, Tv, Pin
} from 'lucide-react';
import { motion } from 'motion/react';
import { MindItem } from '../types';

interface MindCardProps {
  item: MindItem;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleTopMind?: (e: React.MouseEvent) => void;
  onUpdateChecklist?: (item: MindItem, updatedContent: string) => void;
}

export default function MindCard({ 
  item, 
  onClick, 
  onToggleFavorite, 
  onDelete,
  onToggleTopMind,
  onUpdateChecklist
}: MindCardProps) {
  const [copied, setCopied] = React.useState(false);

  // Helper to copy text/colors to clipboard
  const handleCopyColor = (e: React.MouseEvent, color: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // Shimmer state (Gemini thinking background)
  if (item.analyzing) {
    return (
      <div 
        id={`card-analyzing-${item.id}`}
        className="break-inside-avoid mb-6 w-full bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden h-[180px]"
      >
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded shimmer-bg" />
          <div className="h-4 w-4 rounded-full shimmer-bg" />
        </div>
        <div className="h-14 w-full rounded-lg shimmer-bg" />
        <div className="flex items-center gap-2 mt-auto">
          <div className="h-6 w-14 rounded-full shimmer-bg" />
          <div className="h-6 w-16 rounded-full shimmer-bg" />
          <div className="h-6 w-12 rounded-full shimmer-bg" />
        </div>
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center gap-2">
          <span className="text-xs font-mono font-medium text-foreground/60 flex items-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5 text-foreground/60" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            AI is organizing...
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      id={`mind-card-${item.id}`}
      layoutId={`card-container-${item.id}`}
      onClick={onClick}
      className="group relative break-inside-avoid mb-6 w-full bg-card-bg border border-card-border rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:border-foreground/20 transition-all duration-300 flex flex-col text-foreground"
      whileHover={{ y: -4 }}
    >
      {/* Top action rail - only visible on hover */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 z-10">
        {onToggleTopMind && (
          <button
            onClick={onToggleTopMind}
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
          onClick={onToggleFavorite}
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
          onClick={onDelete}
          title="Delete item"
          className="p-1.5 rounded-full bg-card-bg/90 text-foreground/50 hover:text-red-500 border border-border-subtle shadow-sm hover:scale-105 transition cursor-pointer hover:bg-card-bg"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* CARD CONTENT TYPES */}

      {/* 1. COLOR SWATCH */}
      {item.type === 'color' && (item.colorHex || item.colorPalette) && (
        <div className="flex flex-col w-full">
          {item.colorPalette && item.colorPalette.length > 0 ? (
            <div className="w-full h-32 flex rounded-t-3xl overflow-hidden relative group/palette">
              {item.colorPalette.map((colHex, index) => (
                <div 
                  key={index}
                  className="flex-1 h-full hover:flex-[1.8] transition-all duration-300 relative cursor-pointer group/swatch"
                  style={{ backgroundColor: colHex }}
                  onClick={(e) => handleCopyColor(e, colHex)}
                  title={`Click to copy hex ${colHex}`}
                >
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/swatch:opacity-100 flex items-center justify-center transition-opacity text-[10px] font-mono text-white select-none font-bold">
                    Copy
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="w-full h-32 relative transition-all duration-300 group-hover:h-36 flex items-end justify-end p-2.5"
              style={{ backgroundColor: item.colorHex }}
            >
              <button
                onClick={(e) => handleCopyColor(e, item.colorHex || '')}
                className="p-1.5 rounded-lg bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition flex items-center gap-1 text-[10px] font-mono font-medium"
              >
                {copied ? <Check className="w-3 h-3 stroke-[2.5]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
          <div className="p-4 flex flex-col gap-1.5 bg-card-bg border-t border-card-border">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-card-title tracking-tight uppercase truncate max-w-[70%]">
                {item.colorPalette ? item.colorPalette.slice(0, 3).join(', ') + (item.colorPalette.length > 3 ? '...' : '') : item.colorHex}
              </span>
              <span className="text-[10px] font-sans font-medium text-card-desc flex items-center gap-1 bg-card-footer px-2 py-0.5 rounded-md border border-card-border shrink-0">
                <Palette className="w-3 h-3 text-card-desc" />
                {item.colorPalette ? 'Palette' : 'Color'}
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

      {/* 3. NOTES & CHECKLISTS */}
      {item.type === 'note' && (
        <div className="p-6 flex flex-col gap-2.5 bg-[#FEEBC8] text-[#121212] h-full">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-black/40 font-bold">
              {isChecklist ? 'List' : 'Note'}
            </span>
            <span className="text-[10px] font-mono text-black/40">
              {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <h3 className="font-display font-semibold text-[15px] text-[#121212] tracking-tight leading-snug">
            {item.title}
          </h3>

          <div className="text-black/70 text-sm font-sans leading-relaxed break-words">
            {isChecklist ? renderChecklist() : (
              <p className="line-clamp-6 whitespace-pre-wrap font-medium">{item.content}</p>
            )}
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

          <div className="p-4.5 flex flex-col gap-1.5 bg-card-bg">
            <h3 className="font-display font-medium text-sm text-card-title line-clamp-2 leading-snug tracking-tight hover:text-card-title/90">
              {item.title}
            </h3>
            {item.content && (
              <p className="text-[11px] text-card-desc leading-relaxed font-sans line-clamp-2">
                {item.content}
              </p>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-card-border mt-1">
              <span className="text-[10px] font-mono text-card-desc max-w-[70%] truncate opacity-80">
                {item.url}
              </span>
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-md text-card-desc hover:text-card-title hover:bg-card-footer transition"
                title="Open page in a new tab"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 5. DISTRACTION-FREE READABLE ARTICLE */}
      {item.type === 'article' && (
        <div className="flex flex-col w-full border-l-[3px] border-indigo-300/60 rounded-r-2xl">
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

          <div className="p-4.5 flex flex-col gap-1.5 bg-card-bg">
            <h3 className="font-display font-medium text-sm text-card-title line-clamp-2 leading-snug tracking-tight">
              {item.title}
            </h3>
            {item.content && (
              <p className="text-[11px] text-card-desc leading-relaxed font-sans line-clamp-2">
                {item.content}
              </p>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-card-border mt-1 text-[10px] font-mono">
              <span className="text-card-desc max-w-[65%] truncate opacity-80">
                {item.url}
              </span>
              {item.readingTime && (
                <span className="text-indigo-400 font-semibold shrink-0">
                  {item.readingTime} min read
                </span>
              )}
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
              referrerPolicy="no-referrer"
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
                referrerPolicy="no-referrer"
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
          <div className="p-4.5 flex flex-col gap-1.5 bg-card-bg">
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
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                  <img src={item.authorAvatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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

          {item.steps && item.steps.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-[#F2EDE0] pt-2">
              <span className="text-[10px] font-mono text-[#B28A54]/70 font-semibold">Instructions ({item.steps.length} steps)</span>
              <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                {item.steps[0]}
              </p>
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

      {/* Bottom info: Tags footer */}
      {item.tags && item.tags.length > 0 && (
        <div className="px-4.5 pb-3 pt-1 flex items-center gap-1 flex-wrap overflow-hidden min-h-[28px] border-t border-neutral-50 bg-neutral-50/20 group-hover:bg-transparent">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <span 
              key={idx} 
              className="text-[9px] font-mono text-neutral-400 bg-neutral-100/60 hover:bg-neutral-100 border border-neutral-200/20 px-1.5 py-0.5 rounded-md transition"
            >
              #{tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="text-[9px] font-mono text-neutral-400 font-bold ml-0.5">
              +{item.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
