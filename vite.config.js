
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration optimized for GitHub Pages deployment
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages - update 'colorado-school-data-dashboard' to match your repo name
  base: '/colorado-school-dashboard/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    // Ensure all public files are copied to build output
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          maps: ['leaflet', 'react-leaflet']
        }
      }
    }
  },
  publicDir: 'public',
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
});
