import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      // Two independent apps in one deploy: the original tracker at / and the
      // standalone cardio feedback app at /cardio.html. They share nothing but
      // the Strava API routes and the design tokens.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        cardio: resolve(import.meta.dirname, 'cardio.html'),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      workbox: {
        // The PWA shell rewrites every navigation to index.html. With two apps
        // in one deploy that swallowed /cardio.html — the browser was served the
        // tracker instead — and it would swallow the OAuth callback too, since
        // returning from Strava is a navigation request the server must handle.
        navigateFallbackDenylist: [/^\/cardio\.html/, /^\/api\//],
      },
      manifest: {
        name: 'Holistic Fitness Tracker',
        short_name: 'Fitness',
        description: 'Plan a weekly routine and track adherence across lifting, cardio, and cross-training.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f6f9',
        theme_color: '#f5f6f9',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
