import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installable + offline app shell; meta data itself lives in
    // IndexedDB. Custom SW (src/sw.ts) adds the Android share_target
    // POST handler and offline caching for self-hosted OCR assets.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      // main.tsx registers explicitly (with a reload on controllerchange
      // so deploys reach open tabs) — don't also auto-inject a register.
      injectRegister: false,
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'VGC Champions Vault',
        short_name: 'Champions',
        description:
          'Competitive HUD for Pokémon Champions: meta database, threat matrix, and team analysis. Unofficial; data from Pikalytics.',
        theme_color: '#0B0E14',
        background_color: '#0B0E14',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // Installed PWA appears in the Android share sheet; the SW stores
        // the POSTed screenshot and the app feeds it straight into OCR.
        share_target: {
          action: '/share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [{ name: 'screenshot', accept: ['image/*'] }],
          },
        },
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The calc data chunk is ~480kB; raise the precache ceiling.
        // tesseract assets are excluded — they runtime-cache on first use.
        globIgnores: ['tesseract/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // @smogon/calc ships full gen data tables — keep them off the
          // critical path chunk.
          calc: ['@smogon/calc'],
        },
      },
    },
  },
  server: {
    proxy: {
      // Pikalytics has no CORS headers; proxy /pika → pikalytics.com in dev.
      // A real backend replaces this in a later sprint.
      '/pika': {
        target: 'https://www.pikalytics.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pika/, ''),
      },
    },
  },
})
