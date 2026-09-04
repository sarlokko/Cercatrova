import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8788',
    },
  },
})
