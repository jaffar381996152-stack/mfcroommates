
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// Prevent "stale data" after reinstall / new install:
// Browsers can keep localStorage between installs (and PWA caches can survive updates).
// We generate a per-install id; if it's missing we clear RoomieWallet data once.
const INSTALL_KEY = 'rw_install_id';
try {
  const existing = localStorage.getItem(INSTALL_KEY);
  if (!existing) {
    // Clear only RoomieWallet keys (not all localStorage)
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('rw_')) localStorage.removeItem(k);
    });
    localStorage.setItem(INSTALL_KEY, `${Date.now()}_${Math.random().toString(16).slice(2)}`);
  }
} catch {
  // ignore
}

// Register service worker for offline support
registerSW({
  immediate: true
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
