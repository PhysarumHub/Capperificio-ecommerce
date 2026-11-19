import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    // Browser moderni (ES2022): niente traspilazione inutile né polyfill legacy.
    // Copre Chrome/Edge 94+, Firefox 93+, Safari 16.4+ — allineato al parco
    // reale del sito. Toglie i ~12 KB segnalati da Lighthouse "Legacy JS".
    target: 'es2022',
    // Tutti i browser target supportano <link rel="modulepreload">: il polyfill
    // Vite (iniettato in ogni entry) diventa peso morto.
    modulePreload: { polyfill: false },
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Vendor stabile in un chunk a parte: cambia di rado, resta in cache
        // tra un deploy e l'altro invece di essere reinvalidato col codice app.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'react-vendor';
          }
          if (id.includes('@stripe')) return 'stripe';
          if (id.includes('gsap') || id.includes('lenis') || id.includes('ogl')) return 'anim';
        },
      },
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/store-api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/thumbnail': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
});
