import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and router
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI components chunk
          ui: ['@heroicons/react'],
        },
      },
    },
    // Increase chunk size warning limit to 1MB
    chunkSizeWarningLimit: 1000,
  },
})
