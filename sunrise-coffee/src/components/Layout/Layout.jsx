import { Outlet } from 'react-router-dom';
import ShippingBar from './ShippingBar';
import Header from './Header';
import Newsletter from './Newsletter';
import Footer from './Footer';

export default function Layout() {
  return (
    <>
      <ShippingBar />
      <Header />
      <Outlet />
      <Newsletter />
      <Footer />
    </>
  );
}
