import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
    // Forward /api/* to the Express server (vibecheck/server) so the browser only talks to one origin.
    proxy: { '/api': 'http://localhost:3001' },
  },
})