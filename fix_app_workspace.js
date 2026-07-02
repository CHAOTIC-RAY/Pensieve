import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  '<div id="pensieve-workspace" className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-foreground selection:text-background transition-colors duration-300 relative">',
  '<div id="pensieve-workspace" className={`min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-foreground selection:text-background transition-colors duration-300 relative ${userSettings.activeEffect || \'\'}`}>'
);

fs.writeFileSync('src/App.tsx', content);

let storeContent = fs.readFileSync('src/services/storeService.ts', 'utf-8');
storeContent = storeContent.replace(/doc\.name/g, '(doc as any).name')
                           .replace(/doc\.type/g, '(doc as any).type')
                           .replace(/doc\.description/g, '(doc as any).description')
                           .replace(/doc\.price/g, '(doc as any).price')
                           .replace(/doc\.effectId/g, '(doc as any).effectId')
                           .replace(/doc\.imageUrl/g, '(doc as any).imageUrl')
                           .replace(/response\.name/g, '(response as any).name')
                           .replace(/response\.type/g, '(response as any).type')
                           .replace(/response\.description/g, '(response as any).description')
                           .replace(/response\.price/g, '(response as any).price')
                           .replace(/response\.effectId/g, '(response as any).effectId')
                           .replace(/response\.imageUrl/g, '(response as any).imageUrl');
fs.writeFileSync('src/services/storeService.ts', storeContent);
