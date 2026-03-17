import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CollectionPage from './pages/CollectionPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/collections/:slug" element={<CollectionPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/login" element={<AccountPage />} />
        <Route path="/account/register" element={<AccountPage />} />
      </Route>
    </Routes>
  );
}
