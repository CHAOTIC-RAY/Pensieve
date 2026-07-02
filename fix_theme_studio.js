import fs from 'fs';
let content = fs.readFileSync('src/services/themeStudio.ts', 'utf-8');

content = content.replace(
  "export type UserSettings = {",
  `export type UserSettings = {
  xp?: number;
  unlockedEffects?: string[];
  activeEffect?: string | null;`
);

fs.writeFileSync('src/services/themeStudio.ts', content);
