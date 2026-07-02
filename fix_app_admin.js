import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('location.pathname === \'/admin\'')) {
  content = content.replace(
    "if (authLoading) {",
    `if (location.pathname === '/admin') {
    return <AdminPanel />;
  }

  if (authLoading) {`
  );
  fs.writeFileSync('src/App.tsx', content);
}
