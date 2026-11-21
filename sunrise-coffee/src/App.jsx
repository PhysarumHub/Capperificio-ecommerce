import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams, useLocation, matchPath } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ScrollToTop from './components/ScrollToTop';

/* ── Eager: rotte d'ingresso principali ─────────────────────────────────
   Home, PDP e collection sono le landing organiche: caricarle in modo
   pigro aggiungerebbe un round-trip proprio dove serve il LCP migliore. */
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CollectionPage from './pages/CollectionPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * lazy() con precaricamento. Quando il modulo è già arrivato (preloadRoute),
 * la factory restituisce un thenable che si risolve in modo sincrono: React lo
 * legge subito e la rotta non sospende. Serve alle pagine pre-renderizzate:
 * l'HTML statico resta a schermo finché il chunk non c'è, poi React lo
 * sostituisce nello stesso frame, senza passare dal fallback vuoto.
 */
function lazyRoute(load) {
  let mod = null;
  const get = () => load().then((m) => (mod = m));
  const Comp = lazy(() => (mod ? { then: (resolve) => resolve(mod) } : get()));
  Comp.preload = () => (mod ? Promise.resolve(mod) : get());
  return Comp;
}

/* ── Lazy: tutto il resto ───────────────────────────────────────────────
   Checkout (Stripe) ed esperienze GSAP pesano molto e non servono al primo
   render: escono dal bundle iniziale. */
const CartPage               = lazyRoute(() => import('./pages/CartPage'));
const CheckoutPage           = lazyRoute(() => import('./pages/CheckoutPage'));
const AccountPage            = lazyRoute(() => import('./pages/AccountPage'));
const B2BPage                = lazyRoute(() => import('./pages/B2BPage'));
const AboutPage              = lazyRoute(() => import('./pages/AboutPage'));
const ProcessoPage           = lazyRoute(() => import('./pages/ProcessoPage'));
const TerritorioPage         = lazyRoute(() => import('./pages/TerritorioPage'));
const PrivacyPolicyPage      = lazyRoute(() => import('./pages/PrivacyPolicyPage'));
const CookiePolicyPage       = lazyRoute(() => import('./pages/CookiePolicyPage'));
const TerminiCondizioniPage  = lazyRoute(() => import('./pages/TerminiCondizioniPage'));
const NewsletterConfirmPage  = lazyRoute(() => import('./pages/NewsletterConfirmPage'));
const ContattiPage           = lazyRoute(() => import('./pages/ContattiPage'));
const FAQPage                = lazyRoute(() => import('./pages/FAQPage'));
const AssistenzaPage         = lazyRoute(() => import('./pages/AssistenzaPage'));
const GuideHubPage           = lazyRoute(() => import('./pages/GuideHubPage'));
const GuidePage              = lazyRoute(() => import('./pages/GuidePage'));
const AssistenzaTopicPage    = lazyRoute(() => import('./pages/AssistenzaTopicPage'));
const OrderStatusPage        = lazyRoute(() => import('./pages/OrderStatusPage'));
const QualcosaNonVaPage      = lazyRoute(() => import('./pages/QualcosaNonVaPage'));
const PrimoOrdinePage        = lazyRoute(() => import('./pages/PrimoOrdinePage'));
const SpedizioniResiPage     = lazyRoute(() => import('./pages/SpedizioniResiPage'));
const SampleBoxPage          = lazyRoute(() => import('./pages/SampleBoxPage'));
const SampleBoxCheckoutPage  = lazyRoute(() => import('./pages/SampleBoxCheckoutPage'));
const NatalBoxPage           = lazyRoute(() => import('./pages/NatalBoxPage'));
const TestPageA              = lazyRoute(() => import('./pages/TestPageA'));
const TestPageB              = lazyRoute(() => import('./pages/TestPageB'));

/* Rotte lazy → componente, per precaricare il chunk della pagina d'ingresso
   prima del primo render (vedi main.jsx). Le rotte eager non servono. */
