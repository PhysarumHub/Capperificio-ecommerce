import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import ProductCard from '../components/ProductCard/ProductCard';
import { ProductsMarquee } from '../components/Marquee/Marquee';
import styles from './CollectionPage.module.css';

/* ─── Product catalogue ─── */

const ALL_PRODUCTS = [
  { name: 'Jungle Boogie', slug: 'jungle-boogie', image: '/images/PRODUCTSTILL.jpg', oldPrice: '€20.00', price: '€16.00', collections: ['all', 'filter', 'single-origin'], origin: 'Colombia', process: 'Washed' },
  { name: 'Day For It', slug: 'day-for-it', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', oldPrice: '€20.00', price: '€16.00', collections: ['all', 'espresso', 'single-origin'], origin: 'Brazil', process: 'Natural' },
  { name: 'Basecamp', slug: 'basecamp', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', oldPrice: '€20.00', price: '€16.00', collections: ['all', 'filter', 'single-origin'], origin: 'Ethiopia', process: 'Washed' },
  { name: 'Copacabana', slug: 'copacabana', image: '/images/PRODUCTSTILL.jpg', price: '€18.00', collections: ['all', 'espresso', 'single-origin'], origin: 'Brazil', process: 'Natural' },
  { name: 'Highland Reserve', slug: 'highland-reserve', image: '/images/PRODUCTSTILL.jpg', price: '€22.00', collections: ['all', 'filter', 'single-origin'], origin: 'Kenya', process: 'Washed' },
  { name: 'Slow Phase', slug: 'slow-phase', image: '/images/PRODUCTSTILL.jpg', price: '€19.00', collections: ['all', 'espresso', 'single-origin'], origin: 'Colombia', process: 'Natural' },
  { name: 'Sweet Velvet', slug: 'sweet-velvet', image: '/images/PRODUCTSTILL.jpg', price: '€25.00', collections: ['all', 'espresso', 'single-origin'], origin: 'Ethiopia', process: 'Natural' },
  { name: 'Morning Ritual', slug: 'morning-ritual', image: '/images/PRODUCTSTILL.jpg', price: '€20.00', collections: ['all', 'filter', 'single-origin'], origin: 'Kenya', process: 'Washed' },
  { name: 'Decaf', slug: 'decaf', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', badgeColor: 'blue', stars: 5, price: '€18.00', collections: ['all', 'espresso', 'blend'], origin: null, process: null },
  { name: "Half Caff'd", slug: 'half-caffd', image: '/images/PRODUCTSTILL.jpg', stars: 5, oldPrice: '€20.00', price: '€16.00', collections: ['all', 'espresso', 'blend'], origin: null, process: null },
  { name: 'Daily Grind', slug: 'daily-grind', image: '/images/PRODUCTSTILL.jpg', stars: 5, price: '€19.00', collections: ['all', 'filter', 'blend'], origin: null, process: null },
  { name: 'Rooftop Blend', slug: 'rooftop-blend', image: '/images/PRODUCTSTILL.jpg', stars: 5, price: '€21.00', collections: ['all', 'espresso', 'blend'], origin: null, process: null },
  { name: 'Golden Hour', slug: 'golden-hour', image: '/images/PRODUCTSTILL.jpg', price: '€23.00', collections: ['all', 'filter', 'single-origin'], origin: 'Colombia', process: 'Washed' },
  { name: 'Night Owl', slug: 'night-owl', image: '/images/PRODUCTSTILL.jpg', badge: 'New', price: '€24.00', collections: ['all', 'espresso', 'single-origin'], origin: 'Ethiopia', process: 'Natural' },
  { name: 'Dusk Till Dawn', slug: 'dusk-till-dawn', image: '/images/PRODUCTSTILL.jpg', price: '€17.00', collections: ['all', 'filter', 'blend'], origin: null, process: null },
  { name: 'Sunday Session', slug: 'sunday-session', image: '/images/PRODUCTSTILL.jpg', badge: 'New', price: '€20.00', collections: ['all', 'filter', 'single-origin'], origin: 'Brazil', process: 'Natural' },
];

/* ─── Collection metadata ─── */

const COLLECTIONS = {
  all: {
    title: 'All Coffee',
    description: 'Our entire range of honestly good coffee — single origins, blends, and everything in between.',
    label: 'Shop',
  },
  espresso: {
    title: 'Espresso',
    description: 'Rich, bold, and built for the machine. Coffees roasted to shine as espresso.',
    label: 'Collection',
  },
  filter: {
    title: 'Filter',
    description: 'Light and nuanced roasts designed for pour-over, drip, and batch brew.',
    label: 'Collection',
  },
  'single-origin': {
    title: 'Single Origin',
    description: 'Unique lots from individual farms and regions — each one a snapshot of place and process.',
    label: 'Origin',
  },
  blend: {
    title: 'Blend',
    description: 'Our signature blends, crafted for balance, consistency, and a vibe that never gets old.',
    label: 'Collection',
  },
};

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'name-asc', label: 'A — Z' },
  { value: 'name-desc', label: 'Z — A' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

function parsePrice(str) {
  return parseFloat(str.replace(/[^0-9.]/g, ''));
}

/* ─── Sub-filter tags per collection ─── */

function getSubFilters(collectionSlug) {
  if (collectionSlug === 'all') return ['All', 'Espresso', 'Filter', 'Single Origin', 'Blend'];
  if (collectionSlug === 'single-origin') return ['All', 'Brazil', 'Colombia', 'Ethiopia', 'Kenya'];
  if (collectionSlug === 'blend') return ['All', 'Espresso', 'Filter'];
  return null;
}

function matchesSubFilter(product, collectionSlug, subFilter) {
  if (subFilter === 'All') return true;

  if (collectionSlug === 'all') {
    const mapped = subFilter.toLowerCase().replace(/\s+/g, '-');
    return product.collections.includes(mapped);
  }

  if (collectionSlug === 'single-origin') {
    return product.origin === subFilter;
  }

  if (collectionSlug === 'blend') {
    const mapped = subFilter.toLowerCase();
    return product.collections.includes(mapped);
  }

  return true;
}

/* ─── Component ─── */

export default function CollectionPage() {
  const { slug } = useParams();
  const collection = COLLECTIONS[slug] || COLLECTIONS.all;
  const collectionSlug = COLLECTIONS[slug] ? slug : 'all';

  const [sort, setSort] = useState('featured');
  const [activeFilter, setActiveFilter] = useState('All');

  const subFilters = getSubFilters(collectionSlug);

  const products = useMemo(() => {
    let filtered = ALL_PRODUCTS.filter((p) => p.collections.includes(collectionSlug));

    if (activeFilter !== 'All') {
      filtered = filtered.filter((p) => matchesSubFilter(p, collectionSlug, activeFilter));
    }

    if (sort === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name-desc') filtered.sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === 'price-asc') filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else if (sort === 'price-desc') filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));

    return filtered;
  }, [collectionSlug, sort, activeFilter]);

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
          {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
      </section>

      {/* Sub-filter tags */}
      {subFilters && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, padding: '32px 60px 24px' }}>
          {subFilters.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 'var(--text-2xl)',
                color: activeFilter === tag ? 'var(--color-white)' : 'var(--color-red)',
                background: activeFilter === tag ? 'var(--color-red)' : 'transparent',
                border: '1.5px solid var(--color-red)',
                borderRadius: 'var(--radius-pill)',
                padding: '8px 24px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background .2s, color .2s',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <span className={styles.resultCount}>
          {products.length} product{products.length !== 1 ? 's' : ''}
        </span>
        <div className={styles.sortWrap}>
          <span className={styles.sortLabel}>Sort by</span>
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

      {/* Product grid */}
      {products.length > 0 ? (
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
        <div className={styles.empty}>No products found in this collection.</div>
      )}

      <ProductsMarquee />
    </>
  );
}
