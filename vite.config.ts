import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
