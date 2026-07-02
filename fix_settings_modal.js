import fs from 'fs';

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf-8');

if (!content.includes("pushState")) {
  content = content.replace(
    "export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {",
    `export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: 'settings' }, '');
      const handlePopState = () => {
        onClose();
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modal === 'settings') {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);`
  );
  fs.writeFileSync('src/components/SettingsModal.tsx', content);
}
