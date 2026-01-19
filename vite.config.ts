import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // PWA: enables offline support + installability for Netlify/GitHub Pages hosting
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg', 'robots.txt'],
          manifest: {
            name: 'MFC Room Budget',
            short_name: 'Room Budget',
            description: 'Room expense tracker with settlements and history.',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/pwa-192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/pwa-512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: '/pwa-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            // Ensure the app shell + assets are cached for offline usage
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
            navigateFallback: '/index.html'
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
