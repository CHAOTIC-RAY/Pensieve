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

const isIframe = (() => {
  try {
    return window !== window.parent;
  } catch {
    return true;
  }
})();

// Register SW for real offline shell; unregister inside iframes (preview sandboxes)
if ('serviceWorker' in navigator) {
  if (isIframe) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
