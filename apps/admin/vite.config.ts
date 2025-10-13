import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
     tailwindcss(), svgr({
      svgrOptions: {
        svgo: false,
      }
    })],
    build: {
    chunkSizeWarningLimit: 1000, // Increase limit to 1000KB
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
        }
      }
    }
  }
});
