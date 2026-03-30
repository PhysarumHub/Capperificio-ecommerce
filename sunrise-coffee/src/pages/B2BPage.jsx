import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerContext } from '../context/ShopwareContext';
import { useSEO } from '../hooks/useSEO';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard/ProductCard';
import ShopFilter from '../components/ShopFilter/ShopFilter';
import { formatPrice } from '../lib/utils/price';
import { getProductImage, getProductSlug } from '../lib/utils/image';
import { isShopwareConfigured } from '../lib/shopware-client';
import styles from './B2BPage.module.css';

/* ─── ID categoria B2B (impostato dopo aver eseguito setup-b2b.py) ─── */
const B2B_CATEGORY_ID  = import.meta.env.VITE_B2B_CATEGORY_ID  || null;
const B2B_GROUP_NAME   = import.meta.env.VITE_B2B_GROUP_NAME    || 'B2B';

/* ─── Prodotti B2B fallback (quando Shopware non è connesso) ─── */
const B2B_FALLBACK = [
  { name: 'Cappero di Racale al Sale — 500g',  slug: 'b2b-sale-500g', image: '/images/PRODUCTSTILL.jpg', price: '€7.90' },
  { name: 'Cappero di Racale al Sale — 1kg',   slug: 'b2b-sale-1kg',  image: '/images/PRODUCTSTILL.jpg', price: '€13.90' },
  { name: 'Cappero di Racale al Sale — 3kg',   slug: 'b2b-sale-3kg',  image: '/images/PRODUCTSTILL.jpg', price: '€36.90' },
  { name: 'Cappero di Racale al Sale — 5kg',   slug: 'b2b-sale-5kg',  image: '/images/PRODUCTSTILL.jpg', badge: 'B2B', price: '€55.90' },
  { name: "Cappero all'Aceto — 500g",          slug: 'b2b-ace-500g',  image: '/images/PRODUCTSTILL.jpg', price: '€7.90' },
  { name: "Cappero all'Aceto — 1kg",           slug: 'b2b-ace-1kg',   image: '/images/PRODUCTSTILL.jpg', price: '€13.90' },
  { name: "Cappero all'Aceto — 3kg",           slug: 'b2b-ace-3kg',   image: '/images/PRODUCTSTILL.jpg', price: '€36.90' },
  { name: 'Mix Capperi Industriale — 1kg',     slug: 'b2b-mix-1kg',   image: '/images/PRODUCTSTILL.jpg', price: '€14.90' },
  { name: 'Mix Capperi Industriale — 3kg',     slug: 'b2b-mix-3kg',   image: '/images/PRODUCTSTILL.jpg', price: '€38.90' },
  { name: 'Mix Capperi Industriale — 5kg',     slug: 'b2b-mix-5kg',   image: '/images/PRODUCTSTILL.jpg', badge: 'B2B', price: '€59.90' },
];

