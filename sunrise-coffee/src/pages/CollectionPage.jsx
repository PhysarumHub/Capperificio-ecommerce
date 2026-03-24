import { useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';

const B2B_CATEGORY_ID = import.meta.env.VITE_B2B_CATEGORY_ID || null;
import ProductCard from '../components/ProductCard/ProductCard';
import ShopFilter from '../components/ShopFilter/ShopFilter';
import { ProductsMarquee } from '../components/Marquee/Marquee';
import { useProducts } from '../hooks/useProducts';
import { formatPrice } from '../lib/utils/price';
import { getProductImage, getProductSlug } from '../lib/utils/image';
import { isShopwareConfigured } from '../lib/shopware-client';
import styles from './CollectionPage.module.css';

/* ─── Catalogo fallback (usato quando Shopware non è connesso) ─── */

const ALL_PRODUCTS_FALLBACK = [
  {
    name: 'Cappero di Racale al Sale — Lilliput',
    slug: 'cappero-sale-lilliput',
    image: '/images/PRODUCTSTILL.jpg',
    price: '€9.90',
    collections: ['all', 'cappero'],
    tipo: 'Cappero', formato: 'Lilliput', conservazione: 'Sotto sale',
  },
  {
    name: 'Cappero di Racale al Sale — Lacrimella',
    slug: 'cappero-sale-lacrimella',
    image: '/images/PRODUCTSTILL.jpg',
    price: '€9.90',
    collections: ['all', 'cappero'],
    tipo: 'Cappero', formato: 'Lacrimella', conservazione: 'Sotto sale',
  },
  {
    name: "Cappero di Racale al Sale — Occhio di pernice",
    slug: 'cappero-sale-occhio',
    image: '/images/PRODUCTSTILL.jpg',
    price: '€10.90',
    collections: ['all', 'cappero'],
    tipo: 'Cappero', formato: 'Occhio di pernice', conservazione: 'Sotto sale',
  },
  {
    name: 'Cappero di Racale al Sale — Capperone',
    slug: 'cappero-sale-capperone',
    image: '/images/PRODUCTSTILL.jpg',
    price: '€11.90',
    collections: ['all', 'cappero'],
    tipo: 'Cappero', formato: 'Capperone', conservazione: 'Sotto sale',
  },
  {
    name: "Cappero di Racale all'Aceto — Lilliput",
    slug: 'cappero-aceto-lilliput',
    image: '/images/PRODUCTSTILL.jpg',
    badge: 'Sale',
    oldPrice: '€10.90',
    price: '€9.90',
    collections: ['all', 'cappero'],
    tipo: 'Cappero', formato: 'Lilliput', conservazione: 'Sotto aceto di vino',
  },
  {
    name: "Cappero di Racale all'Aceto — Lacrimella",
    slug: 'cappero-aceto-lacrimella',
    image: '/images/PRODUCTSTILL.jpg',
    price: '€9.90',
    collections: ['all', 'cappero'],
    tipo: 'Cappero', formato: 'Lacrimella', conservazione: 'Sotto aceto di vino',
  },
  {
    name: "Cappero di Racale all'Aceto — Capperone",
    slug: 'cappero-aceto-capperone',
    image: '/images/PRODUCTSTILL.jpg',
    price: '€11.90',
    collections: ['all', 'cappero'],
    tipo: 'Cappero', formato: 'Capperone', conservazione: 'Sotto aceto di vino',
  },
  {
    name: "Cucunci all'Aceto di Vino",
    slug: 'cucunci-aceto-vino',
    image: '/images/PRODUCTSTILL.jpg',
    price: '€11.90',
    collections: ['all', 'cucunci'],
    tipo: 'Cucunci', formato: null, conservazione: 'Sotto aceto di vino',
  },
  {
    name: "Cucunci all'Aceto di Mele",
    slug: 'cucunci-aceto-mele',
    image: '/images/PRODUCTSTILL.jpg',
    price: '€12.50',
    collections: ['all', 'cucunci'],
    tipo: 'Cucunci', formato: null, conservazione: 'Sotto aceto di mele',
  },
  {
    name: "Foglie di Cappero all'Aceto",
    slug: 'foglie-cappero-aceto',
    image: '/images/PRODUCTSTILL.jpg',
    badge: 'New',
    price: '€8.90',
    collections: ['all', 'foglie'],
    tipo: 'Foglie', formato: null, conservazione: 'Sotto aceto di vino',
  },
  {
    name: 'Polvere di Cappero di Racale',
    slug: 'polvere-cappero',
    image: '/images/PRODUCTSTILL.jpg',
    badge: 'New',
    price: '€14.90',
    collections: ['all', 'polvere'],
    tipo: 'Polvere', formato: null, conservazione: null,
  },
  {
    name: 'Cofanetto Degustazione',
    slug: 'cofanetto-degustazione',
    image: '/images/PRODUCTSTILL.jpg',
    badge: 'New',
    price: '€34.90',
    collections: ['all'],
    tipo: 'Cappero', formato: null, conservazione: null,
  },
];

/* ─── Metadati collezioni ─── */

const COLLECTIONS = {
  all: {
    title: 'Tutti i Prodotti',
    description: "L'intera gamma dei nostri capperi di Racale — dalle varietà classiche alle specialità artigianali.",
    label: 'Shop',
  },
  cappero: {
    title: 'Capperi',
    description: 'Capperi di Racale raccolti a mano e conservati al sale marino o in aceto artigianale.',
    label: 'Categoria',
  },
  cucunci: {
    title: 'Cucunci',
    description: 'I frutti del cappero, dalla polpa carnosa e dal sapore intenso e profumato.',
    label: 'Categoria',
  },
  foglie: {
    title: 'Foglie di Cappero',
    description: 'Foglie tenere di cappero conservate in aceto, perfette per antipasti e condimenti.',
    label: 'Categoria',
  },
  polvere: {
    title: 'Polvere di Cappero',
    description: 'Capperi di Racale essiccati e macinati: un condimento unico, intenso e versatile.',
    label: 'Specialità',
  },
};

const SORT_OPTIONS = [
  { value: 'featured',   label: 'In evidenza' },
  { value: 'name-asc',   label: 'A — Z' },
  { value: 'name-desc',  label: 'Z — A' },
  { value: 'price-asc',  label: 'Prezzo: crescente' },
  { value: 'price-desc', label: 'Prezzo: decrescente' },
];

const EMPTY_FILTERS = { tipo: [], formato: [], conservazione: [], priceRange: '' };

function parsePrice(str) {
  return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0;
}

/* ─── Filtro prezzo ─── */

function matchesPriceRange(product, range) {
  if (!range) return true;
  const p = parsePrice(product.price);
  if (range === 'Fino a €10')  return p < 10;
  if (range === '€10 – €13')   return p >= 10 && p <= 13;
  if (range === 'Oltre €13')   return p > 13;
  return true;
}

/* ─── Filtro proprietà ─── */

function matchesFilters(product, filters) {
  if (filters.tipo.length          && !filters.tipo.includes(product.tipo))                return false;
  if (filters.formato.length       && product.formato && !filters.formato.includes(product.formato)) return false;
  if (filters.conservazione.length && !filters.conservazione.includes(product.conservazione)) return false;
  if (!matchesPriceRange(product, filters.priceRange))                                      return false;
  return true;
}

/* ─── Sort Shopware API ─── */

function getSortCriteria(sortValue) {
  switch (sortValue) {
    case 'name-asc':   return [{ field: 'name',  order: 'ASC'  }];
    case 'name-desc':  return [{ field: 'name',  order: 'DESC' }];
    case 'price-asc':  return [{ field: 'price', order: 'ASC'  }];
    case 'price-desc': return [{ field: 'price', order: 'DESC' }];
    default:           return [];
  }
}

/* ─── Mapping prodotto Shopware ─── */

function mapShopwareProduct(product) {
  const price     = product.calculatedPrice || product.price?.[0];
  const listPrice = price?.listPrice;

  const props          = product.properties || [];
  const tipo           = props.find((p) => p.group?.name === 'Tipo')?.name          || null;
  const formato        = props.find((p) => p.group?.name === 'Formato')?.name       || null;
  const conservazione  = props.find((p) => p.group?.name === 'Conservazione')?.name || null;

  return {
    name:           product.translated?.name || product.name,
    slug:           getProductSlug(product),
    image:          getProductImage(product),
    price:          formatPrice(price?.unitPrice),
    oldPrice:       listPrice?.price ? formatPrice(listPrice.price) : undefined,
    badge:          listPrice?.price ? 'Sale' : undefined,
    collections:    ['all'],
    tipo,
    formato,
    conservazione,
  };
}

/* ─── Componente ─── */

export default function CollectionPage() {
  const { slug }          = useParams();
  const collection        = COLLECTIONS[slug] || COLLECTIONS.all;
  const collectionSlug    = COLLECTIONS[slug] ? slug : 'all';

  const [sort, setSort]         = useState('featured');
  const [filters, setFilters]   = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const apiSort    = getSortCriteria(sort);
  const apiFilters = B2B_CATEGORY_ID
    ? [{ type: 'not', operator: 'AND', queries: [{ type: 'equals', field: 'categoryTree', value: B2B_CATEGORY_ID }] }]
    : [];

  const { products: shopwareProducts, loading, error } = useProducts({
    limit:   50,
    sort:    apiSort,
    filters: apiFilters,
  });

  const useApi = isShopwareConfigured() && !error && shopwareProducts.length > 0;

  const products = useMemo(() => {
    let list;

    if (useApi) {
      list = shopwareProducts.map(mapShopwareProduct);
    } else {
      list = ALL_PRODUCTS_FALLBACK.filter((p) => p.collections.includes(collectionSlug));
    }

    // Applica filtri sidebar (sia per API che per fallback)
    list = list.filter((p) => matchesFilters(p, filters));

    // Ordinamento
    if (sort === 'name-asc')   list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name-desc')  list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === 'price-asc')  list = [...list].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else if (sort === 'price-desc') list = [...list].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));

    return list;
  }, [useApi, shopwareProducts, collectionSlug, sort, filters]);

  const activeFilterCount =
    (filters.tipo?.length || 0) +
    (filters.formato?.length || 0) +
    (filters.conservazione?.length || 0) +
    (filters.priceRange ? 1 : 0);

  return (
    <>
      {/* Banner */}
      <section className={styles.banner}>
        <div className={styles.bannerLabel}>
          <span className={styles.bannerDot} /> {collection.label}
        </div>
        <h1 className={styles.bannerTitle}>{collection.title}</h1>
        <p className={styles.bannerDesc}>{collection.description}</p>
        <p className={styles.bannerCount}>
          {loading ? '...' : `${products.length} prodott${products.length !== 1 ? 'i' : 'o'}`}
        </p>
      </section>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Pulsante filtri (visibile su tutti i dispositivi) */}
        <button
          type="button"
          className={styles.filterToggle}
          onClick={() => setFilterOpen(true)}
        >
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden="true">
            <path d="M0 1h14M3 6h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Filtra
          {activeFilterCount > 0 && (
            <span className={styles.filterBadge}>{activeFilterCount}</span>
          )}
        </button>

        <span className={styles.resultCount}>
          {loading ? '...' : `${products.length} prodott${products.length !== 1 ? 'i' : 'o'}`}
        </span>

        <div className={styles.sortWrap}>
          <span className={styles.sortLabel}>Ordina</span>
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Layout: sidebar + griglia */}
      <div className={styles.layout}>
        <ShopFilter
          filters={filters}
          onChange={setFilters}
          isMobileOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
        />

        <main className={styles.main}>
          {loading ? (
            <div className={styles.loading}>Caricamento prodotti...</div>
          ) : products.length > 0 ? (
            <div className={`${styles.grid} ${products.length <= 3 ? styles.gridThree : ''}`}>
              {products.map((p) => (
                <ProductCard
                  key={p.slug}
                  name={p.name}
                  slug={p.slug}
                  image={p.image}
                  price={p.price}
                  oldPrice={p.oldPrice}
                  badge={p.badge}
                  badgeColor={p.badgeColor}
                  stars={p.stars}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              Nessun prodotto trovato.
              {activeFilterCount > 0 && (
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

      <ProductsMarquee />
    </>
  );
}
