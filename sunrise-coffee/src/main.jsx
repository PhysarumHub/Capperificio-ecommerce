import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ShopwareProvider from './context/ShopwareContext';
import './lib/bootShell'; // prima del render: stacca l'hero dello shell
import App, { preloadRoute } from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/global.css';
import { reloadOnceForNewBuild } from './lib/reloadOnceForNewBuild';

// Un chunk non si carica (scheda aperta prima di un deploy): ricarica una volta.
window.addEventListener('vite:preloadError', (e) => { if (reloadOnceForNewBuild()) e.preventDefault(); });

// Il chunk della pagina d'ingresso arriva prima del primo render: sulle pagine
// pre-renderizzate l'HTML statico resta visibile fino al cambio, che avviene
// in un solo frame (niente fallback vuoto in mezzo).
// Niente top-level await: i chunk delle pagine importano moduli da questo
// entry, che deve finire di valutarsi prima che possano risolversi.
preloadRoute(window.location.pathname).then(() => ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ShopwareProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ShopwareProvider>
    </BrowserRouter>
  </React.StrictMode>
));