function mapB2BProduct(p) {
  const price     = p.calculatedPrice || p.price?.[0];
  const listPrice = price?.listPrice;
  return {
    id:       p.id,
    name:     p.translated?.name || p.name,
    slug:     getProductSlug(p),
    image:    getProductImage(p),
    price:    formatPrice(price?.unitPrice),
    oldPrice: listPrice?.price ? formatPrice(listPrice.price) : undefined,
    badge:    listPrice?.price ? 'Sale' : undefined,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   ROUTER PRINCIPALE
══════════════════════════════════════════════════════════════════════ */

export default function B2BPage() {
  useSEO({
    title: 'Area B2B — Per Professionisti',
    description: 'Prezzi netti dedicati, formati industriali e ordini flessibili per ristoratori, grossisti e rivenditori di capperi artigianali.',
    path: '/b2b',
    noindex: true,
  });

  const { customer, isLoggedIn, loading } = useCustomerContext();

  if (loading) return null;

  if (!isLoggedIn)                           return <B2BLanding />;
  if (customer?.group?.name !== B2B_GROUP_NAME) return <B2BPending customer={customer} />;
  return <B2BCatalog customer={customer} />;
}

/* ══════════════════════════════════════════════════════════════════════
   STATO A — Non loggato: landing + form login
══════════════════════════════════════════════════════════════════════ */

function B2BLanding() {
  const { login, loading, error } = useCustomerContext();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [formError, setFormError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) { setFormError('Inserisci email e password.'); return; }
    try {
      await login(email, password);
    } catch {
      setFormError('Credenziali non valide. Riprova.');
    }
  };

  return (
    <div className={styles.landingRoot}>
      {/* Hero */}
      <div className={styles.landingHero}>
        <span className={styles.tag}>
          <span className={styles.tagDot} /> Area Riservata
        </span>
        <h1 className={styles.heroTitle}>
          Capperificio<br />
          <em>per i professionisti</em>
        </h1>
        <p className={styles.heroDesc}>
          Prezzi netti dedicati, formati industriali, ordini flessibili.<br />
          Accesso riservato a ristoratori, grossisti e rivenditori.
        </p>

        <ul className={styles.benefits}>
          {[
            ['💰', 'Prezzi netti IVA esclusa'],
            ['📦', 'Formati da 500g a 5kg'],
            ['🚀', 'Spedizione prioritaria'],
            ['📄', 'Fatturazione B2B'],
          ].map(([icon, text]) => (
            <li key={text} className={styles.benefit}>
              <span>{icon}</span> {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Form login */}
      <div className={styles.landingForm}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Accedi all'area B2B</h2>
          <p className={styles.formSub}>
            Usa le credenziali del tuo account rivenditore.
          </p>

          {(formError || error) && (
            <p className={styles.formError}>⚠ {formError || error}</p>
          )}

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tua@azienda.com"
                required
                autoComplete="email"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Accesso in corso…' : 'Accedi'}
            </button>
          </form>

          <div className={styles.formDivider} />

          <p className={styles.formHint}>
            Non hai ancora un account rivenditore?{' '}
            <a
              href="mailto:info@capperificio.it?subject=Richiesta accesso B2B"
              className={styles.link}
            >
              Contattaci
            </a>{' '}
            per richiedere l'accesso.
          </p>

          <p className={styles.formHint}>
            Sei un cliente privato?{' '}
            <Link to="/collections/all" className={styles.link}>
              Vai al negozio →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STATO B — Loggato ma non ancora B2B: in attesa di approvazione
══════════════════════════════════════════════════════════════════════ */

function B2BPending({ customer }) {
  return (
    <div className={styles.pendingRoot}>
      <div className={styles.pendingCard}>
        <div className={styles.pendingIcon}>⏳</div>
        <h2 className={styles.pendingTitle}>Richiesta in valutazione</h2>
        <p className={styles.pendingDesc}>
          Ciao <strong>{customer?.firstName}</strong>, il tuo account è registrato
          ma non è ancora abilitato per l'accesso B2B.
        </p>
        <p className={styles.pendingDesc}>
          Il nostro team sta verificando la tua richiesta.
          Riceverai una conferma via email entro 1–2 giorni lavorativi.
        </p>

        <div className={styles.pendingContact}>
          <p className={styles.pendingContactTitle}>Hai bisogno di assistenza?</p>
          <a
            href="mailto:info@capperificio.it?subject=Accesso B2B — Urgente"
            className={styles.btnOutline}
          >
            Scrivi a info@capperificio.it
          </a>
        </div>

        <Link to="/collections/all" className={styles.pendingBack}>
          ← Torna al negozio
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STATO C — Loggato + gruppo B2B: catalogo ingrosso
══════════════════════════════════════════════════════════════════════ */

const EMPTY_FILTERS = { tipo: [], formato: [], conservazione: [], priceRange: '' };

function parsePrice(str) {
  return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0;
}

function matchesB2BFilters(product, filters) {
  if (filters.tipo.length          && !filters.tipo.includes(product.tipo))                return false;
  if (filters.formato.length       && product.formato && !filters.formato.includes(product.formato)) return false;
  if (filters.conservazione.length && !filters.conservazione.includes(product.conservazione)) return false;
  if (filters.priceRange) {
    const p = parsePrice(product.price);
    if (filters.priceRange === 'Fino a €15'  && p >= 15)             return false;
    if (filters.priceRange === '€15 – €40'   && (p < 15 || p > 40)) return false;
    if (filters.priceRange === 'Oltre €40'   && p <= 40)             return false;
  }
  return true;
}

function B2BCatalog({ customer }) {
  const [filters, setFilters]       = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const { products: apiProducts, loading, error } = useProducts({
    limit:      50,
    categoryId: B2B_CATEGORY_ID || undefined,
  });

  // Se Shopware è connesso usa SOLO i prodotti della categoria B2B — niente fallback misto
  const shopwareActive = isShopwareConfigured() && !error;
  const allProducts = shopwareActive
    ? apiProducts.map(mapB2BProduct)
    : B2B_FALLBACK;
  const products  = allProducts.filter((p) => matchesB2BFilters(p, filters));

  const activeCount =
    (filters.tipo?.length || 0) +
    (filters.formato?.length || 0) +
    (filters.conservazione?.length || 0) +
    (filters.priceRange ? 1 : 0);

  return (
    <>
      {/* Banner */}
      <section className={styles.banner}>
        <div className={styles.bannerLabel}>
          <span className={styles.bannerDot} /> Area Riservata B2B
        </div>
        <h1 className={styles.bannerTitle}>Catalogo Ingrosso</h1>
        <p className={styles.bannerDesc}>
          Benvenuto, <strong>{customer?.firstName} {customer?.lastName}</strong>.
          Tutti i prezzi sono IVA esclusa.
        </p>
        <div className={styles.bannerMeta}>
          <span className={styles.netBadge}>Prezzi netti</span>
          <span className={styles.bannerCount}>
            {loading ? '…' : `${products.length} prodott${products.length !== 1 ? 'i' : 'o'}`}
          </span>
        </div>
      </section>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.filterToggle}
          onClick={() => setFilterOpen(true)}
        >
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden="true">
            <path d="M0 1h14M3 6h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Filtra
          {activeCount > 0 && <span className={styles.filterBadge}>{activeCount}</span>}
        </button>
      </div>

      {/* Layout sidebar + griglia */}
      <div className={styles.layout}>
        <ShopFilter
          filters={filters}
          onChange={setFilters}
          isMobileOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
        />

        <main className={styles.main}>
          {loading ? (
            <div className={styles.loading}>Caricamento catalogo B2B…</div>
          ) : products.length > 0 ? (
            <div className={styles.grid}>
              {products.map((p) => (
                <ProductCard
                  key={p.slug}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  image={p.image}
                  price={p.price}
                  oldPrice={p.oldPrice}
                  badge={p.badge}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              Nessun prodotto trovato.
              {activeCount > 0 && (
                <button
                  type="button"
                  className={styles.emptyReset}
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Rimuovi i filtri
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer B2B */}
      <div className={styles.b2bFooter}>
        <p>
          Per ordini speciali o preventivi personalizzati:{' '}
          <a href="mailto:b2b@capperificio.it" className={styles.link}>
            b2b@capperificio.it
          </a>
        </p>
        <Link to="/account" className={styles.link}>Il tuo account →</Link>
      </div>
    </>
  );
}
