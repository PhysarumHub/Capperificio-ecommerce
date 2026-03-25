import Hero from '../components/Hero/Hero';
import { ProductsMarquee, RedMarquee } from '../components/Marquee/Marquee';
import FilterTags from '../components/FilterTags/FilterTags';
import SectionHeader from '../components/SectionHeader/SectionHeader';
import ProductSlider from '../components/ProductSlider/ProductSlider';
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
    id: product.id,
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

  // Group variants: if parent is in the list enrich it, else use first child as representative
  const standaloneProducts = rawProducts.filter(p => !p.parentId);
  const variantChildren    = rawProducts.filter(p => !!p.parentId);

  const variantGroups = {};
  variantChildren.forEach(child => {
    if (!variantGroups[child.parentId]) variantGroups[child.parentId] = [];
    variantGroups[child.parentId].push(child);
  });

  const parentIds = new Set(Object.keys(variantGroups));

  const grouped = standaloneProducts.map(p => {
    if (!parentIds.has(p.id)) return p;
    const allOptions = [...new Set(
      variantGroups[p.id].flatMap(c => c.options?.map(o => o.translated?.name || o.name).filter(Boolean) || [])
    )];
    return { ...p, _allVariantOptions: allOptions };
  });

  Object.entries(variantGroups).forEach(([parentId, siblings]) => {
    if (standaloneProducts.some(p => p.id === parentId)) return;
    const allOptions = [...new Set(
      siblings.flatMap(c => c.options?.map(o => o.translated?.name || o.name).filter(Boolean) || [])
    )];
    grouped.push({ ...siblings[0], _allVariantOptions: allOptions });
  });

  const shopwareProducts = grouped.filter(p =>
    !B2B_CATEGORY_ID || !p.categoryTree?.includes(B2B_CATEGORY_ID)
  );

  // If Shopware data is available, split into sections; otherwise use fallbacks
  const hasApiData = !error && !loading && shopwareProducts.length > 0;

  const sliderProducts = hasApiData
    ? shopwareProducts.slice(0, 6).map(mapShopwareProduct)
    : SLIDER_PRODUCTS_FALLBACK;

  const blendProducts = hasApiData
    ? shopwareProducts.slice(6, 9).map(mapShopwareProduct)
    : BLEND_PRODUCTS_FALLBACK;

  return (
    <>
      <Hero image="/images/HERO.jpeg" />
      <FilterTags />

      <SectionHeader label="Bestsellers" title="Hot off the Roaster" count={sliderProducts.length} viewAllHref="/collections/all" />
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>Caricamento prodotti...</div>
      ) : (
        <ProductSlider>
          {sliderProducts.map((p) => (
            <ProductCard key={p.name} {...p} />
          ))}
        </ProductSlider>
      )}

      <CategoryBanners filterImage="/images/CAPPERI.jpg" espressoImage="/images/CAPPERI.jpg" />

      <AboutSection />

      <SectionHeader label="Merch" title="Fits for Drips" count={3} style={{ marginTop: 60 }} />
      <StorySlider />

      <SectionHeader label="Latest Blends" title="Let's Mix Things Up" count={8} viewAllHref="/collections/blend" style={{ marginTop: 60 }} />
      <div className={styles.productGrid}>
        {blendProducts.map((p) => (
          <ProductCard key={p.name} {...p} />
        ))}
      </div>

      <RedMarquee />
      <GuidesEditorial image="/images/CAPPERI.jpg" />

      <SectionHeader label="Dispatch" title="From the Blog" viewAllHref="/" viewAllText="More News →" style={{ marginTop: 60 }} />
      <BlogGrid />
    </>
  );
}
