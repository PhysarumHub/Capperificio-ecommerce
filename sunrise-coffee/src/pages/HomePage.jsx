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

/* ─── Fallback data (used when Shopware is not connected) ─── */

const SLIDER_PRODUCTS_FALLBACK = [
  { name: 'Jungle Boogie', image: '/images/PRODUCTSTILL.jpg', oldPrice: '€20.00', price: '€16.00' },
  { name: 'Day For It', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', oldPrice: '€20.00', price: '€16.00' },
  { name: 'Basecamp', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', oldPrice: '€20.00', price: '€16.00' },
  { name: 'Copacabana', image: '/images/PRODUCTSTILL.jpg', price: '€18.00' },
  { name: 'Highland Reserve', image: '/images/PRODUCTSTILL.jpg', price: '€22.00' },
  { name: 'Slow Phase', image: '/images/PRODUCTSTILL.jpg', price: '€19.00' },
];

const BLEND_PRODUCTS_FALLBACK = [
  { name: 'Decaf', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', badgeColor: 'blue', stars: 5, price: '€18.00' },
  { name: "Half Caff'd", image: '/images/PRODUCTSTILL.jpg', stars: 5, oldPrice: '€20.00', price: '€16.00' },
  { name: 'Daily Grind', image: '/images/PRODUCTSTILL.jpg', stars: 5, price: '€19.00' },
];

const MERCH_PRODUCTS_FALLBACK = [
  { name: 'Sunrise Tee', image: '/images/PRODUCTSTILL.jpg', price: '$40.00' },
  { name: 'Honestly Good Tote', image: '/images/PRODUCTSTILL.jpg', price: '$40.00' },
  { name: 'Sunrise Cap', image: '/images/PRODUCTSTILL.jpg', price: '$40.00' },
];

function mapShopwareProduct(product) {
  const price = product.calculatedPrice || product.price?.[0];
  const listPrice = price?.listPrice;
  const options = product.options?.map((o) => o.translated?.name || o.name).filter(Boolean);
  return {
    id: product.id,
    name: product.translated?.name || product.name,
    slug: getProductSlug(product),
    image: getProductImage(product),
    price: formatPrice(price?.unitPrice),
    oldPrice: listPrice?.price ? formatPrice(listPrice.price) : undefined,
    badge: listPrice?.price ? 'Sale' : undefined,
    options: options?.length ? options : undefined,
  };
}

export default function HomePage() {
  const { products: shopwareProducts, loading, error } = useProducts({ limit: 12 });

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
