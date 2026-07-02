import fs from 'fs';
let content = fs.readFileSync('src/components/Omnibar.tsx', 'utf-8');

content = content.replace(
  'className="sticky top-0 md:top-auto md:relative w-full max-w-2xl mx-auto z-40',
  'className="search-container sticky top-0 md:top-auto md:relative w-full max-w-2xl mx-auto z-40'
);

fs.writeFileSync('src/components/Omnibar.tsx', content);
