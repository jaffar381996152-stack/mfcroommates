
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// PWA: register service worker for offline support
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
