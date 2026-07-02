import fs from 'fs';
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf-8');

// Update Section 3: Highlighted Features
const oldSection3Start = '<div className="text-center">';
const oldSection3End = '</div>\n          </motion.div>\n        </section>';
const newSection3 = `<div className="text-center">
              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-[0.25em] bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">ARCHITECTURE & FEATURES</span>
              <h2 className="text-3xl md:text-5xl font-display font-black text-foreground mt-4 tracking-tight">Enterprise Infrastructure. <br/><span className="text-primary italic">Consumer Soul.</span></h2>
              <p className="text-xs md:text-sm text-foreground/45 mt-4 max-w-xl mx-auto leading-relaxed">Built on a robust Appwrite + Firebase Auth stack with offline capabilities. Your database stays securely in the cloud with high-performance edge synchronization.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-550 border border-indigo-500/20">
                  <Cloud className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Appwrite Database</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Powered by Appwrite for real-time document storage. Features scalable infrastructure that securely syncs your workspace across all devices instantly.</p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-550 border border-emerald-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">On-Device WebLLM AI</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Run a 1.5B parameter language model entirely locally using WebLLM and WebGPU. 100% private semantic search and AI summarization—no data ever leaves your device.</p>
              </div>
              
              {/* Feature 3 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-550 border border-rose-500/20">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Native Inspector Panel</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">A beautiful, Notion-style rich editor. Fully responsive: full-screen modal on mobile with native gestures, and a sleek focused card on desktop. Optimized for text, images, and voice notes.</p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-550 border border-amber-500/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Effects Marketplace</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Spend earned XP in the integrated Store. Unlock cosmic themes, CRT monitor visual effects, custom name tags, and premium visual elements for your workspace.</p>
              </div>

              {/* Feature 5 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-550 border border-teal-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">Firebase Auth & Security</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Enterprise-grade authentication with Google Identity Platform. Complete with admin dashboard controls and strictly protected application environments.</p>
              </div>

              {/* Feature 6 */}
              <div className="p-8 rounded-[2rem] border border-black/[0.03] shadow-sm bg-white/60 backdrop-blur-md space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-550 border border-purple-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display tracking-tight text-foreground">XP Economy & Gamification</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">Build habits with interactive milestones. Track progress via the comprehensive XP system and custom physical-style collectible achievement cards.</p>
              </div>
            </div>`;

content = content.replace(
  /<div className="text-center">[\s\S]*?<\/div>\s*<\/motion.div>\s*<\/section>/m,
  newSection3 + '\n          </motion.div>\n        </section>'
);

fs.writeFileSync('src/components/LandingPage.tsx', content);
