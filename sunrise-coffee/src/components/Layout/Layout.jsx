import { Outlet } from 'react-router-dom';
import ShippingBar from './ShippingBar';
import Header from './Header';
import Newsletter from './Newsletter';
import Footer from './Footer';
import CookieConsent from '../CookieConsent/CookieConsent';

export default function Layout() {
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
      <CookieConsent />
    </>
  );
}
