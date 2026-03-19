import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'AirBase — AI Database',
        short_name: 'AirBase',
        description: 'AI-powered spreadsheet and database',
        theme_color: '#4F46E5',
        background_color: '#080812',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60*60*24*365 } },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net/,
            handler: 'CacheFirst',
            options: { cacheName: 'cdn-assets', expiration: { maxEntries: 20, maxAgeSeconds: 60*60*24*30 } },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['handsontable', '@handsontable/react', 'hyperformula'],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('handsontable'))  return 'chunk-handsontable'
          if (id.includes('hyperformula'))  return 'chunk-hyperformula'
          if (id.includes('xlsx') || id.includes('papaparse')) return 'chunk-data'
          if (id.includes('@supabase'))     return 'chunk-supabase'
          if (id.includes('lucide-react'))  return 'chunk-icons'
          if (id.includes('react-dom'))     return 'chunk-react'
          if (id.includes('zustand'))       return 'chunk-state'
        },
      },
    },
  },
})
