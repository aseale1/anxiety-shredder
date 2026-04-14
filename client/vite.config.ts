import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react()],
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

