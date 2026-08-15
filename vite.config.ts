import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
/** vite-plugin-pwa injects the tracker's manifest into every HTML entry, which
 *  leaves cardio.html carrying two manifest links. Browsers use the first, so
 *  the cardio one already wins, but relying on document order to decide which
 *  app an installed icon opens is too subtle to leave in place.
 *
 *  The injection happens after transformIndexHtml, so the emitted file is
 *  rewritten once the bundle is on disk. */
function stripTrackerManifestFromCardio() {
  return {
    name: 'strip-tracker-manifest-from-cardio',
    async closeBundle() {
      const file = resolve(import.meta.dirname, 'dist/cardio.html');
      try {
        const html = await readFile(file, 'utf8');
        const stripped = html.replace(/<link rel="manifest" href="\/manifest\.webmanifest">\s*/g, '');
        if (stripped !== html) await writeFile(file, stripped);
      } catch {
        // dist/cardio.html only exists after a production build.
      }
    },
  };
}

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
    stripTrackerManifestFromCardio(),
  ],
})
