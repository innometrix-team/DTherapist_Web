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
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        // Split large libraries into separate chunks
      }
    }
  }
},
});
