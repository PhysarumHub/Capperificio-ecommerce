import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ShopwareProvider from './context/ShopwareContext';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ShopwareProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ShopwareProvider>
    </BrowserRouter>
  </React.StrictMode>
);
