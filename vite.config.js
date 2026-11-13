import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Same-origin in development: the browser talks to :5173 and Vite forwards /api to the server.
    proxy: { '/api': 'http://localhost:4000' },
  },
  build: {
    chunkSizeWarningLimit: 800, // three.js is lazy-loaded for the globe
  },
});
