import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ScrollToTop from './components/ScrollToTop';

/* ── Eager: rotte d'ingresso principali ─────────────────────────────────
   Home, PDP e collection sono le landing organiche: caricarle in modo
   pigro aggiungerebbe un round-trip proprio dove serve il LCP migliore. */
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CollectionPage from './pages/CollectionPage';
import NotFoundPage from './pages/NotFoundPage';

/* ── Lazy: tutto il resto ───────────────────────────────────────────────
   Checkout (Stripe) ed esperienze GSAP pesano molto e non servono al primo
   render: escono dal bundle iniziale. */
const CartPage               = lazy(() => import('./pages/CartPage'));
const CheckoutPage           = lazy(() => import('./pages/CheckoutPage'));
const AccountPage            = lazy(() => import('./pages/AccountPage'));
const B2BPage                = lazy(() => import('./pages/B2BPage'));
const AboutPage              = lazy(() => import('./pages/AboutPage'));
const PrivacyPolicyPage      = lazy(() => import('./pages/PrivacyPolicyPage'));
const CookiePolicyPage       = lazy(() => import('./pages/CookiePolicyPage'));
const TerminiCondizioniPage  = lazy(() => import('./pages/TerminiCondizioniPage'));
const NewsletterConfirmPage  = lazy(() => import('./pages/NewsletterConfirmPage'));
const ContattiPage           = lazy(() => import('./pages/ContattiPage'));
const FAQPage                = lazy(() => import('./pages/FAQPage'));
const TestPageA              = lazy(() => import('./pages/TestPageA'));
const TestPageB              = lazy(() => import('./pages/TestPageB'));
const CylinderCarousel       = lazy(() => import('./components/CylinderCarousel'));
const Carousel3D             = lazy(() => import('./components/Carousel3D/Carousel3D'));

/* Fallback neutro: evita il flash di layout mentre arriva il chunk. */
function RouteFallback() {
  return <div style={{ minHeight: '60vh' }} aria-busy="true" />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            {/* Splat: gli seoPathInfo di Shopware sono multi-segmento
                (es. "Capperi-al-Sale/CAPRACALE-SALE-01"), quindi ":slug"
                non li intercettava e la PDP cadeva sulla 404. */}
            <Route path="/product/*" element={<ProductPage />} />
            <Route path="/collections/:slug" element={<CollectionPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/login" element={<AccountPage />} />
            <Route path="/account/register" element={<AccountPage />} />
            <Route path="/b2b" element={<B2BPage />} />
            <Route path="/storia" element={<AboutPage />} />
            <Route path="/newsletter-subscribe" element={<NewsletterConfirmPage />} />

            <Route path="/contatti" element={<ContattiPage />} />
            <Route path="/faq" element={<FAQPage />} />

            {/* ── Pagine legali ── */}
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />
            <Route path="/termini-e-condizioni" element={<TerminiCondizioniPage />} />
          </Route>

          {/* ── Fullscreen experiences (no header/footer) ── */}
          <Route path="/territorio" element={<Carousel3D />} />
          <Route path="/test-a" element={<TestPageA />} />
          <Route path="/test-b" element={<TestPageB />} />
          <Route path="/processo-produttivo" element={<CylinderCarousel />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
