import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_CRYPTO_UUID': JSON.stringify(true)
  },
  optimizeDeps: {
    exclude: ['crypto']
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify'
    }
  }
})
