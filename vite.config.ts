import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,jpg,jpeg,webp}'],
        maximumFileSizeToCacheInBytes: 5000000, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          }
        ],
        skipWaiting: true,
        clientsClaim: true
      },
      includeAssets: ['favicon.ico', 'icons/apple-icon-180.png', 'icons/icon.svg'],
      manifest: {
        name: 'TriageAid - Medical Triage Assistant',
        short_name: 'TriageAid',
        description: 'Offline-capable medical triage assessment tool for emergency situations and clinical environments',
        theme_color: '#1E40AF',
        background_color: '#F9FAFB',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/triage-aid/',
        start_url: '/triage-aid/',
        lang: 'en',
        dir: 'ltr',
        categories: ['medical', 'health', 'productivity', 'utilities'],
        icons: [
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/apple-icon-180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        shortcuts: [
          {
            name: 'New Assessment',
            short_name: 'New Patient',
            description: 'Start a new patient triage assessment',
            url: '/triage-aid/intake',
            icons: [
              {
                src: 'icons/manifest-icon-192.maskable.png',
                sizes: '192x192'
              }
            ]
          },
          {
            name: 'Patient Dashboard',
            short_name: 'Dashboard',
            description: 'View all triaged patients',
            url: '/triage-aid/dashboard',
            icons: [
              {
                src: 'icons/manifest-icon-192.maskable.png',
                sizes: '192x192'
              }
            ]
          }
        ],
        prefer_related_applications: false,
        edge_side_panel: {
          preferred_width: 400
        }
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunk for external dependencies
          if (id.includes('node_modules')) {
            if (id.includes('preact')) {
              return 'vendor';
            }
            if (id.includes('dexie')) {
              return 'database';
            }
            return 'vendor';
          }
          
          // UI components chunk
          if (id.includes('/components/ui/')) {
            return 'ui';
          }
          
          // Services chunk
          if (id.includes('/services/')) {
            return 'services';
          }
          
          // Locale files
          if (id.includes('/locales/')) {
            return 'locales';
          }
          
          // Default chunk
          return undefined;
        }
      }
    },
    // Optimize chunk size for low-power devices
    chunkSizeWarningLimit: 500,
    // Enable minification for smaller bundles
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    }
  },
  // Optimize dependencies for faster loading
  optimizeDeps: {
    include: ['preact', 'preact/hooks', 'dexie']
  },
  base: '/triage-aid'
})
