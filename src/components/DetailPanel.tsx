/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Star, Sparkles, Plus, Trash2, 
  ExternalLink, BookOpen, Copy, Check, Palette, Eye, Quote as QuoteIcon, Utensils,
  Film, Disc, ShoppingBag, CheckCircle2, Type, AlignLeft, AlignCenter, AlignRight,
  Bookmark, Link as LinkIcon, MessageSquare, Tag, Hash, Compass, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { MindItem, NoteStyle } from '../types';

interface DetailPanelProps {
  item: MindItem | null;
  onClose: () => void;
  onUpdateItem: (item: MindItem) => Promise<void>;
  onDeleteItem: (item: MindItem) => Promise<void>;
  onSetVibeFilter?: (type: 'color' | 'tag', value: string, label: string) => void;
}

// Color calculations helpers
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c / 2,
      r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function DetailPanel({ 
  item, 
  onClose, 
  onUpdateItem, 
  onDeleteItem,
  onSetVibeFilter
}: DetailPanelProps) {
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [copiedHarmonic, setCopiedHarmonic] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [noteStyle, setNoteStyle] = useState<NoteStyle>({});

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setContent(item.content);
      setAuthor(item.author || '');
      setTags(item.tags || []);
      setNoteStyle(item.noteStyle || {});
      setIsReaderOpen(false);
      setIsEditing(false);
    }
  }, [item]);

  if (!item) return null;

  // Handle Tag management
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = newTag.trim().toLowerCase().replace(/#/g, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      const updatedTags = [...tags, cleanTag];
      setTags(updatedTags);
      setNewTag('');
      onUpdateItem({
        ...item,
        tags: updatedTags,
        manualTags: [...(item.manualTags || []), cleanTag]
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    setTags(updatedTags);
    onUpdateItem({
      ...item,
      tags: updatedTags,
      manualTags: (item.manualTags || []).filter(t => t !== tagToRemove),
      aiTags: (item.aiTags || []).filter(t => t !== tagToRemove)
    });
  };

  const handleSaveChanges = async () => {
    await onUpdateItem({
      ...item,
      title,
      content,
      author: author ? author : undefined,
    });
    setIsEditing(false);
  };

  // Color harmony builder
  const rgb = item.colorHex ? hexToRgb(item.colorHex) : { r: 0, g: 0, b: 0 };
  const hsl = item.colorHex ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 0 };
  
  const harmonies = item.colorHex ? [
    { name: 'Complementary', hex: hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l) },
    { name: 'Analogous L', hex: hslToHex((hsl.h + 330) % 360, hsl.s, hsl.l) },
    { name: 'Analogous R', hex: hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l) },
    { name: 'Triadic L', hex: hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l) },
    { name: 'Triadic R', hex: hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l) },
    { name: 'Monochromatic', hex: hslToHex(hsl.h, hsl.s, Math.max(10, hsl.l - 20)) }
  ] : [];

  const handleCopyHarmonic = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHarmonic(hex);
    setTimeout(() => setCopiedHarmonic(null), 1500);
  };

  return (
    <>
      {/* Sliding detail drawer overlay */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/20 dark:bg-neutral-950/50 backdrop-blur-[4px] z-40 cursor-pointer animate-fade-in"
        />
      </AnimatePresence>

      <motion.div
        id="mymind-detail-drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 250 }}
        className="fixed top-0 right-0 h-full w-full max-w-lg bg-card-bg shadow-[0_0_50px_rgba(0,0,0,0.12)] z-50 flex flex-col border-l border-border-subtle/70 relative before:absolute before:inset-0 before:bg-[radial-gradient(#80808007_1.2px,transparent_1.2px)] before:[background-size:20px_20px] before:pointer-events-none overflow-hidden"
      >
        {/* Editorial Top Border Accents */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle/40 bg-card-bg/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/50 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
              Memory Registry
            </span>
            {item.isFavorite && (
              <span className="flex items-center gap-1 text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-rose-500 text-rose-500" /> Favorite
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-7 space-y-8.5 no-scrollbar z-10">
          
          {/* Polaroid Photo Frame for Saving Memories Beautifully */}
          {item.type === 'image' && item.imageUrl && (
            <div className="flex flex-col items-center">
              <motion.div 
                initial={{ rotate: -1.5, scale: 0.96, opacity: 0 }}
                animate={{ rotate: -0.5, scale: 1, opacity: 1 }}
                whileHover={{ rotate: 0, scale: 1.01 }}
                transition={{ duration: 0.4 }}
                className="bg-[#FCFAF2] dark:bg-neutral-900 p-5 pb-9 rounded-sm shadow-[0_12px_28px_rgba(0,0,0,0.08)] border border-neutral-200/55 dark:border-neutral-800 max-w-sm w-full mx-auto relative before:absolute before:inset-0 before:bg-[radial-gradient(#80808004_1px,transparent_1px)] before:[background-size:12px_12px] before:pointer-events-none"
              >
                {/* Elegant realistic physical tape accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2.5 w-20 h-5 bg-white/50 dark:bg-neutral-850/30 backdrop-blur-[1.5px] border border-white/20 dark:border-white/5 rotate-[-1deg] shadow-[0_1px_3px_rgba(0,0,0,0.01)] z-15 select-none" />
                
                {/* Polaroid Shadow Accent */}
                <div className="absolute inset-x-5 -bottom-1.5 h-1.5 bg-neutral-950/5 dark:bg-black/20 blur-[2.5px] rounded-full pointer-events-none" />
                
                {/* Image Area */}
                <div className="aspect-[4/3] w-full overflow-hidden border border-neutral-200/40 dark:border-neutral-800 bg-neutral-900/5 dark:bg-neutral-950 rounded-xs relative group">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                {/* Handwritten-style Caption */}
                <div className="mt-5 text-center">
                  <span className="font-serif italic text-base text-neutral-800 dark:text-neutral-200 tracking-wide font-medium block leading-snug">
                    {item.title || "Captured Mindscape"}
                  </span>
                  <span className="block text-[8px] font-mono text-neutral-500/60 dark:text-neutral-450 mt-2 uppercase tracking-widest">
                    {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </span>
                </div>
              </motion.div>
            </div>
          )}

          {/* Swatch Swatches Frame for Colors */}
          {item.type === 'color' && (item.colorHex || item.colorPalette) && (
            <div className="flex flex-col gap-3">
              {item.colorPalette && item.colorPalette.length > 0 ? (
                <div className="w-full bg-foreground/[0.01] border border-border-subtle/70 p-5 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
                  <div className="w-full h-24 rounded-xl overflow-hidden flex border border-black/5 dark:border-white/5 shadow-sm">
                    {item.colorPalette.map((colHex, index) => (
                      <div 
                        key={index}
                        className="flex-1 h-full cursor-pointer hover:flex-[1.8] transition-all duration-300 relative group"
                        style={{ backgroundColor: colHex }}
                        onClick={() => handleCopyHarmonic(colHex)}
                        title={`Click to copy hex ${colHex}`}
                      >
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-mono transition-opacity select-none tracking-wider font-bold">
                          {copiedHarmonic === colHex ? 'COPIED!' : colHex}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[9px] font-mono text-foreground/55 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                      <Palette className="w-3.5 h-3.5 text-primary" /> COLOR PALETTE DECK
                    </span>
                    <span className="text-[8px] font-mono text-foreground/40 italic">Click color to copy HEX</span>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-foreground/[0.01] border border-border-subtle/70 p-5 rounded-2xl space-y-4 shadow-sm text-center">
                  <div 
                    className="w-full h-28 rounded-xl relative border border-black/5 dark:border-white/5 cursor-pointer group shadow-md overflow-hidden"
                    style={{ backgroundColor: item.colorHex }}
                    onClick={() => handleCopyHarmonic(item.colorHex || '')}
                    title={`Click to copy hex ${item.colorHex}`}
                  >
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-mono transition-opacity select-none font-bold tracking-wider">
                      {copiedHarmonic === item.colorHex ? 'COPIED!' : `COPY HEX ${item.colorHex}`}
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-0.5 text-xs">
                    <span className="font-mono text-foreground/60 text-[10px] font-bold">SWATCH HEX: {item.colorHex}</span>
                    <span className="font-mono text-[9px] text-foreground/45 italic">Click swatch to copy</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aesthetic Quote Block - Editorial Serif Quote */}
          {item.type === 'quote' && !isEditing && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-8 py-11 bg-foreground/[0.01] border border-border-subtle/85 rounded-3xl flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden shadow-sm"
            >
              {/* Massive Decorative quote icon */}
              <QuoteIcon className="w-12 h-12 text-primary/10 fill-primary/5 absolute -top-1.5 -left-1.5 transform -rotate-12 pointer-events-none" />
              <QuoteIcon className="w-10 h-10 text-primary/20 fill-primary/10 pointer-events-none" />
              
              <blockquote className="font-serif italic text-lg md:text-xl text-foreground/90 leading-relaxed tracking-wide max-w-sm px-2">
                “{item.content}”
              </blockquote>
              
              {item.author && (
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="w-5 h-[1px] bg-foreground/20" />
                  <span className="text-[10px] font-mono text-foreground/50 tracking-wider uppercase font-bold">— {item.author}</span>
                  <div className="w-5 h-[1px] bg-foreground/20" />
                </div>
              )}
            </motion.div>
          )}

          {/* Note View Frame - Lined notebook paper look or editorial typography */}
          {item.type === 'note' && !isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-7 rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-border-subtle relative overflow-hidden"
              style={{ 
                backgroundColor: noteStyle.bgColor || 'var(--card-bg)', 
                color: noteStyle.color || 'var(--foreground)',
                fontFamily: noteStyle.fontFamily === 'serif' ? 'Georgia, serif' : noteStyle.fontFamily === 'mono' ? 'JetBrains Mono, monospace' : noteStyle.fontFamily === 'display' ? 'Playfair Display, Georgia, serif' : 'var(--font-sans)',
                fontSize: noteStyle.fontSize === 'sm' ? '13px' : noteStyle.fontSize === 'lg' ? '17px' : noteStyle.fontSize === 'xl' ? '20px' : '15px',
                fontWeight: noteStyle.bold ? 'bold' : 'normal',
                fontStyle: noteStyle.italic ? 'italic' : 'normal',
                backgroundImage: 'linear-gradient(rgba(128, 128, 128, 0.06) 1px, transparent 1px)',
                backgroundSize: '100% 32px',
                lineHeight: '32px'
              }}
            >
              {/* Vertical red line of real notebook paper */}
              <div className="absolute left-7.5 top-0 bottom-0 w-[1px] bg-red-400/20 pointer-events-none" />
              
              <div className="pl-6.5 whitespace-pre-wrap select-text leading-relaxed">
                {item.content}
              </div>
            </motion.div>
          )}

          {/* Edit Panel Draft - Editorial Form Layout */}
          <div className="space-y-5">
            {isEditing ? (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-5 bg-foreground/[0.01] border border-border-subtle p-5.5 rounded-2xl shadow-sm"
              >
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-foreground/45 uppercase tracking-widest">Title</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full text-base font-serif font-semibold border-b border-border-subtle pb-1 bg-transparent outline-none text-foreground focus:border-indigo-500/40 transition-colors"
                  />
                </div>

                {item.type !== 'color' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-foreground/45 uppercase tracking-widest">Content Draft</label>
                    <textarea 
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      className="w-full text-sm font-sans text-foreground/80 bg-input-bg border border-border-subtle p-3.5 rounded-xl outline-none min-h-[140px] resize-none focus:border-indigo-500/40 transition-colors leading-relaxed"
                    />
                  </div>
                )}

                {item.type === 'quote' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-foreground/45 uppercase tracking-widest">Author / Source</label>
                    <input 
                      type="text"
                      value={author}
                      onChange={e => setAuthor(e.target.value)}
                      className="w-full text-sm font-sans border-b border-border-subtle pb-1 bg-transparent outline-none text-foreground focus:border-indigo-500/40 transition-colors"
                    />
                  </div>
                )}

                <div className="flex gap-2.5 pt-1.5">
                  <button 
                    onClick={handleSaveChanges}
                    className="bg-foreground text-background text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition shadow-sm cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="text-foreground/50 hover:text-foreground text-xs font-semibold px-3 py-2 border border-border-subtle rounded-xl hover:bg-foreground/5 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : null}

            {/* Display Mode Text Details */}
            {!isEditing && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-5">
                  <h2 className="font-serif font-bold text-xl md:text-2xl text-foreground/90 tracking-tight leading-tight">
                    {item.title}
                  </h2>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-400 hover:underline shrink-0 pt-1 flex items-center gap-1"
                  >
                    <Type className="w-3.5 h-3.5" />
                    Edit Details
                  </button>
                </div>

                {/* Generic view for item types that aren't note or quote */}
                {item.type !== 'color' && item.type !== 'note' && item.type !== 'quote' && (
                  <p className="text-foreground/80 text-sm font-sans leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                )}

                {/* Reader Mode Button for Articles */}
                {item.type === 'article' && (
                  <button
                    onClick={() => setIsReaderOpen(true)}
                    className="w-full mt-3 py-3 bg-foreground text-background hover:opacity-95 font-sans font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Open distraction-free Reader Mode</span>
                  </button>
                )}

                {/* Recipe details */}
                {item.type === 'recipe' && (
                  <div className="space-y-4.5 pt-4.5 border-t border-border-subtle/50 mt-3">
                    {item.ingredients && item.ingredients.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Ingredients Swatch
                        </span>
                        <ul className="text-xs text-foreground/75 list-disc list-inside space-y-1.5 bg-foreground/[0.01] p-4 rounded-xl border border-border-subtle">
                          {item.ingredients.map((ing, idx) => (
                            <li key={idx} className="font-serif italic">{ing}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.steps && item.steps.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest font-semibold flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-indigo-400" /> Method Guidelines
                        </span>
                        <ol className="text-xs text-foreground/75 list-decimal list-inside space-y-2.5 bg-foreground/[0.01] p-4 rounded-xl border border-border-subtle">
                          {item.steps.map((step, idx) => (
                            <li key={idx} className="pl-1 leading-relaxed">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <button
                      onClick={() => setIsReaderOpen(true)}
                      className="w-full mt-2 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-sans font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Start cooking step-by-step</span>
                    </button>
                  </div>
                )}

                {/* Video / Music Details */}
                {(item.type === 'video' || item.type === 'music') && (
                  <div className="grid grid-cols-2 gap-4 text-xs bg-foreground/[0.01] p-4 rounded-xl border border-border-subtle font-sans">
                    <div>
                      <span className="text-[9px] font-mono text-foreground/45 uppercase block tracking-wider">Provenance</span>
                      <span className="font-semibold text-foreground/80 flex items-center gap-1 mt-0.5">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                        {item.siteName || 'Unknown'}
                      </span>
                    </div>
                    {item.duration && (
                      <div>
                        <span className="text-[9px] font-mono text-foreground/45 uppercase block tracking-wider">Playtime</span>
                        <span className="font-semibold text-foreground/80 flex items-center gap-1 mt-0.5">
                          <Disc className="w-3.5 h-3.5 text-indigo-400" />
                          {item.duration}
                        </span>
                      </div>
                    )}
                    {item.author && (
                      <div className="col-span-2">
                        <span className="text-[9px] font-mono text-foreground/45 uppercase block tracking-wider">Creator / Artist</span>
                        <span className="font-semibold text-foreground/80 mt-0.5 block">{item.author}</span>
                      </div>
                    )}
                  </div>
                )}

                {item.url && (
                  <div className="pt-2 flex items-center gap-1.5">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-mono text-indigo-500 hover:text-indigo-400 flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Visit original source ({item.siteName || 'external link'})</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Color swatches suggested harmony details */}
          {item.type === 'color' && item.colorHex && (
            <div className="space-y-4 pt-5 border-t border-border-subtle/50">
              <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                Color Harmonies & Values
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono text-foreground/60 p-3 bg-foreground/[0.01] border border-border-subtle rounded-xl">
                <span>RGB: {rgb.r}, {rgb.g}, {rgb.b}</span>
                <span>HSL: {hsl.h}°, {hsl.s}%, {hsl.l}%</span>
              </div>

              <div className="space-y-2.5 pt-2">
                <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-wider block">Curated Harmonies</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {harmonies.map((harmony, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopyHarmonic(harmony.hex)}
                      className="flex items-center gap-2.5 p-2 rounded-xl border border-border-subtle bg-foreground/[0.01] hover:bg-card-bg transition text-left cursor-pointer"
                    >
                      <div className="w-6.5 h-6.5 rounded-lg shadow-sm border border-black/5 shrink-0" style={{ backgroundColor: harmony.hex }} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-sans font-semibold text-foreground/85 leading-none">{harmony.name}</span>
                        <span className="text-[9px] font-mono text-foreground/50 uppercase leading-normal mt-0.5">
                          {copiedHarmonic === harmony.hex ? 'Copied!' : harmony.hex}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Metadata Smart Insights */}
          {item.aiSummary && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-5 bg-gradient-to-br from-primary/[0.04] to-indigo-500/[0.04] dark:from-primary/[0.08] dark:to-indigo-500/[0.08] border border-primary/15 dark:border-primary/20 rounded-2xl space-y-2 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl pointer-events-none" />
              <span className="text-[9px] font-mono text-primary uppercase tracking-widest flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 fill-primary/10 text-primary animate-pulse" />
                AI Smart Reflection
              </span>
              <p className="text-xs text-foreground/80 font-sans leading-relaxed">
                {item.aiSummary}
              </p>
            </motion.div>
          )}

          {/* Interactive Custom Lined Note Style editor */}
          {item.type === 'note' && (
            <div className="space-y-4.5 pt-5 border-t border-border-subtle/50">
              <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest flex items-center gap-1.5">
                <Type className="w-4 h-4 text-indigo-400" />
                Journal Styling options
              </span>
              <div className="space-y-3.5 bg-foreground/[0.01] border border-border-subtle p-4 rounded-2xl">
                {/* Font Choice */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-foreground/45 uppercase tracking-wider">Font Family</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['serif', 'sans', 'mono', 'display'] as const).map((font) => (
                      <button
                        key={font}
                        onClick={async () => {
                          await onUpdateItem({
                            ...item,
                            noteStyle: { ...noteStyle, fontFamily: font }
                          });
                          setNoteStyle({ ...noteStyle, fontFamily: font });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          noteStyle.fontFamily === font
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-card-bg text-foreground/60 border-border-subtle hover:bg-foreground/5'
                        }`}
                      >
                        {font.charAt(0).toUpperCase() + font.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Sizing */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-foreground/45 uppercase tracking-wider">Font Scale</label>
                  <div className="flex gap-1.5">
                    {(['sm', 'base', 'lg', 'xl'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={async () => {
                          await onUpdateItem({
                            ...item,
                            noteStyle: { ...noteStyle, fontSize: size }
                          });
                          setNoteStyle({ ...noteStyle, fontSize: size });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          noteStyle.fontSize === size
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-card-bg text-foreground/60 border-border-subtle hover:bg-foreground/5'
                        }`}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Swatch Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-foreground/45 uppercase tracking-wider">Text Ink</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={noteStyle.color || '#121212'}
                        onChange={async (e) => {
                          await onUpdateItem({
                            ...item,
                            noteStyle: { ...noteStyle, color: e.target.value }
                          });
                          setNoteStyle({ ...noteStyle, color: e.target.value });
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono text-foreground/50">{noteStyle.color || '#121212'}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-foreground/45 uppercase tracking-wider">Paper Tone</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={noteStyle.bgColor || '#FAF9F6'}
                        onChange={async (e) => {
                          await onUpdateItem({
                            ...item,
                            noteStyle: { ...noteStyle, bgColor: e.target.value }
                          });
                          setNoteStyle({ ...noteStyle, bgColor: e.target.value });
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono text-foreground/50">{noteStyle.bgColor || '#FAF9F6'}</span>
                    </div>
                  </div>
                </div>

                {/* Bold/Italic Toggles */}
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await onUpdateItem({
                        ...item,
                        noteStyle: { ...noteStyle, bold: !noteStyle.bold }
                      });
                      setNoteStyle({ ...noteStyle, bold: !noteStyle.bold });
                    }}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold border transition cursor-pointer ${
                      noteStyle.bold
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-card-bg text-foreground/60 border-border-subtle hover:bg-foreground/5'
                    }`}
                  >
                    B
                  </button>
                  <button
                    onClick={async () => {
                      await onUpdateItem({
                        ...item,
                        noteStyle: { ...noteStyle, italic: !noteStyle.italic }
                      });
                      setNoteStyle({ ...noteStyle, italic: !noteStyle.italic });
                    }}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs italic border transition cursor-pointer ${
                      noteStyle.italic
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-card-bg text-foreground/60 border-border-subtle hover:bg-foreground/5'
                    }`}
                  >
                    I
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Watched/Read Status Tracking Section */}
          {(item.type === 'article' || item.type === 'document' || item.type === 'film' || item.type === 'video') && (
            <div className="space-y-3 pt-5 border-t border-border-subtle/50">
              <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                Memory Status Tracking
              </span>
              {(item.type === 'article' || item.type === 'document') && (
                <button
                  onClick={async () => {
                    await onUpdateItem({
                      ...item,
                      isRead: !item.isRead,
                      readAt: !item.isRead ? new Date().toISOString() : undefined
                    });
                  }}
                  className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    item.isRead
                      ? 'bg-indigo-500 text-white'
                      : 'bg-foreground/5 text-foreground/80 border border-border-subtle/40 hover:bg-foreground/10'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {item.isRead ? 'Mark as Unread' : 'Mark as Read'}
                </button>
              )}
              {(item.type === 'film' || item.type === 'video') && (
                <button
                  onClick={async () => {
                    await onUpdateItem({
                      ...item,
                      isWatched: !item.isWatched,
                      watchedAt: !item.isWatched ? new Date().toISOString() : undefined
                    });
                  }}
                  className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    item.isWatched
                      ? 'bg-indigo-500 text-white'
                      : 'bg-foreground/5 text-foreground/80 border border-border-subtle/40 hover:bg-foreground/10'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {item.isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
                </button>
              )}
            </div>
          )}

          {/* Film Details */}
          {item.type === 'film' && (
            <div className="space-y-4 pt-5 border-t border-border-subtle/50">
              <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest flex items-center gap-1.5">
                <Film className="w-4 h-4 text-indigo-400" />
                Filmography details
              </span>
              
              {item.moviePoster && (
                <div className="w-full rounded-2xl overflow-hidden border border-border-subtle bg-foreground/[0.01]">
                  <img 
                    src={item.moviePoster} 
                    alt={item.title} 
                    className="w-full object-cover max-h-[220px]" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs bg-foreground/[0.01] p-4 rounded-xl border border-border-subtle">
                {item.releaseYear && (
                  <div>
                    <span className="text-[9px] font-mono text-foreground/45 uppercase block tracking-wider">Year</span>
                    <span className="font-semibold text-foreground/80 mt-0.5 block">{item.releaseYear}</span>
                  </div>
                )}
                {item.runtime && (
                  <div>
                    <span className="text-[9px] font-mono text-foreground/45 uppercase block tracking-wider">Runtime</span>
                    <span className="font-semibold text-foreground/80 mt-0.5 block">{item.runtime}</span>
                  </div>
                )}
                {item.rating && (
                  <div>
                    <span className="text-[9px] font-mono text-foreground/45 uppercase block tracking-wider">Rating</span>
                    <span className="font-semibold text-foreground/80 flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {item.rating}
                    </span>
                  </div>
                )}
                {item.director && (
                  <div className="col-span-2">
                    <span className="text-[9px] font-mono text-foreground/45 uppercase block tracking-wider">Director</span>
                    <span className="font-semibold text-foreground/80 mt-0.5 block">{item.director}</span>
                  </div>
                )}
              </div>

              {item.genre && item.genre.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-foreground/45 uppercase tracking-wider block">Genres</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.genre.map((g, i) => (
                      <span key={i} className="text-xs font-semibold bg-foreground/5 text-foreground/70 px-2.5 py-1 rounded-xl border border-border-subtle/30">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.cast && item.cast.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-foreground/45 uppercase tracking-wider block">Starring Cast</span>
                  <div className="text-xs text-foreground/75 leading-relaxed">
                    {item.cast.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Tag Manager Section */}
          <div className="space-y-4 pt-5 border-t border-border-subtle/50">
            <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest flex items-center gap-1.5 font-semibold">
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              Memory Index Tags
            </span>
            
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, idx) => {
                const isAiTag = item.aiTags?.includes(tag) || (!item.manualTags?.includes(tag));
                return (
                  <span 
                    key={idx}
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl border transition ${
                      isAiTag 
                        ? 'bg-indigo-500/5 text-indigo-400 border-indigo-500/15' 
                        : 'bg-foreground/5 text-foreground/70 border-border-subtle'
                    }`}
                  >
                    {isAiTag ? <Sparkles className="w-2.5 h-2.5 text-indigo-400 shrink-0" /> : <Tag className="w-2.5 h-2.5 text-foreground/40 shrink-0" />}
                    <span 
                      className="cursor-pointer hover:underline"
                      onClick={() => {
                        if (onSetVibeFilter) {
                          onSetVibeFilter('tag', tag, '#' + tag);
                          onClose();
                        }
                      }}
                    >
                      #{tag}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tag);
                      }}
                      className="ml-1 text-foreground/35 hover:text-foreground/75 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Elegant Add tag form */}
            <form onSubmit={handleAddTag} className="flex gap-2 pt-1.5">
              <div className="flex items-center bg-input-bg border border-border-subtle rounded-xl px-3 py-1.8 flex-1 focus-within:border-indigo-500/40 transition">
                <Plus className="w-4 h-4 text-foreground/35 mr-2 shrink-0" />
                <input 
                  type="text" 
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="Index a new tag..."
                  className="w-full text-xs outline-none bg-transparent text-foreground placeholder-foreground/35 font-sans"
                />
              </div>
              <button 
                type="submit"
                className="bg-foreground text-background text-xs font-semibold px-4.5 py-1.8 rounded-xl hover:opacity-90 transition shadow-sm cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

          {/* Time & Category Metadata block */}
          <div className="pt-5 border-t border-border-subtle/50 text-[10px] font-mono text-foreground/45 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Registered: {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Category: <span className="capitalize text-foreground/70 font-semibold">{item.type}</span></span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4.5 border-t border-border-subtle/40 bg-card-bg/95 backdrop-blur-sm flex justify-between items-center z-10">
          <button
            onClick={async () => {
              if (window.confirm('Are you certain you want to delete this memory from your mind?')) {
                await onDeleteItem(item);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-500 font-bold hover:bg-rose-500/5 px-3.5 py-2.5 rounded-xl border border-transparent hover:border-rose-500/10 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Memory</span>
          </button>

          <span className="text-[9px] font-mono text-foreground/40 uppercase tracking-widest">
            REG: {item.id.slice(0, 8)}
          </span>
        </div>
      </motion.div>

      {/* FULL READER MODE OVERLAY FOR ARTICLES */}
      <AnimatePresence>
        {isReaderOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-card-bg z-[60] overflow-y-auto flex justify-center py-12 md:py-20 px-6 custom-scrollbar"
          >
            <div className="w-full max-w-2xl relative">
              
              {/* Floating Close Header */}
              <div className="sticky top-0 bg-card-bg/90 backdrop-blur-md pb-4 pt-1 flex items-center justify-between border-b border-border-subtle/50 mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-foreground/45">Distraction-Free Reader</span>
                  {item.readingTime && (
                    <span className="text-xs font-sans font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      {item.readingTime} min read
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsReaderOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-foreground/5 text-foreground/50 hover:text-foreground transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Exit Reader</span>
                </button>
              </div>

              {/* Cover image in reader mode */}
              {item.imageUrl && (
                <div className="w-full max-h-[350px] rounded-3xl overflow-hidden mb-10 shadow-lg border border-neutral-100 bg-neutral-50">
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}

              {item.type === 'recipe' ? (
                <div className="space-y-8">
                  {/* Recipe Header */}
                  <div className="space-y-3 mb-6 font-serif">
                    <span className="text-xs font-mono text-indigo-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Utensils className="w-4 h-4" /> Cooking Mode
                    </span>
                    <h1 className="font-bold text-3xl md:text-4xl text-foreground tracking-tight leading-tight">
                      {item.title}
                    </h1>
                    {item.author && <p className="text-sm font-sans text-indigo-500 font-semibold">Recipe by {item.author}</p>}
                    {item.duration && (
                      <span className="inline-block text-xs font-mono bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 px-3 py-1 rounded-full font-bold">
                        Prep & Cook Time: {item.duration}
                      </span>
                    )}
                  </div>

                  {/* Interactive Ingredients List */}
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="space-y-3.5 bg-foreground/[0.01] border border-border-subtle p-6 rounded-3xl">
                      <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                        <Check className="w-5 h-5 text-indigo-500" /> Check off Ingredients
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.ingredients.map((ing, idx) => (
                          <label key={idx} className="flex items-start gap-2.5 text-sm text-foreground/80 cursor-pointer select-none">
                            <input type="checkbox" className="mt-1 rounded border-border-subtle text-indigo-500 focus:ring-indigo-500" />
                            <span>{ing}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Instructions */}
                  {item.steps && item.steps.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-serif font-bold text-lg text-foreground">Step-by-Step Directions</h3>
                      <div className="space-y-4">
                        {item.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-4 p-4.5 rounded-2xl bg-foreground/[0.01] border border-border-subtle hover:bg-foreground/[0.03] transition">
                            <span className="w-8 h-8 rounded-full bg-indigo-500 text-white font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-foreground/80 text-sm leading-relaxed pt-0.5 font-serif">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Title / Site Name / Author Header */}
                  <div className="space-y-3 mb-10 font-serif">
                    <span className="text-xs font-mono text-indigo-500 font-bold uppercase tracking-widest">{item.siteName}</span>
                    <h1 className="font-bold text-3xl md:text-4xl text-foreground tracking-tight leading-tight">
                      {item.title}
                    </h1>
                    <div className="flex items-center gap-3 text-xs font-mono text-foreground/40 pt-3 border-t border-border-subtle mt-2">
                      <span>Published on {item.siteName}</span>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline flex items-center gap-0.5">
                          View original <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Rendered content */}
                  <div className="markdown-body prose max-w-none text-foreground/80 font-serif">
                    <ReactMarkdown>{item.content}</ReactMarkdown>
                  </div>
                </>
              )}

              <div className="mt-16 pt-8 border-t border-border-subtle text-center text-xs font-mono text-foreground/35">
                End of reader. You are reading inside your private mind.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
