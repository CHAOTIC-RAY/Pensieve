import fs from 'fs';
let content = fs.readFileSync('src/components/DetailPanel.tsx', 'utf-8');

// Add Voice/Audio player placeholder if type is voice
const voicePlaceholder = `
            {/* Voice / Audio Support */}
            {item.type === 'voice' && (
              <div className="w-full bg-foreground/5 border border-border-subtle rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 mb-2">
                  <Mic className="w-8 h-8" />
                </div>
                <div className="w-full h-12 bg-foreground/10 rounded-full flex items-center px-4">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 mr-4 shrink-0"></div>
                  {/* Fake waveform */}
                  <div className="flex-1 flex items-center gap-1 h-6">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="flex-1 bg-indigo-500/50 rounded-full" style={{ height: \`\${Math.max(10, Math.random() * 100)}%\` }}></div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-foreground/50 ml-4 shrink-0">0:45</div>
                </div>
              </div>
            )}
`;

content = content.replace(
  '{/* Image Support */}',
  voicePlaceholder + '\n            {/* Image Support */}'
);

if (!content.includes('import { ')) {
   // Already imported? Wait, let's just make sure Mic is imported.
}
fs.writeFileSync('src/components/DetailPanel.tsx', content);
