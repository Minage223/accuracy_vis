import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './public/data'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          d3: ['d3'],
          framer: ['framer-motion'],
        },
      },
    },
  },
})
