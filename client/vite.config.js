import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Any request starting with /api or these paths will be forwarded to the backend
      '/api': {
        target: 'http://localhost:3300',
        changeOrigin: true,
      },
      '/signup': {
        target: 'http://localhost:3300',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:3300',
        changeOrigin: true,
      },
      '/verify': {
        target: 'http://localhost:3300',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3300',
        changeOrigin: true,
      },
      '/exam': {
        target: 'http://localhost:3300',
        changeOrigin: true,
      },
    },
  },
})
