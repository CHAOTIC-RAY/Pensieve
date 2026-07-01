/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Star, Sparkles, Plus, Trash2, 
  ExternalLink, BookOpen, Copy, Check, Palette, Eye, Quote as QuoteIcon, Utensils,
  Film, Disc, ShoppingBag, CheckCircle2, Type, AlignLeft, AlignCenter, AlignRight
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
          className="fixed inset-0 bg-neutral-900/10 backdrop-blur-[2px] z-40 cursor-pointer"
        />
      </AnimatePresence>

      <motion.div
        id="mymind-detail-drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-card-bg shadow-2xl z-50 flex flex-col border-l border-border-subtle"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border-subtle/50">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-foreground/45">Inspector</span>
            {item.isFavorite && (
              <span className="flex items-center gap-1 text-[10px] font-sans font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-rose-500" /> Favorite
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-foreground/5 text-foreground/50 hover:text-foreground transition"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6.5 no-scrollbar">
          
          {/* Card preview visual */}
          {item.type === 'color' && (item.colorHex || item.colorPalette) && (
            <div className="flex flex-col gap-2">
              {item.colorPalette && item.colorPalette.length > 0 ? (
                <div className="w-full h-36 rounded-2xl overflow-hidden flex shadow-inner border border-black/5">
                  {item.colorPalette.map((colHex, index) => (
                    <div 
                      key={index}
                      className="flex-1 h-full cursor-pointer hover:flex-[1.5] transition-all duration-300 relative group"
                      style={{ backgroundColor: colHex }}
                      onClick={() => handleCopyHarmonic(colHex)}
                      title={`Click to copy hex ${colHex}`}
                    >
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-mono transition-opacity select-none">
                        {copiedHarmonic === colHex ? 'Copied!' : colHex}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className="w-full h-36 rounded-2xl relative shadow-inner cursor-pointer group"
                  style={{ backgroundColor: item.colorHex }}
                  onClick={() => handleCopyHarmonic(item.colorHex || '')}
                  title={`Click to copy hex ${item.colorHex}`}
                >
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[11px] text-white font-mono transition-opacity select-none font-bold">
                    {copiedHarmonic === item.colorHex ? 'Copied!' : `Copy ${item.colorHex}`}
                  </div>
                </div>
              )}
            </div>
          )}

          {item.type === 'image' && item.imageUrl && (
            <div className="w-full rounded-2xl overflow-hidden border border-neutral-100 bg-neutral-50 relative">
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full object-contain max-h-[220px]" 
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {item.type === 'quote' && (
            <div className="p-6 bg-amber-50/20 border-l-[3px] border-amber-300 rounded-2xl flex flex-col gap-4">
              <QuoteIcon className="w-8 h-8 text-amber-200" />
              <blockquote className="font-serif italic text-base text-neutral-800 leading-relaxed">
                "{item.content}"
              </blockquote>
              {item.author && <span className="text-right text-xs font-mono text-neutral-500">— {item.author}</span>}
            </div>
          )}

          {/* Edit / Text details */}
          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Title</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full text-base font-display font-medium border-b border-neutral-200 pb-1 outline-none text-neutral-800"
                  />
                </div>

                {item.type !== 'color' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase">Content / Body</label>
                    <textarea 
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      className="w-full text-sm font-sans text-neutral-600 border border-neutral-200 p-2.5 rounded-xl outline-none min-h-[120px] resize-none"
                    />
                  </div>
                )}

                {item.type === 'quote' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase">Author</label>
                    <input 
                      type="text"
                      value={author}
                      onChange={e => setAuthor(e.target.value)}
                      className="w-full text-sm font-sans border-b border-neutral-200 pb-1 outline-none text-neutral-800"
                    />
                  </div>
                )}

<div className="flex gap-2">
                   <button 
                     onClick={handleSaveChanges}
                     className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                   >
                     Save Changes
                   </button>
                   <button 
                     onClick={() => setIsEditing(false)}
                     className="text-neutral-500 hover:text-neutral-800 text-xs font-medium px-3"
                   >
                     Cancel
                   </button>
                 </div>
               </div>
             ) : null}
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display font-semibold text-lg text-neutral-800 tracking-tight leading-snug">
                    {item.title}
                  </h2>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-sans font-medium text-indigo-600 hover:text-indigo-800 hover:underline shrink-0 pt-1"
                  >
                    Edit Detail
                  </button>
                </div>

                {item.type !== 'color' && (
                  <p className="text-neutral-600 text-sm font-sans leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                )}

                {/* Reader Mode Button for Articles */}
                {item.type === 'article' && (
                  <button
                    onClick={() => setIsReaderOpen(true)}
                    className="w-full mt-2 py-3 bg-neutral-900 hover:bg-neutral-950 text-white font-sans font-medium text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Open in Distraction-Free Reader Mode</span>
                  </button>
                )}

                {/* Recipe specific details (ingredients & instructions) */}
                {item.type === 'recipe' && (
                  <div className="space-y-4 pt-3 border-t border-neutral-100 mt-3">
                    {item.ingredients && item.ingredients.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-semibold">Ingredients</span>
                        <ul className="text-xs text-neutral-600 list-disc list-inside space-y-1 bg-neutral-50 p-3.5 rounded-xl border border-neutral-100">
                          {item.ingredients.map((ing, idx) => (
                            <li key={idx}>{ing}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.steps && item.steps.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-semibold">Preparation Steps</span>
                        <ol className="text-xs text-neutral-600 list-decimal list-inside space-y-2 bg-neutral-50 p-3.5 rounded-xl border border-neutral-100">
                          {item.steps.map((step, idx) => (
                            <li key={idx} className="pl-1 leading-relaxed">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <button
                      onClick={() => setIsReaderOpen(true)}
                      className="w-full mt-2 py-3 bg-[#B28A54] hover:bg-[#997341] text-white font-sans font-medium text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Start Cooking (Step-by-step Reader)</span>
                    </button>
                  </div>
                )}

                {/* Video / Music specific details */}
                {(item.type === 'video' || item.type === 'music') && (
                  <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                    <div>
                      <span className="text-[9px] font-mono text-neutral-400 uppercase block">Source</span>
                      <span className="font-semibold text-neutral-700">{item.siteName || 'Unknown'}</span>
                    </div>
                    {item.duration && (
                      <div>
                        <span className="text-[9px] font-mono text-neutral-400 uppercase block">Duration</span>
                        <span className="font-semibold text-neutral-700">{item.duration}</span>
                      </div>
                    )}
                    {item.author && (
                      <div className="col-span-2">
                        <span className="text-[9px] font-mono text-neutral-400 uppercase block">Creator / Artist</span>
                        <span className="font-semibold text-neutral-700">{item.author}</span>
                      </div>
                    )}
                  </div>
                )}

                {item.url && (
                  <div className="pt-2 flex items-center gap-1">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Visit original website ({item.siteName || 'link'})</span>
                    </a>
                  </div>
                )}
              </div>
          </div>

          {/* Color Harmonic Harmonies section */}
          {item.type === 'color' && item.colorHex && (
            <div className="space-y-3 pt-4 border-t border-border-subtle/50">
              <span className="text-[10px] font-mono text-foreground/45 uppercase tracking-wider flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-foreground/45" />
                Color Harmony & Values
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono text-foreground/60">
                <span>RGB: {rgb.r}, {rgb.g}, {rgb.b}</span>
                <span>HSL: {hsl.h}°, {hsl.s}%, {hsl.l}%</span>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono text-foreground/45 uppercase">Suggested Harmonies</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {harmonies.map((harmony, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopyHarmonic(harmony.hex)}
                      className="flex items-center gap-2 p-1.5 rounded-xl border border-border-subtle/40 bg-foreground/[0.02] hover:bg-card-bg transition text-left"
                    >
                      <div className="w-6 h-6 rounded-lg shadow-sm border border-black/5" style={{ backgroundColor: harmony.hex }} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-sans font-semibold text-foreground/85 leading-none">{harmony.name}</span>
                        <span className="text-[9px] font-mono text-foreground/50 uppercase leading-normal">
                          {copiedHarmonic === harmony.hex ? 'Copied!' : harmony.hex}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Metadata Overview */}
          {item.aiSummary && (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 fill-indigo-500 text-indigo-500" />
                AI Smart Insight
              </span>
              <p className="text-xs text-indigo-950 font-sans leading-relaxed font-medium">
                {item.aiSummary}
              </p>
            </div>
          )}

          {/* Note Style Editor */}
          {item.type === 'note' && (
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-neutral-400" />
                Note Style
              </span>
              <div className="space-y-3">
                {/* Font Family */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase">Font Family</label>
                  <div className="flex gap-1.5">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          noteStyle.fontFamily === font
                            ? 'bg-neutral-800 text-white border-neutral-800'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                        }`}
                        style={{ fontFamily: font === 'serif' ? 'Georgia, serif' : font === 'sans' ? 'Inter, sans-serif' : font === 'mono' ? 'JetBrains Mono, monospace' : 'Playfair Display, Georgia, serif' }}
                      >
                        {font.charAt(0).toUpperCase() + font.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-500 uppercase">Font Size</label>
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          noteStyle.fontSize === size
                            ? 'bg-neutral-800 text-white border-neutral-800'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase">Text Color</label>
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
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <span className="text-xs font-mono text-neutral-400">{noteStyle.color || '#121212'}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={noteStyle.bgColor || '#FEEBC8'}
                        onChange={async (e) => {
                          await onUpdateItem({
                            ...item,
                            noteStyle: { ...noteStyle, bgColor: e.target.value }
                          });
                          setNoteStyle({ ...noteStyle, bgColor: e.target.value });
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <span className="text-xs font-mono text-neutral-400">{noteStyle.bgColor || '#FEEBC8'}</span>
                    </div>
                  </div>
                </div>

                {/* Bold/Italic toggles */}
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await onUpdateItem({
                        ...item,
                        noteStyle: { ...noteStyle, bold: !noteStyle.bold }
                      });
                      setNoteStyle({ ...noteStyle, bold: !noteStyle.bold });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      noteStyle.bold
                        ? 'bg-neutral-800 text-white border-neutral-800'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
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
                    className={`px-3 py-1.5 rounded-lg text-xs italic border transition ${
                      noteStyle.italic
                        ? 'bg-neutral-800 text-white border-neutral-800'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    I
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Read/Watched Toggle */}
          {(item.type === 'article' || item.type === 'document' || item.type === 'film' || item.type === 'video') && (
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                Status Tracking
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
                  className={`w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    item.isRead
                      ? 'bg-emerald-500 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
                  className={`w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    item.isWatched
                      ? 'bg-emerald-500 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {item.isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
                </button>
              )}
            </div>
          )}

          {/* Film Detail Expanded View */}
          {item.type === 'film' && (
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-neutral-400" />
                Film Details
              </span>
              
              {item.moviePoster && (
                <div className="w-full rounded-2xl overflow-hidden border border-neutral-100 bg-neutral-50">
                  <img 
                    src={item.moviePoster} 
                    alt={item.title} 
                    className="w-full object-cover max-h-[200px]" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                {item.releaseYear && (
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase block">Year</span>
                    <span className="font-semibold text-neutral-700">{item.releaseYear}</span>
                  </div>
                )}
                {item.runtime && (
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase block">Runtime</span>
                    <span className="font-semibold text-neutral-700">{item.runtime}</span>
                  </div>
                )}
                {item.rating && (
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase block">Rating</span>
                    <span className="font-semibold text-neutral-700 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {item.rating}
                    </span>
                  </div>
                )}
                {item.director && (
                  <div className="col-span-2">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase block">Director</span>
                    <span className="font-semibold text-neutral-700">{item.director}</span>
                  </div>
                )}
              </div>

              {item.genre && item.genre.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase">Genres</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.genre.map((g, i) => (
                      <span key={i} className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.cast && item.cast.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase">Cast</span>
                  <div className="text-xs text-neutral-600 leading-relaxed">
                    {item.cast.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Tag Manager */}
          <div className="space-y-3 pt-4 border-t border-neutral-100">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Mind Index Tags</span>
            
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, idx) => {
                const isAiTag = item.aiTags?.includes(tag) || (!item.manualTags?.includes(tag));
                return (
                  <span 
                    key={idx}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition ${
                      isAiTag 
                        ? 'bg-indigo-50/40 text-indigo-600 border-indigo-100' 
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    {isAiTag ? <Sparkles className="w-2.5 h-2.5 text-indigo-400 shrink-0" /> : null}
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
                      className="ml-1 text-neutral-400 hover:text-neutral-700 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Add tag form */}
            <form onSubmit={handleAddTag} className="flex gap-2 pt-1.5">
              <div className="flex items-center bg-neutral-50 border border-neutral-200/60 rounded-xl px-2.5 py-1.5 flex-1 focus-within:border-neutral-300 transition">
                <Plus className="w-3.5 h-3.5 text-neutral-400 mr-1.5 shrink-0" />
                <input 
                  type="text" 
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="Add manual tag..."
                  className="w-full text-xs outline-none bg-transparent text-neutral-700 font-sans"
                />
              </div>
              <button 
                type="submit"
                className="bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition"
              >
                Add
              </button>
            </form>
          </div>

          {/* Extra generic metadata */}
          <div className="pt-4 border-t border-neutral-100 text-[11px] font-mono text-neutral-400 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Added on: {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div>Category: <span className="capitalize text-neutral-600 font-semibold">{item.type}</span></div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to delete this from your mind?')) {
                await onDeleteItem(item);
                onClose();
              }
            }}
            className="flex items-center gap-1 text-xs text-red-500 font-semibold hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl border border-transparent hover:border-red-100 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Permanently</span>
          </button>

          <span className="text-[10px] font-mono text-neutral-400">
            ID: {item.id.slice(0, 8)}
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
                  className="p-1.5 rounded-xl hover:bg-foreground/5 text-foreground/50 hover:text-foreground transition flex items-center gap-1.5 text-xs font-semibold"
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
                  <div className="space-y-3 mb-6">
                    <span className="text-xs font-mono text-[#B28A54] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Utensils className="w-4 h-4" /> Cooking Mode
                    </span>
                    <h1 className="font-display font-bold text-3xl md:text-4xl text-neutral-900 tracking-tight leading-tight">
                      {item.title}
                    </h1>
                    {item.author && <p className="text-sm font-sans text-[#B28A54] font-semibold">Recipe by {item.author}</p>}
                    {item.duration && (
                      <span className="inline-block text-xs font-mono bg-[#FFFDF5] text-[#B28A54] border border-[#F3EFE0] px-3 py-1 rounded-full font-bold">
                        Prep & Cook Time: {item.duration}
                      </span>
                    )}
                  </div>

                  {/* Interactive Ingredients List */}
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="space-y-3.5 bg-[#FFFDF5] border border-[#F3EFE0] p-6 rounded-3xl">
                      <h3 className="font-display font-bold text-lg text-[#2C2114] flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#B28A54]" /> Check off Ingredients
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.ingredients.map((ing, idx) => (
                          <label key={idx} className="flex items-start gap-2.5 text-sm text-neutral-700 cursor-pointer select-none">
                            <input type="checkbox" className="mt-1 rounded border-neutral-300 text-[#B28A54] focus:ring-[#B28A54]" />
                            <span>{ing}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Instructions */}
                  {item.steps && item.steps.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-display font-bold text-lg text-neutral-900">Step-by-Step Directions</h3>
                      <div className="space-y-4">
                        {item.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-4 p-4.5 rounded-2xl bg-neutral-50 border border-neutral-100 hover:bg-neutral-100/50 transition">
                            <span className="w-8 h-8 rounded-full bg-[#B28A54] text-white font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-neutral-700 text-sm leading-relaxed pt-0.5">
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
                  <div className="space-y-3 mb-10">
                    <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-widest">{item.siteName}</span>
                    <h1 className="font-display font-bold text-3xl md:text-4xl text-neutral-900 tracking-tight leading-tight">
                      {item.title}
                    </h1>
                    <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 pt-2 border-t border-neutral-50">
                      <span>Published on {item.siteName}</span>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline flex items-center gap-0.5">
                          View original <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Rendered content */}
                  <div className="markdown-body prose max-w-none">
                    <ReactMarkdown>{item.content}</ReactMarkdown>
                  </div>
                </>
              )}

              <div className="mt-16 pt-8 border-t border-neutral-100 text-center text-xs font-mono text-neutral-400">
                End of reader. You are reading inside your private mind.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
