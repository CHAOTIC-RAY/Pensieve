import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Imports
if (!content.includes('StoreModal')) {
  content = content.replace(
    "import SettingsModal from './components/SettingsModal';",
    "import SettingsModal from './components/SettingsModal';\nimport StoreModal from './components/StoreModal';\nimport AdminPanel from './components/AdminPanel';"
  );
}
if (!content.includes('ShoppingBag')) {
  content = content.replace(
    "Moon, Sun, Compass,",
    "Moon, Sun, Compass, ShoppingBag,"
  );
}

// State
if (!content.includes('isStoreOpen')) {
  content = content.replace(
    "const [isSerendipityOpen, setIsSerendipityOpen] = useState(false);",
    "const [isSerendipityOpen, setIsSerendipityOpen] = useState(false);\n  const [isStoreOpen, setIsStoreOpen] = useState(false);"
  );
}

// Search bar effect handling
// Replace handleSearchKeyDown
if (content.includes("if (searchQuery.trim() === '/focus') {")) {
  content = content.replace(
    "if (searchQuery.trim() === '/focus') {",
    `if (searchQuery.trim() === '/store') {
        e.preventDefault();
        setSearchQuery('');
        setIsStoreOpen(true);
        return;
      }
      if (searchQuery.trim() === '/focus') {`
  );
}

// Apply effect class to wrapper
content = content.replace(
  '<div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden">',
  '<div className={`min-h-screen bg-background text-foreground flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden ${userSettings.activeEffect || \'\'}`}>'
);

content = content.replace(
  '<div className="w-full h-screen bg-background text-foreground flex flex-col md:flex-row transition-colors duration-300 relative overflow-hidden">',
  '<div className={`w-full h-screen bg-background text-foreground flex flex-col md:flex-row transition-colors duration-300 relative overflow-hidden ${userSettings.activeEffect || \'\'}`}>'
);

// Admin Route Injection
// Around line: return isAuthenticated ? ... : <Routes>
// Actually wait! 
// Let's check how App currently renders:
// It has `return isAuthenticated ? (`
// If we want `/admin` to show the admin panel regardless, we can do it at the top of the return.
content = content.replace(
  "return isAuthenticated ? (",
  `if (location.pathname === '/admin') {
    return <AdminPanel />;
  }

  return isAuthenticated ? (`
);

// Add the StoreModal in the render tree
content = content.replace(
  "{isSerendipityOpen && (",
  `
      <AnimatePresence>
        {isStoreOpen && (
          <StoreModal 
            isOpen={isStoreOpen}
            onClose={() => setIsStoreOpen(false)}
            userSettings={userSettings}
          />
        )}
      </AnimatePresence>
      {isSerendipityOpen && (`
);

// Mobile Chip for store
content = content.replace(
  "{/* Achievements Button */}",
  `{/* Store Button */}
          <button
            onClick={() => setIsStoreOpen(true)}
            title="Marketplace"
            className="w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer backdrop-blur-xl border shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.05)] bg-amber-500/10 border-amber-500/20 text-amber-500 hover:scale-105 active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
          {/* Achievements Button */}`
);

fs.writeFileSync('src/App.tsx', content);