const LAZY_ROUTES = [
  ['/cart', CartPage], ['/checkout', CheckoutPage],
  ['/account/*', AccountPage], ['/account', AccountPage],
  ['/b2b', B2BPage], ['/storia', AboutPage], ['/processo-produttivo', ProcessoPage],
  ['/territorio', TerritorioPage], ['/newsletter-subscribe', NewsletterConfirmPage],
  ['/contatti', ContattiPage], ['/faq', FAQPage],
  ['/assistenza', AssistenzaPage],
  ['/assistenza/dove-e-il-mio-ordine', OrderStatusPage],
  ['/assistenza/qualcosa-non-va', QualcosaNonVaPage],
  ['/assistenza/primo-ordine', PrimoOrdinePage],
  ['/assistenza/:cat', AssistenzaTopicPage], ['/assistenza/:cat/:slug', AssistenzaTopicPage],
  ['/spedizioni-e-resi', SpedizioniResiPage],
  ['/guide', GuideHubPage], ['/guide/:slug', GuidePage],
  ['/box-di-natale', NatalBoxPage],
  ['/sample-box', SampleBoxPage], ['/sample-box/checkout', SampleBoxCheckoutPage],
  ['/privacy-policy', PrivacyPolicyPage], ['/cookie-policy', CookiePolicyPage],
  ['/termini-e-condizioni', TerminiCondizioniPage],
  ['/test-a', TestPageA], ['/test-b', TestPageB],
];

/** Scarica il chunk della rotta lazy che corrisponde a `pathname` (se c'è). */
export function preloadRoute(pathname) {
  // Le rotte specifiche (es. /assistenza/primo-ordine) vengono prima di quelle
  // con parametri: matchPath le prova nell'ordine della tabella.
  const hit = LAZY_ROUTES.find(([pattern]) => matchPath({ path: pattern, end: true }, pathname));
  return hit ? hit[1].preload().catch(() => {}) : Promise.resolve();
}

/* Fallback neutro: evita il flash di layout mentre arriva il chunk. */
function RouteFallback() {
  return <div style={{ minHeight: '60vh' }} aria-busy="true" />;
}

function ProductLegacyRedirect() {
  const { slug } = useParams();
  const { search } = useLocation();
  return <Navigate to={`/prodotti/${slug}${search}`} replace />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/prodotti/:slug" element={<ProductPage />} />
            {/* Vecchio URL /product/:slug (spesso un UUID, poco SEO): redirect
                lato client verso /prodotti/:slug così i link già in giro
                continuano a funzionare invece di rompersi in un 404. */}
            <Route path="/product/:slug" element={<ProductLegacyRedirect />} />
            <Route path="/collections/:slug" element={<CollectionPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/login" element={<AccountPage />} />
            <Route path="/account/register" element={<AccountPage />} />
            <Route path="/b2b" element={<B2BPage />} />
            <Route path="/storia" element={<AboutPage />} />
            <Route path="/processo-produttivo" element={<ProcessoPage />} />
            <Route path="/territorio" element={<TerritorioPage />} />
            <Route path="/newsletter-subscribe" element={<NewsletterConfirmPage />} />

            <Route path="/contatti" element={<ContattiPage />} />
            <Route path="/faq" element={<FAQPage />} />

            {/* Centro assistenza: contenuti in src/data/assistenza.js */}
            <Route path="/assistenza" element={<AssistenzaPage />} />
            <Route path="/assistenza/dove-e-il-mio-ordine" element={<OrderStatusPage />} />
            <Route path="/assistenza/qualcosa-non-va" element={<QualcosaNonVaPage />} />
            <Route path="/assistenza/primo-ordine" element={<PrimoOrdinePage />} />
            <Route path="/assistenza/:cat" element={<AssistenzaTopicPage />} />
            <Route path="/assistenza/:cat/:slug" element={<AssistenzaTopicPage />} />
            <Route path="/spedizioni-e-resi" element={<SpedizioniResiPage />} />

            {/* Guide: contenuti in src/data/guide.js */}
            <Route path="/guide" element={<GuideHubPage />} />
            <Route path="/guide/:slug" element={<GuidePage />} />

            {/* Configuratore box di Natale (Box Natalizia + Cassetta in Legno) */}
            <Route path="/box-di-natale" element={<NatalBoxPage />} />

            {/* Landing B2B (EN, noindex): box campioni, si paga solo la spedizione */}
            <Route path="/sample-box" element={<SampleBoxPage />} />
            <Route path="/sample-box/checkout" element={<SampleBoxCheckoutPage />} />

            {/* ── Pagine legali ── */}
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />
            <Route path="/termini-e-condizioni" element={<TerminiCondizioniPage />} />
          </Route>

          {/* ── Fullscreen experiences (no header/footer) ── */}
          <Route path="/test-a" element={<TestPageA />} />
          <Route path="/test-b" element={<TestPageB />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
