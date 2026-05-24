import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8080',
      '/jobs': 'http://localhost:8080',
      '/stats': 'http://localhost:8080',
      '/me': 'http://localhost:8080',
    },
  },
})
