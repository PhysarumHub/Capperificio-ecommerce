import Hero from '../components/Hero/Hero';
import { ProductsMarquee, RedMarquee } from '../components/Marquee/Marquee';
import FilterTags from '../components/FilterTags/FilterTags';
import SectionHeader from '../components/SectionHeader/SectionHeader';
import ProductCard from '../components/ProductCard/ProductCard';
import CategoryBanners from '../components/CategoryBanner/CategoryBanner';
import AboutSection from '../components/AboutSection/AboutSection';
import GuidesEditorial from '../components/GuidesEditorial/GuidesEditorial';
import StorySlider from '../components/StorySlider/StorySlider';
import BlogGrid from '../components/BlogGrid/BlogGrid';
import { useProducts } from '../hooks/useProducts';
import { formatPrice } from '../lib/utils/price';
import { getProductImage, getProductSlug } from '../lib/utils/image';
import styles from './HomePage.module.css';

const B2B_CATEGORY_ID = import.meta.env.VITE_B2B_CATEGORY_ID || null;

/* ─── Fallback data (used when Shopware is not connected) ─── */

const SLIDER_PRODUCTS_FALLBACK = [
  { name: 'Jungle Boogie', image: '/images/PRODUCTSTILL.jpg', oldPrice: '€20.00', price: '€16.00', options: ['250g', '500g', '1kg'] },
  { name: 'Day For It', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', oldPrice: '€20.00', price: '€16.00', options: ['250g', '500g'] },
  { name: 'Basecamp', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', oldPrice: '€20.00', price: '€16.00', options: ['250g', '500g', '1kg'] },
  { name: 'Copacabana', image: '/images/PRODUCTSTILL.jpg', price: '€18.00', options: ['250g', '500g'] },
  { name: 'Highland Reserve', image: '/images/PRODUCTSTILL.jpg', price: '€22.00', options: ['250g', '500g', '1kg'] },
  { name: 'Slow Phase', image: '/images/PRODUCTSTILL.jpg', price: '€19.00', options: ['250g', '500g'] },
];

const BLEND_PRODUCTS_FALLBACK = [
  { name: 'Decaf', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', badgeColor: 'blue', stars: 5, price: '€18.00', options: ['250g', '500g'] },
  { name: "Half Caff'd", image: '/images/PRODUCTSTILL.jpg', stars: 5, oldPrice: '€20.00', price: '€16.00', options: ['250g', '500g', '1kg'] },
  { name: 'Daily Grind', image: '/images/PRODUCTSTILL.jpg', stars: 5, price: '€19.00', options: ['250g', '500g'] },
];

const MERCH_PRODUCTS_FALLBACK = [
  { name: 'Sunrise Tee', image: '/images/PRODUCTSTILL.jpg', price: '$40.00' },
  { name: 'Honestly Good Tote', image: '/images/PRODUCTSTILL.jpg', price: '$40.00' },
  { name: 'Sunrise Cap', image: '/images/PRODUCTSTILL.jpg', price: '$40.00' },
];

function groupVariants(rawList) {
  const standalone = rawList.filter(p => !p.parentId);
  const children   = rawList.filter(p => !!p.parentId);

  const groups = {};
  children.forEach(child => {
    if (!groups[child.parentId]) groups[child.parentId] = [];
    groups[child.parentId].push(child);
  });

  const parentIds = new Set(Object.keys(groups));

  const result = standalone.map(p => {
    if (!parentIds.has(p.id)) return p;
    const allOptions = [...new Set(
      groups[p.id].flatMap(c => c.options?.map(o => o.translated?.name || o.name).filter(Boolean) || [])
    )];
    return { ...p, _allVariantOptions: allOptions, _firstVariantId: groups[p.id][0]?.id };
  });

  Object.entries(groups).forEach(([parentId, siblings]) => {
    if (standalone.some(p => p.id === parentId)) return;
    const allOptions = [...new Set(
      siblings.flatMap(c => c.options?.map(o => o.translated?.name || o.name).filter(Boolean) || [])
    )];
    result.push({ ...siblings[0], _allVariantOptions: allOptions });
  });

  return result;
}

function mapShopwareProduct(product) {
  const price = product.calculatedPrice || product.price?.[0];
  const listPrice = price?.listPrice;

  // configuratorSettings = tutte le varianti del prodotto padre (es. 250g, 500g, 1kg)
  // options = variante specifica di un prodotto figlio
  const fromConfigurator = product.configuratorSettings
    ?.map((s) => s.option?.translated?.name || s.option?.name)
    .filter(Boolean);
  const fromOptions = product.options
    ?.map((o) => o.translated?.name || o.name)
    .filter(Boolean);
  const options = product._allVariantOptions?.length
    ? product._allVariantOptions
    : fromConfigurator?.length ? [...new Set(fromConfigurator)] : (fromOptions?.length ? fromOptions : undefined);

  return {
    id: product._firstVariantId || product.id,
    name: product.translated?.name || product.name,
    slug: getProductSlug(product),
    image: getProductImage(product),
    price: formatPrice(price?.unitPrice),
    oldPrice: listPrice?.price ? formatPrice(listPrice.price) : undefined,
    badge: listPrice?.price ? 'Sale' : undefined,
    options,
  };
}

export default function HomePage() {
  // Fetch more products to account for B2B ones being filtered out client-side
  const { products: rawProducts, loading, error } = useProducts({ limit: 24 });

  // Fetch products tagged "Materia prima" for the blends section
  const { products: rawMateriaPrima } = useProducts({
    limit: 9,
    filters: [{ type: 'equals', field: 'tags.name', value: 'Materia prima' }],
  });

  const shopwareProducts = groupVariants(rawProducts).filter(p =>
    !B2B_CATEGORY_ID || !p.categoryTree?.includes(B2B_CATEGORY_ID)
  );

  // If Shopware data is available, split into sections; otherwise use fallbacks
  const hasApiData = !error && !loading && shopwareProducts.length > 0;

  const sliderProducts = hasApiData
    ? shopwareProducts.slice(0, 6).map(mapShopwareProduct)
    : SLIDER_PRODUCTS_FALLBACK;

  const blendProducts = hasApiData && rawMateriaPrima.length > 0
    ? groupVariants(rawMateriaPrima).slice(0, 3).map(mapShopwareProduct)
    : BLEND_PRODUCTS_FALLBACK;

  return (
    <>
      <Hero image="/images/HERO.jpeg" />
      <FilterTags />

      <SectionHeader label="I più amati" title="I nostri Bestseller" count={sliderProducts.length} viewAllHref="/collections/all" />
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>Caricamento prodotti...</div>
      ) : (
        <div className={styles.productGrid}>
          {sliderProducts.map((p) => (
            <ProductCard key={p.name} {...p} />
          ))}
        </div>
      )}

      <div style={{ background: 'var(--color-light)' }}>
        <CategoryBanners filterImage="/images/CAPPERI.jpg" espressoImage="/images/CAPPERI.jpg" />
      </div>

      <AboutSection />

      <div style={{ background: 'var(--color-light)', paddingTop: 60 }}>
        <SectionHeader label="La nostra storia" title="Dal campo alla tavola" count={3} />
        <StorySlider />
      </div>

      <SectionHeader label="Materia prima" title="Le nostre specialità" count={8} viewAllHref="/collections/all" style={{ marginTop: 60 }} />
      <div className={styles.productGrid}>
        {blendProducts.map((p) => (
          <ProductCard key={p.name} {...p} />
        ))}
      </div>

      <RedMarquee />
      <GuidesEditorial image="/images/CAPPERI.jpg" />

      <SectionHeader label="Dal blog" title="Storie e ricette" viewAllHref="/" viewAllText="Tutti gli articoli →" style={{ marginTop: 60 }} />
      <BlogGrid />
    </>
  );
}
