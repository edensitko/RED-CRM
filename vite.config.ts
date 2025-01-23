import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    global: 'globalThis',
  },
  resolve: {
    alias: {
      path: 'path-browserify',
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
      util: 'util/',
      buffer: 'buffer/'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  }
})
