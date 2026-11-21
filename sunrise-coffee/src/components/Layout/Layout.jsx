import { Outlet, useLocation } from 'react-router-dom';
import ShippingBar from './ShippingBar';
import Header from './Header';
import Newsletter from './Newsletter';
import Footer from './Footer';
import CookieConsent from '../CookieConsent/CookieConsent';
import WhatsAppWidget from '../WhatsAppWidget/WhatsAppWidget';

// Pagine senza il pulsante WhatsApp galleggiante (coprirebbe la barra azioni)
const NO_WHATSAPP = ['/box-di-natale'];

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <a href="#main-content" className="sr-only">Vai al contenuto principale</a>
      <ShippingBar />
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Newsletter />
      <Footer />
      {!NO_WHATSAPP.includes(pathname) && <WhatsAppWidget />}
      <CookieConsent />
    </>
  );
}
