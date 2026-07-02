import fs from 'fs';
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf-8');

content = content.replace(
  "import { ArrowRight, Search, Sparkles, Heart, Palette, Compass, Trophy, Activity, Lock, Cloud, Mic, Volume2, LogIn, Github, Play, Check, CircleCheck as CheckCircle2, Quote as QuoteIcon, FileText } from 'lucide-react';",
  "import { ArrowRight, Search, Sparkles, Heart, Palette, Compass, Trophy, Activity, Lock, Cloud, Mic, Volume2, LogIn, Github, Play, Check, CircleCheck as CheckCircle2, Quote as QuoteIcon, FileText, Zap, Maximize2, ShoppingBag, Shield, Layers } from 'lucide-react';"
);

fs.writeFileSync('src/components/LandingPage.tsx', content);
