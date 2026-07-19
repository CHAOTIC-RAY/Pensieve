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

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || isIframe) {
    if (isIframe && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      updateViaCache: 'none',
    });

    // Proactively check for updates when the tab regains focus / comes online
    const checkForUpdate = () => {
      registration.update().catch(() => {});
    };
    window.addEventListener('focus', checkForUpdate);
    window.addEventListener('online', checkForUpdate);

    const activateWaiting = (worker: ServiceWorker) => {
      worker.postMessage({ type: 'SKIP_WAITING' });
    };

    const notifyWaiting = () => {
      if (!registration.waiting) return;
      (window as any).pwaWaitingWorker = registration.waiting;
      // First install (no active controller yet): activate immediately
      if (!navigator.serviceWorker.controller) {
        activateWaiting(registration.waiting);
        return;
      }
      window.dispatchEvent(new CustomEvent('pwa-update-available'));
    };

    if (registration.waiting) {
      notifyWaiting();
    }

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed') {
          notifyWaiting();
        }
      });
    });

    // Reload after SKIP_WAITING activates a replacement worker
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      // Skip reload on the very first controller assignment
      if (!(window as any).__pensieveHadSwController) {
        (window as any).__pensieveHadSwController = true;
        return;
      }
      refreshing = true;
      window.dispatchEvent(new CustomEvent('pwa-controller-changed'));
      window.location.reload();
    });

    if (navigator.serviceWorker.controller) {
      (window as any).__pensieveHadSwController = true;
    }
  } catch (err) {
    console.warn('[PWA] Service worker registration failed:', err);
  }
}

if (document.readyState === 'complete') {
  registerServiceWorker();
} else {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
