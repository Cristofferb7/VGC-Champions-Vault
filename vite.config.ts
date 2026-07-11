import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installable + offline app shell; meta data itself lives in
    // IndexedDB, so no runtime API caching is needed here.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'VGC Champions Vault',
        short_name: 'Champions',
        description:
          'Competitive HUD for Pokémon Champions: meta database, threat matrix, and team analysis. Unofficial; data from Pikalytics.',
        theme_color: '#0B0E14',
        background_color: '#0B0E14',
        display: 'standalone',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // The calc data chunk is ~480kB; raise the precache ceiling.
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
