import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * CSS d'ingresso (index-*.css) non più render-blocking: lo shell statico in
 * index.html ha già i suoi stili inline, quindi barra, logo e hero si
 * dipingono senza aspettare il foglio. Il foglio si scarica in parallelo
 * (media="print" → "all" al load) e il bundle React parte solo quando è
 * pronto (vedi deferEntryUntilHeroPaint), così non c'è flash senza stili.
 * Meglio che metterlo inline: l'HTML resta leggero (~4 KB) e la foto hero
 * viene richiesta prima.
 */
function nonBlockingEntryCss() {
  return {
    name: 'non-blocking-entry-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/,
          (_, href) =>
            `<link id="entry-css" rel="stylesheet" crossorigin href="${href}" media="print" onload="this.media='all'">` +
            `<noscript><link rel="stylesheet" crossorigin href="${href}"></noscript>`,
        );
      },
    },
  };
}

/**
 * Home: il bundle React parte solo dopo che la foto hero dello shell
 * statico (index.html) è stata dipinta.
 *
 * Senza questo, su connessioni veloci React gira prima del primo paint e
 * Lighthouse attribuisce all'LCP anche download ed esecuzione del JS
 * (≈2 s di "render delay" simulato su mobile). Con l'hero già a schermo,
 * il JS si carica subito dopo: la pagina diventa interattiva con un
 * ritardo minimo, ma la parte visibile arriva molto prima.
 * Sulle altre rotte lo shell non c'è e il bundle parte subito.
 */
function deferEntryUntilHeroPaint() {
  return {
    name: 'defer-entry-until-hero-paint',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const entry = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>\s*/);
        if (!entry) return html;
        const preloads = [...html.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)">\s*/g)];
        let out = html.replace(entry[0], '');
        for (const m of preloads) out = out.replace(m[0], '');
        const loader = `<script>
(function () {
  var d = document;
  function start() {
    ${JSON.stringify(preloads.map((m) => m[1]))}.forEach(function (h) {
      var l = d.createElement('link'); l.rel = 'modulepreload'; l.crossOrigin = ''; l.href = h; d.head.appendChild(l);
    });
    var s = d.createElement('script'); s.type = 'module'; s.crossOrigin = ''; s.src = ${JSON.stringify(entry[1])};
    d.head.appendChild(s);
  }
  // Parte quando (1) il CSS d'ingresso è caricato e (2) l'hero dello shell
  // è a schermo (decodificata + due frame). Senza shell conta solo il CSS.
  var pending = 2;
  function ready() { if (--pending === 0) start(); }

  var css = d.getElementById('entry-css');
  if (!css || css.sheet) ready();
  else { css.addEventListener('load', ready); css.addEventListener('error', ready); }

  var img = d.querySelector('#boot-shell .boot-hero img');
  if (!img) return ready();
  var done = false;
  function go() { if (!done) { done = true; ready(); } }

  // Segnale esatto: il browser ha registrato l'hero come LCP.
  var PO = window.PerformanceObserver;
  if (PO && PO.supportedEntryTypes && PO.supportedEntryTypes.indexOf('largest-contentful-paint') > -1) {
    new PO(function (list, obs) {
      list.getEntries().forEach(function (e) { if (e.element === img) { obs.disconnect(); go(); } });
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  }
  // Riserva (browser senza LCP API, o hero non scelta come LCP):
  // immagine caricata e decodificata + due frame, con un margine.
  function fallback() {
    var p = img.decode ? img.decode().catch(function () {}) : Promise.resolve();
    p.then(function () {
      requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(go, 300); }); });
    });
  }
  if (img.complete) fallback();
  else { img.addEventListener('load', fallback); img.addEventListener('error', go); }
  setTimeout(go, 3000);
})();
</script>`;
        return out.replace('</body>', loader + '\n</body>');
      },
    },
  };
}

/**
 * Copia dist/index.html in dist/_shell.html: la shell "vuota" della SPA.
 * Il pre-render (scripts/prerender.mjs) sovrascrive index.html con la home
 * renderizzata, quindi nginx (rotte senza pagina statica) ed Express (schede
 * prodotto e collezioni) partono sempre da _shell.html.
 */
function emitSpaShell() {
  let outDir = 'dist';
  return {
    name: 'emit-spa-shell',
    apply: 'build',
    configResolved(c) { outDir = resolve(c.root, c.build.outDir); },
    closeBundle() {
      const src = resolve(outDir, 'index.html');
      if (existsSync(src)) copyFileSync(src, resolve(outDir, '_shell.html'));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), nonBlockingEntryCss(), deferEntryUntilHeroPaint(), emitSpaShell()],

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
