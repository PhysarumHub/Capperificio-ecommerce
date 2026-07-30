import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CollectionPage from './pages/CollectionPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import B2BPage from './pages/B2BPage';
import BlogPage from './pages/BlogPage';
import BlogArticlePage from './pages/BlogArticlePage';
import AboutPage from './pages/AboutPage';
import ProcessoProduttivoPage from './pages/ProcessoProduttivoPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import TerminiCondizioniPage from './pages/TerminiCondizioniPage';
import NotFoundPage from './pages/NotFoundPage';
import ScrollToTop from './components/ScrollToTop';
import TestPageA from './pages/TestPageA';
import TestPageB from './pages/TestPageB';
import CylinderCarousel from './components/CylinderCarousel';
import Storia2Page from './pages/Storia2Page';
import Carousel3D from './components/Carousel3D/Carousel3D';

export default function App() {
  return (
    <>
      <ScrollToTop />
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
          <Route path="/b2b" element={<B2BPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogArticlePage />} />
          <Route path="/storia" element={<AboutPage />} />
          <Route path="/processo-produttivo" element={<ProcessoProduttivoPage />} />

          {/* ── Pagine legali ── */}
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/termini-e-condizioni" element={<TerminiCondizioniPage />} />
        </Route>

        {/* ── Fullscreen experiences (no header/footer) ── */}
        <Route path="/territorio" element={<CylinderCarousel />} />
        <Route path="/test-a" element={<TestPageA />} />
        <Route path="/test-b" element={<TestPageB />} />
        <Route path="/storia2" element={<Storia2Page />} />
        <Route path="/carosello-3d" element={<Carousel3D />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
