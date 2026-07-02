import fs from 'fs';
let content = fs.readFileSync('src/services/themeStudio.ts', 'utf-8');

content = content.replace(
  "  mobileTabs: ['favorites', 'note', 'link'],\n};",
  `  mobileTabs: ['favorites', 'note', 'link'],
  xp: 100, // starting XP
  unlockedEffects: [],
  activeEffect: null,
};`
);

fs.writeFileSync('src/services/themeStudio.ts', content);
