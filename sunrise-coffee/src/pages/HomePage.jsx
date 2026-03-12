import Hero from '../components/Hero/Hero';
import { ProductsMarquee, RedMarquee } from '../components/Marquee/Marquee';
import FilterTags from '../components/FilterTags/FilterTags';
import SectionHeader from '../components/SectionHeader/SectionHeader';
import ProductSlider from '../components/ProductSlider/ProductSlider';
import ProductCard from '../components/ProductCard/ProductCard';
import CategoryBanners from '../components/CategoryBanner/CategoryBanner';
import AboutSection from '../components/AboutSection/AboutSection';
import GuidesEditorial from '../components/GuidesEditorial/GuidesEditorial';
import BlogGrid from '../components/BlogGrid/BlogGrid';
import styles from './HomePage.module.css';

const SLIDER_PRODUCTS = [
  { name: 'Jungle Boogie', image: '/images/PRODUCTSTILL.jpg', oldPrice: '€20.00', price: '€16.00' },
  { name: 'Day For It', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', oldPrice: '€20.00', price: '€16.00' },
  { name: 'Basecamp', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', oldPrice: '€20.00', price: '€16.00' },
  { name: 'Copacabana', image: '/images/PRODUCTSTILL.jpg', price: '€18.00' },
  { name: 'Highland Reserve', image: '/images/PRODUCTSTILL.jpg', price: '€22.00' },
  { name: 'Slow Phase', image: '/images/PRODUCTSTILL.jpg', price: '€19.00' },
];

const BLEND_PRODUCTS = [
  { name: 'Decaf', image: '/images/PRODUCTSTILL.jpg', badge: 'Sale', badgeColor: 'blue', stars: 5, price: '€18.00' },
  { name: "Half Caff'd", image: '/images/PRODUCTSTILL.jpg', stars: 5, oldPrice: '€20.00', price: '€16.00' },
  { name: 'Daily Grind', image: '/images/PRODUCTSTILL.jpg', stars: 5, price: '€19.00' },
];

const MERCH_PRODUCTS = [
  { name: 'Sunrise Tee', image: '/images/PRODUCTSTILL.jpg', price: '$40.00' },
  { name: 'Honestly Good Tote', image: '/images/PRODUCTSTILL.jpg', price: '$40.00' },
  { name: 'Sunrise Cap', image: '/images/PRODUCTSTILL.jpg', price: '$40.00' },
];

export default function HomePage() {
  return (
    <>
      <Hero image="/images/HERO.jpeg" />
      <FilterTags />

      <SectionHeader label="Bestsellers" title="Hot off the Roaster" count={6} viewAllHref="/collections/all" />
      <ProductSlider>
        {SLIDER_PRODUCTS.map((p) => (
          <ProductCard key={p.name} {...p} />
        ))}
      </ProductSlider>

      <CategoryBanners filterImage="/images/CAPPERI.jpg" espressoImage="/images/CAPPERI.jpg" />

      <SectionHeader label="Latest Blends" title="Let's Mix Things Up" count={8} viewAllHref="/collections/blend" style={{ marginTop: 60 }} />
      <div className={styles.productGrid}>
        {BLEND_PRODUCTS.map((p) => (
          <ProductCard key={p.name} {...p} />
        ))}
      </div>

      <AboutSection />

      <SectionHeader label="Merch" title="Fits for Drips" count={3} style={{ marginTop: 60 }} />
      <div className={styles.productGrid}>
        {MERCH_PRODUCTS.map((p) => (
          <ProductCard key={p.name} variant="merch" name={p.name} price={p.price} image={p.image} />
        ))}
      </div>

      <RedMarquee />
      <ProductsMarquee />

      <GuidesEditorial image="/images/CAPPERI.jpg" />

      <SectionHeader label="Dispatch" title="From the Blog" viewAllHref="/" viewAllText="More News →" style={{ marginTop: 60 }} />
      <BlogGrid />
    </>
  );
}
