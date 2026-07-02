import fs from 'fs';
let content = fs.readFileSync('src/hooks/useAchievements.ts', 'utf-8');

// We need to import loadSettings, saveSettings
if (!content.includes('loadSettings')) {
  content = content.replace(
    "import { MindItem, Achievement } from '../types';",
    "import { MindItem, Achievement } from '../types';\nimport { loadSettings, saveSettings } from '../services/themeStudio';"
  );
}

// Inside unlock:
//       const achievement = ACHIEVEMENTS.find(a => a.id === id);
//       if (achievement) {
//         setToastQueue(q => [...q, { ...achievement, unlockedAt: now }]);
//       }
// Let's add XP granting:
content = content.replace(
  "if (achievement) {",
  `if (achievement) {
        // Grant XP
        const settings = loadSettings();
        if (!settings.xp) settings.xp = 0;
        settings.xp += (achievement.xp || 10);
        saveSettings(settings);
`
);

fs.writeFileSync('src/hooks/useAchievements.ts', content);
