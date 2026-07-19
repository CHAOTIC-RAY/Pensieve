/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, BookOpen, Clock, Play, Pause, Square, 
  RefreshCw, CheckCircle2, ChevronLeft, Type,
  Moon, Sun, ExternalLink, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MindItem } from '../types';

interface ReaderModeProps {
  item: MindItem;
  onClose: () => void;
  onUpdateItem?: (item: MindItem) => Promise<void>;
}

type ReaderTheme = 'light' | 'dark' | 'sepia';
type ReaderFont = 'serif' | 'sans' | 'mono';
type ReaderSize = 'sm' | 'md' | 'lg' | 'xl';
type ReaderWidth = 'narrow' | 'medium' | 'wide';

export default function ReaderMode({ item, onClose, onUpdateItem }: ReaderModeProps) {
  // Appearance States (Persisted in localStorage for convenience)
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    return (localStorage.getItem('pensieve_reader_theme') as ReaderTheme) || 'light';
  });
  const [fontFamily, setFontFamily] = useState<ReaderFont>(() => {
    return (localStorage.getItem('pensieve_reader_font') as ReaderFont) || 'serif';
  });
  const [fontSize, setFontSize] = useState<ReaderSize>(() => {
    return (localStorage.getItem('pensieve_reader_size') as ReaderSize) || 'lg';
  });
  const [readerWidth, setReaderWidth] = useState<ReaderWidth>(() => {
    return (localStorage.getItem('pensieve_reader_width') as ReaderWidth) || 'narrow';
  });

  // Scraping and Text states
  const [bodyText, setBodyText] = useState<string>(item.bodyText || '');
  const [isLoading, setIsLoading] = useState<boolean>(!item.bodyText && !!item.url);
  const [error, setError] = useState<string | null>(null);
  const [isRead, setIsRead] = useState<boolean>(!!item.isRead);

  // Text to Speech States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Settings dropdown visibility
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Reading progress scroll state
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Save settings helpers
  const handleThemeChange = (newTheme: ReaderTheme) => {
    setTheme(newTheme);
    localStorage.setItem('pensieve_reader_theme', newTheme);
  };

  const handleFontChange = (newFont: ReaderFont) => {
    setFontFamily(newFont);
    localStorage.setItem('pensieve_reader_font', newFont);
  };

  const handleSizeChange = (newSize: ReaderSize) => {
    setFontSize(newSize);
    localStorage.setItem('pensieve_reader_size', newSize);
  };

  const handleWidthChange = (newWidth: ReaderWidth) => {
    setReaderWidth(newWidth);
    localStorage.setItem('pensieve_reader_width', newWidth);
  };

  // 1. Scraping metadata on mount if missing
  useEffect(() => {
    let active = true;
    if (!item.bodyText && item.url) {
      setIsLoading(true);
      setError(null);

      fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.url })
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (!active) return;
          if (data.success && data.bodyText) {
            setBodyText(data.bodyText);
            setIsLoading(false);
            
            // Auto update parent and sync database
            if (onUpdateItem) {
              const updatedFields: Partial<MindItem> = {
                bodyText: data.bodyText,
              };
              if (data.title && (!item.title || item.title === item.url)) {
                updatedFields.title = data.title;
              }
              if (data.imageUrl && !item.imageUrl) {
                updatedFields.imageUrl = data.imageUrl;
              }
              if (data.siteName && !item.siteName) {
                updatedFields.siteName = data.siteName;
              }
              if (data.favicon && !item.favicon) {
                updatedFields.favicon = data.favicon;
              }
              
              // Calculate dynamic reading time if not present
              if (!item.readingTime) {
                const words = data.bodyText.split(/\s+/).length;
                updatedFields.readingTime = Math.max(1, Math.ceil(words / 225));
              }

              onUpdateItem({ ...item, ...updatedFields });
            }
          } else {
            throw new Error(data.error || "No readable content found on this webpage.");
          }
        })
        .catch(err => {
          if (!active) return;
          console.warn("[Reader Scraper Error]", err);
          setError("Unable to strip text from this website directly. Showing description or summary instead.");
          setIsLoading(false);
          // Fall back to item content or summary if any
          setBodyText(item.content || item.aiSummary || '');
        });
    } else {
      setBodyText(item.bodyText || item.content || item.aiSummary || '');
    }

    return () => {
      active = false;
      // Stop speech on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [item, onUpdateItem]);

  // 2. Scroll Progress Monitoring
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const totalHeight = el.scrollHeight - el.clientHeight;
    if (totalHeight === 0) return;
    const progress = (el.scrollTop / totalHeight) * 100;
    setScrollProgress(progress);
  };

  // 3. Mark as Read toggle
  const handleToggleRead = async () => {
    const nextRead = !isRead;
    setIsRead(nextRead);
    if (onUpdateItem) {
      await onUpdateItem({
        ...item,
        isRead: nextRead,
        readAt: nextRead ? new Date().toISOString() : undefined
      });
    }
  };

  // 4. Text-to-Speech (TTS) engine
  const startSpeech = () => {
    if (!window.speechSynthesis) {
      alert("Text to Speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel(); // Reset any ongoing audio

    // Clean text for speech
    const cleanSpeechText = bodyText
      .replace(/\[Truncated for sync\]/g, '')
      .replace(/https?:\/\/\S+/g, '') // strip urls
      .substring(0, 4000); // safety length limit for speech

    if (!cleanSpeechText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    
    // Choose high quality English voice or system default
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) || 
                        voices.find(v => v.lang.startsWith('en')) || 
                        voices[0];
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error", e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    speechUtteranceRef.current = utterance;
    setIsSpeaking(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (window.speechSynthesis && isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // Determine colors based on Theme selection
  const themeClasses = {
    light: 'bg-white text-neutral-900 border-black/5',
    dark: 'bg-[#121212] text-[#e0e0e0] border-[#222222]',
    sepia: 'bg-[#fdf6e3] text-[#586e75] border-[#eedeb8]'
  };

  const fontClasses = {
    serif: 'font-serif tracking-normal leading-[1.75]',
    sans: 'font-sans tracking-tight leading-relaxed',
    mono: 'font-mono text-sm tracking-tight leading-loose'
  };

  const sizeClasses = {
    sm: 'text-sm md:text-base',
    md: 'text-base md:text-lg',
    lg: 'text-lg md:text-[1.2rem]',
    xl: 'text-xl md:text-2xl'
  };

  const widthClasses = {
    narrow: 'max-w-xl',
    medium: 'max-w-2xl',
    wide: 'max-w-4xl'
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[120] flex flex-col md:p-6 lg:p-10 select-none"
      style={{ backgroundColor: theme === 'dark' ? '#0a0a0a' : 'var(--reader-sage, #E1EAD9)' }}
    >
      {/* Floating white reading card on sage canvas */}
      <motion.div 
        initial={{ y: 24, scale: 0.985, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 24, scale: 0.985, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className={`w-full h-full max-w-4xl mx-auto md:rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden border ${themeClasses[theme]} relative`}
      >
        {/* Dynamic Top Progress Bar */}
        <div className="w-full h-0.5 bg-black/5 shrink-0 relative">
          <div 
            className="absolute top-0 left-0 h-full bg-neutral-800/70 transition-all duration-100"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Toolbar Header */}
        <header className="px-4 py-3 md:px-8 border-b border-inherit flex items-center justify-between shrink-0 bg-inherit z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-foreground/5 text-inherit transition flex items-center gap-1 cursor-pointer font-sans text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
            <div className="h-4 w-px bg-foreground/10" />
            <div className="flex items-center gap-2">
              {item.favicon && (
                <img 
                  src={item.favicon} 
                  alt="" 
                  className="w-4 h-4 rounded object-contain shrink-0" 
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-[10px] sm:text-xs font-mono font-semibold truncate max-w-[120px] sm:max-w-[200px]">
                {item.siteName || 'Reader'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Audio Text to Speech controls */}
            {bodyText && !isLoading && (
              <div className="flex items-center gap-1 bg-foreground/[0.03] border border-foreground/[0.06] rounded-xl p-1">
                {!isSpeaking ? (
                  <button
                    onClick={startSpeech}
                    title="Listen to article"
                    className="p-1.5 rounded-lg text-inherit hover:bg-foreground/5 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={pauseSpeech}
                      title={isPaused ? "Resume listening" : "Pause listening"}
                      className={`p-1.5 rounded-lg text-inherit hover:bg-foreground/5 transition cursor-pointer ${isPaused ? 'animate-pulse' : ''}`}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={stopSpeech}
                      title="Stop listening"
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Read / Unread Status Checkbox */}
            <button
              onClick={handleToggleRead}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                isRead 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                  : 'bg-transparent text-foreground/60 border-foreground/15 hover:bg-foreground/5'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">{isRead ? 'Completed' : 'Mark Done'}</span>
            </button>

            {/* Open Original Link */}
            {item.url && (
              <a 
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-foreground/15 hover:bg-foreground/5 text-foreground/70 transition cursor-pointer"
                title="Open original website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Appearance Settings toggle */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl transition cursor-pointer border ${
                  showSettings 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' 
                    : 'bg-transparent border-foreground/15 text-foreground/70 hover:bg-foreground/5'
                }`}
                title="Text formatting & Themes"
              >
                <Type className="w-4 h-4" />
              </button>

              {/* Formatting Panel Dropdown */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2 w-72 rounded-2xl border p-4 shadow-xl z-30 flex flex-col gap-4 font-sans text-xs bg-inherit ${themeClasses[theme]}`}
                  >
                    {/* Theme selector */}
                    <div className="space-y-1.5">
                      <span className="font-semibold text-[10px] text-foreground/50 uppercase tracking-wider">Themes</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['light', 'dark', 'sepia'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => handleThemeChange(t)}
                            className={`py-2 px-3 rounded-lg border font-semibold text-xs capitalize cursor-pointer transition ${
                              theme === t 
                                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-500' 
                                : 'bg-foreground/[0.02] border-foreground/10 text-foreground/80 hover:bg-foreground/[0.05]'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font selector */}
                    <div className="space-y-1.5">
                      <span className="font-semibold text-[10px] text-foreground/50 uppercase tracking-wider">Font Style</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['serif', 'sans', 'mono'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => handleFontChange(f)}
                            className={`py-2 px-1 rounded-lg border font-semibold text-xs capitalize cursor-pointer transition ${
                              fontFamily === f 
                                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-500' 
                                : 'bg-foreground/[0.02] border-foreground/10 text-foreground/80 hover:bg-foreground/[0.05]'
                            }`}
                          >
                            <span className={f === 'serif' ? 'font-serif' : f === 'mono' ? 'font-mono' : 'font-sans'}>
                              {f}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font size */}
                    <div className="space-y-1.5">
                      <span className="font-semibold text-[10px] text-foreground/50 uppercase tracking-wider">Font Size</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['sm', 'md', 'lg', 'xl'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => handleSizeChange(s)}
                            className={`py-1.5 rounded-lg border font-semibold text-[10px] uppercase cursor-pointer transition ${
                              fontSize === s 
                                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-500' 
                                : 'bg-foreground/[0.02] border-foreground/10 text-foreground/80 hover:bg-foreground/[0.05]'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Width selector */}
                    <div className="space-y-1.5">
                      <span className="font-semibold text-[10px] text-foreground/50 uppercase tracking-wider">Reading Width</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['narrow', 'medium', 'wide'] as const).map(w => (
                          <button
                            key={w}
                            onClick={() => handleWidthChange(w)}
                            className={`py-1.5 rounded-lg border font-semibold text-[10px] uppercase cursor-pointer transition ${
                              readerWidth === w 
                                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-500' 
                                : 'bg-foreground/[0.02] border-foreground/10 text-foreground/80 hover:bg-foreground/[0.05]'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Reader Canvas / Scroll Area */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 py-12 md:py-16 md:px-16 lg:px-20 select-text custom-scrollbar bg-inherit transition-colors relative"
        >
          {isLoading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <RefreshCw className="w-7 h-7 text-neutral-400 animate-spin mb-4" />
              <p className="text-xs font-sans font-medium text-neutral-600">Preparing a quiet page…</p>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-xs leading-relaxed">
                Stripping ads, chrome, and clutter so you can focus.
              </p>
            </div>
          ) : (
            <div className={`mx-auto ${widthClasses[readerWidth]} space-y-8 md:space-y-10`}>
              <div className="space-y-5 text-center md:text-left">
                {item.readingTime && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium tracking-wide text-neutral-400 uppercase">
                    <Clock className="w-3 h-3" />
                    <span>{item.readingTime} min read</span>
                  </span>
                )}
                
                <h1 className="font-serif font-medium text-3xl md:text-[2.5rem] text-neutral-900 tracking-tight leading-[1.2]">
                  {item.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-neutral-500 font-sans">
                  {item.siteName && (
                    <span className="font-medium text-neutral-700">
                      {item.siteName}
                    </span>
                  )}
                  {item.createdAt && (
                    <>
                      <span className="opacity-30">·</span>
                      <span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-neutral-700 font-sans flex items-start gap-2.5 leading-relaxed">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Fallback:</span> {error}
                  </div>
                </div>
              )}

              <article className={`${fontClasses[fontFamily]} ${sizeClasses[fontSize]} text-neutral-800 whitespace-pre-wrap break-words`}>
                {bodyText || "No additional text content found. Open the original tab to read the full article."}
              </article>

              <div className="pt-10 border-t border-neutral-100 text-center space-y-4 pb-20 font-sans">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-neutral-50 text-neutral-500">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-700">You've finished reading</p>
                  <p className="text-[11px] text-neutral-400 font-serif italic">“{item.title}”</p>
                </div>
                <div className="pt-1">
                  <button
                    onClick={handleToggleRead}
                    className={`px-5 py-2.5 rounded-full border text-xs font-semibold transition flex items-center gap-2 mx-auto cursor-pointer ${
                      isRead 
                        ? 'bg-neutral-900 text-white border-neutral-900' 
                        : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isRead ? 'Done reading' : 'Mark as Done'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Soft fade into sage at bottom of card */}
          {theme === 'light' && (
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.95) 70%, #fff)',
              }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
