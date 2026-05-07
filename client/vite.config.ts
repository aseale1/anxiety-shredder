import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

const manifestIcons = [
  {
    src: '/pwa-192x192.png',
    sizes: '192x192',
    type: 'image/png'
  },
  {
    src: '/pwa-512x512.png',
    sizes: '512x512',
    type: 'image/png'
  }
]

export default defineConfig({
  root: resolve(__dirname),
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Anxiety Shredder',
        short_name: 'Anxiety Shredder',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: manifestIcons,
      }
    })
  ],
  server: {
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  build: {
    outDir: "dist"
  }
})

