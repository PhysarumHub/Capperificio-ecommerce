import Hero from '../components/Hero/Hero';
import { ProductsMarquee, RedMarquee } from '../components/Marquee/Marquee';
import FilterTags from '../components/FilterTags/FilterTags';
import SectionHeader from '../components/SectionHeader/SectionHeader';
import ProductCard from '../components/ProductCard/ProductCard';
import ProductSlider from '../components/ProductSlider/ProductSlider';
import CategoryBanners from '../components/CategoryBanner/CategoryBanner';
import AboutSection from '../components/AboutSection/AboutSection';
import GuidesEditorial from '../components/GuidesEditorial/GuidesEditorial';
import StorySlider from '../components/StorySlider/StorySlider';
import { useMemo } from 'react';
import AnimateIn from '../components/AnimateIn';
import useInView from '../hooks/useInView';
import { useProducts } from '../hooks/useProducts';
import { useSEO } from '../hooks/useSEO';
import { formatPrice } from '../lib/utils/price';
import { getProductImage, getProductHoverImage, getProductSlug } from '../lib/utils/image';
import { resolveListingSoldOut } from '../lib/utils/availability';
import { groupVariants, resolveCardCartId, resolveVariantOptions } from '../lib/utils/variants';
import styles from './HomePage.module.css';
import anim from '../styles/animations.module.css';

const B2B_CATEGORY_ID = import.meta.env.VITE_B2B_CATEGORY_ID || null;

// Product-number prefixes for the "Materia prima" section (cucunci, foglie, polvere)
const SPECIALTY_PRODUCT_PREFIXES = ['CUC-', 'CAP-FOGLIE', 'CAP-POLVERE'];

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

  return {
    id: resolveCardCartId(product),
    name: product.translated?.name || product.name,
    slug: getProductSlug(product),
    image: getProductImage(product),
    hoverImage: getProductHoverImage(product),
    price: formatPrice(price?.unitPrice),
    oldPrice: listPrice?.price ? formatPrice(listPrice.price) : undefined,
    badge: listPrice?.price ? 'Sale' : undefined,
    options: resolveVariantOptions(product),
    variantMap: product._variantMap || {},
    availabilityMap: product._availabilityMap || {},
    soldOut: resolveListingSoldOut(product),
  };
}

const HOME_JSON_LD = {
  '@type': 'WebPage',
  name: 'Capperificio di Racale — Home',
  description: 'E-commerce di capperi artigianali dal Salento.',
};

export default function HomePage() {
  useSEO({
    title: 'Capperi Artigianali dal Salento',
    description: 'Scopri i capperi, cucunci e foglie di Racale: prodotti artigianali dal Salento, raccolti a mano e conservati secondo tradizione. Tre generazioni di qualità.',
    path: '/',
    jsonLd: HOME_JSON_LD,
  });

  // Fetch more products to account for B2B ones being filtered out client-side
  const { products: rawProducts, loading, error } = useProducts({ limit: 24 });

  const shopwareProducts = useMemo(
    () => groupVariants(rawProducts).filter(p => !B2B_CATEGORY_ID || !p.categoryTree?.includes(B2B_CATEGORY_ID)),
    [rawProducts],
  );

  // If Shopware data is available, split into sections; otherwise use fallbacks
  const hasApiData = !error && !loading && shopwareProducts.length > 0;

  const sliderProducts = hasApiData
    ? shopwareProducts.slice(0, 6).map(mapShopwareProduct)
    : SLIDER_PRODUCTS_FALLBACK;

  // "Materia prima" section: capperi non-treated products (foglie, polvere, cucunci)
  // vs the core capperi shown in the bestseller slider above.
  const blendProducts = useMemo(() => {
    if (!hasApiData) return BLEND_PRODUCTS_FALLBACK;
    const specialty = shopwareProducts.filter((p) =>
      SPECIALTY_PRODUCT_PREFIXES.some((prefix) => p.productNumber?.startsWith(prefix))
    );
    return (specialty.length > 0 ? specialty : shopwareProducts).slice(0, 3).map(mapShopwareProduct);
  }, [hasApiData, shopwareProducts]);

  const [gridRef, gridInView] = useInView({ threshold: 0.1 });

  return (
    <>
      <Hero
        image="/images/HERO.jpeg"
        alt="Capperi di Racale raccolti a mano nei campi del Salento"
        heading="Capperificio di Racale — capperi, cucunci e foglie artigianali dal Salento"
      />

      <AnimateIn animation="fadeUp">
        <FilterTags />
      </AnimateIn>

      <SectionHeader label="I più amati" title="I nostri Bestseller" count={sliderProducts.length} viewAllHref="/collections/all" />

      <AnimateIn animation="fadeUp" delay={40}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>Caricamento prodotti...</div>
        ) : (
          <ProductSlider>
            {sliderProducts.map((p) => (
              <ProductCard key={p.name} {...p} />
            ))}
          </ProductSlider>
        )}
      </AnimateIn>

      <div style={{ background: 'var(--color-light)' }}>
        <CategoryBanners filterImage="/images/giannelli.webp" espressoImage="/images/capperi-al-sale.webp" />
      </div>

      <AboutSection />

      <div style={{ background: 'var(--color-light)', paddingTop: 60 }}>
        <SectionHeader label="La nostra storia" title="Dal campo alla tavola" count={3} />
        <AnimateIn animation="fadeUp" delay={80}>
          <StorySlider />
        </AnimateIn>
      </div>

      <SectionHeader label="Materia prima" title="Le nostre specialità" count={8} viewAllHref="/collections/all" style={{ marginTop: 60 }} />
      <div
        ref={gridRef}
        className={`${styles.productGrid} ${anim.staggerGrid} ${gridInView ? anim.staggerInView : ''}`}
      >
        {blendProducts.map((p) => (
          <ProductCard key={p.name} {...p} />
        ))}
      </div>

      <AnimateIn animation="fadeIn">
        <RedMarquee />
      </AnimateIn>

      <GuidesEditorial image="/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp" />
    </>
  );
}
