import fs from 'fs';

let content = fs.readFileSync('src/components/AchievementsModal.tsx', 'utf-8');

if (!content.includes("pushState")) {
  content = content.replace(
    "export default function AchievementsModal({ isOpen, onClose }: AchievementsModalProps) {",
    `export default function AchievementsModal({ isOpen, onClose }: AchievementsModalProps) {
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: 'achievements' }, '');
      const handlePopState = () => {
        onClose();
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modal === 'achievements') {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);`
  );
  
  if (!content.includes("useEffect")) {
    content = content.replace(
      "import React from 'react';",
      "import React, { useEffect } from 'react';"
    );
  }
  
  fs.writeFileSync('src/components/AchievementsModal.tsx', content);
}
