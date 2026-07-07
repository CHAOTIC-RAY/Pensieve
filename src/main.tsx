import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { installWebGpuAdapterPreferencePatch } from './services/webGpuAdapterPatch';

// Optimize WebGPU adapter selection for mobile and older hardware
installWebGpuAdapterPreferencePatch();

// Capture PWA installation event globally
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
});

window.addEventListener('appinstalled', () => {
  (window as any).deferredPrompt = null;
  (window as any).isAppInstalled = true;
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

// Unregister Service Worker to prevent intercepting/proxying bugs in sandboxed iframes
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
