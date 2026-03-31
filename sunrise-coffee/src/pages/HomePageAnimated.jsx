import { Link } from 'react-router-dom';
import Hero from '../components/Hero/Hero';
import { RedMarquee } from '../components/Marquee/Marquee';
import FilterTags from '../components/FilterTags/FilterTags';
import ProductCard from '../components/ProductCard/ProductCard';
import ProductSlider from '../components/ProductSlider/ProductSlider';
import AboutSection from '../components/AboutSection/AboutSection';
import StorySlider from '../components/StorySlider/StorySlider';
import { useProducts } from '../hooks/useProducts';
import { useSEO } from '../hooks/useSEO';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { formatPrice } from '../lib/utils/price';
import { getProductImage, getProductSlug } from '../lib/utils/image';
import useInView from '../hooks/useInView';

// CSS modules from existing components — reused for correct styling
import categoryStyles from '../components/CategoryBanner/CategoryBanner.module.css';
import guidesStyles from '../components/GuidesEditorial/GuidesEditorial.module.css';
import blogStyles from '../components/BlogGrid/BlogGrid.module.css';
import sectionStyles from '../components/SectionHeader/SectionHeader.module.css';

// Animation definitions
import styles from './HomePageAnimated.module.css';

const B2B_CATEGORY_ID = import.meta.env.VITE_B2B_CATEGORY_ID || null;

/* ─── Fallback data ─── */
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

const POSTS_FALLBACK = [
  {
    title: 'Come conservare i capperi sotto sale: guida pratica',
    excerpt: "Il sale marino è il metodo di conservazione più antico e migliore per i capperi. Scopri come mantenerli fragranti e saporiti a lungo, direttamente in dispensa...",
    image: '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp',
    slug: null,
  },
  {
    title: 'Capperi in cucina: 5 abbinamenti da provare',
    excerpt: "Dal pesce spada alla pasta alla Norma, i capperi di Racale esaltano ogni piatto. Ecco cinque ricette della tradizione pugliese e siciliana da mettere in tavola...",
    image: '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp',
    slug: null,
  },
  {
    title: 'Lilliput, Lacrimella, Capperone: le differenze',
    excerpt: "Non tutti i capperi sono uguali. La dimensione incide su sapore, consistenza e uso ideale in cucina. Una piccola guida per scegliere il formato giusto...",
    image: '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp',
    slug: null,
  },
];

/* ─── Data helpers (identical to HomePage) ─── */
function groupVariants(rawList) {
  const standalone = rawList.filter(p => !p.parentId);
  const children   = rawList.filter(p => !!p.parentId);
  const groups = {};
  children.forEach(child => {
    if (!groups[child.parentId]) groups[child.parentId] = [];
    groups[child.parentId].push(child);
  });
  const parentIds = new Set(Object.keys(groups));
  const buildVariantMap = (ch) => {
    const map = {};
    ch.forEach(c => {
      const name = c.options?.[0]?.translated?.name || c.options?.[0]?.name;
      if (name) map[name] = c.id;
    });
    return map;
  };
  const result = standalone.map(p => {
    if (!parentIds.has(p.id)) return p;
    const allOptions = [...new Set(groups[p.id].flatMap(c => c.options?.map(o => o.translated?.name || o.name).filter(Boolean) || []))];
    return { ...p, _allVariantOptions: allOptions, _firstVariantId: groups[p.id][0]?.id, _variantMap: buildVariantMap(groups[p.id]) };
  });
  Object.entries(groups).forEach(([parentId, siblings]) => {
    if (standalone.some(p => p.id === parentId)) return;
    const allOptions = [...new Set(siblings.flatMap(c => c.options?.map(o => o.translated?.name || o.name).filter(Boolean) || []))];
    result.push({ ...siblings[0], _allVariantOptions: allOptions, _variantMap: buildVariantMap(siblings) });
  });
  return result;
}

function mapShopwareProduct(product) {
  const price = product.calculatedPrice || product.price?.[0];
  const listPrice = price?.listPrice;
  const fromConfigurator = product.configuratorSettings?.map(s => s.option?.translated?.name || s.option?.name).filter(Boolean);
  const fromOptions = product.options?.map(o => o.translated?.name || o.name).filter(Boolean);
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
    variantMap: product._variantMap || {},
  };
}

/* ─── AnimateIn — generic scroll-triggered wrapper ─── */
function AnimateIn({ animation = 'fadeUp', delay = 0, className = '', as: Tag = 'div', children, style, ...props }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      className={[styles[animation], inView ? styles.inView : '', className].filter(Boolean).join(' ')}
      style={{ '--delay': `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
}

/* ─── AnimatedSectionHeader — stagger label → title → link ─── */
function AnimatedSectionHeader({ label, title, count, viewAllHref, viewAllText = 'View all →', style }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={[sectionStyles.header, inView ? styles.headerInView : ''].join(' ')}
      style={style}
    >
      <div className={`${sectionStyles.label} ${styles.labelAnim}`}>
        <span className={sectionStyles.dot} /> {label}
      </div>
      <h2 className={`${sectionStyles.title} ${styles.titleAnim}`}>
        {title}
        {count != null && <sup>{count}</sup>}
      </h2>
      {viewAllHref && (
        <Link to={viewAllHref} className={`${sectionStyles.viewAll} ${styles.linkAnim}`}>
          {viewAllText}
        </Link>
      )}
    </div>
  );
}

/* ─── AnimatedCategoryBanners — clip-path reveal per card ─── */
function AnimatedCategoryBanners({ filterImage, espressoImage }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  return (
    <div ref={ref} className={categoryStyles.grid}>
      <Link
        to="/collections/filter"
        className={[categoryStyles.card, categoryStyles.topLeft, styles.clipReveal, inView ? styles.inView : ''].join(' ')}
      >
        <div className={`${categoryStyles.bg} ${styles.imgZoom}`}>
          {filterImage
            ? <img src={filterImage} alt="Shop Filter" className={categoryStyles.bgImg} />
            : <div className={categoryStyles.bgPlaceholder} />
          }
        </div>
        <span className={categoryStyles.text}>Shop Filter</span>
      </Link>

      <Link
        to="/collections/espresso"
        className={[categoryStyles.card, categoryStyles.bottomRight, styles.clipReveal, inView ? styles.inView : ''].join(' ')}
        style={{ '--delay': '150ms' }}
      >
        <div className={`${categoryStyles.bg} ${styles.imgZoom}`}>
          {espressoImage
            ? <img src={espressoImage} alt="Shop Espresso" className={categoryStyles.bgImg} />
            : <div className={categoryStyles.bgPlaceholder} />
          }
        </div>
        <span className={categoryStyles.text}>Shop Espresso</span>
      </Link>
    </div>
  );
}

/* ─── AnimatedGuidesEditorial — text slides from left, image from right ─── */
function AnimatedGuidesEditorial({ image }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  return (
    <section ref={ref} className={guidesStyles.section}>
      <div className={[guidesStyles.textCol, styles.slideLeft, inView ? styles.inView : ''].join(' ')}>
        <div className={guidesStyles.tag}><span className={guidesStyles.dot} /> In cucina</div>
        <h2 className={guidesStyles.heading}>Dall&rsquo;antipasto al condimento</h2>
        <p className={guidesStyles.body}>
          I capperi di Racale si prestano a mille usi in cucina. Scopri come
          valorizzarli in ricette tradizionali e abbinamenti creativi, dal mare alla carne.
        </p>
        <Link to="/" className={guidesStyles.btn}>Scopri le ricette &rarr;</Link>
      </div>
      <div
        className={[guidesStyles.photo, styles.slideRight, inView ? styles.inView : ''].join(' ')}
        style={{ '--delay': '80ms' }}
      >
        {image && <img src={image} alt="Capperi in cucina" className={guidesStyles.photoImg} />}
      </div>
    </section>
  );
}

/* ─── AnimatedProductGrid — stagger via nth-child CSS ─── */
function AnimatedProductGrid({ products }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={[styles.productGrid, styles.staggerGrid, inView ? styles.staggerInView : ''].join(' ')}
    >
      {products.map((p) => (
        <ProductCard key={p.name} {...p} />
      ))}
    </div>
  );
}

/* ─── AnimatedBlogGrid — stagger + image hover zoom ─── */
function AnimatedBlogGrid() {
  const { posts: apiPosts, loading } = useBlogPosts({ limit: 3 });
  const [ref, inView] = useInView({ threshold: 0.1 });
  const posts = !loading && apiPosts.length > 0 ? apiPosts : POSTS_FALLBACK;

  return (
    <div
      ref={ref}
      className={[blogStyles.grid, styles.staggerGrid, inView ? styles.staggerInView : ''].join(' ')}
    >
      {posts.map((post) => {
        const content = (
          <>
            <div className={`${blogStyles.img} ${styles.imgZoom}`}>
              {post.image
                ? <img src={post.image} alt={post.title} className={blogStyles.postImg} />
                : <div className={blogStyles.imgPlaceholder} />
              }
            </div>
            <div className={blogStyles.body}>
              <h3 className={blogStyles.title}>{post.title}</h3>
              <p className={blogStyles.excerpt}>{post.excerpt}</p>
              <span className={blogStyles.link}>Leggi →</span>
            </div>
          </>
        );

        return post.slug ? (
          <Link key={post.slug} to={`/blog/${post.slug}`} className={blogStyles.card}>
            {content}
          </Link>
        ) : (
          <div key={post.title} className={blogStyles.card}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ─── */
const HOME_JSON_LD = {
  '@type': 'WebPage',
  name: 'Capperificio di Racale — Home',
  description: 'E-commerce di capperi artigianali dal Salento.',
};

const HERO_IMAGE = '/images/HERO.jpeg';
const EDITORIAL_IMAGE = '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp';

export default function HomePageAnimated() {
  useSEO({
    title: 'Capperi Artigianali dal Salento',
    description: 'Scopri i capperi, cucunci e foglie di Racale: prodotti artigianali dal Salento, raccolti a mano e conservati secondo tradizione. Tre generazioni di qualità.',
    path: '/home-animated',
    jsonLd: HOME_JSON_LD,
  });

  const { products: rawProducts, loading, error } = useProducts({ limit: 24 });
  const { products: rawMateriaPrima } = useProducts({
    limit: 9,
    filters: [{ type: 'equals', field: 'tags.name', value: 'Materia prima' }],
  });

  const shopwareProducts = groupVariants(rawProducts).filter(p =>
    !B2B_CATEGORY_ID || !p.categoryTree?.includes(B2B_CATEGORY_ID)
  );

  const hasApiData = !error && !loading && shopwareProducts.length > 0;

  const sliderProducts = hasApiData
    ? shopwareProducts.slice(0, 6).map(mapShopwareProduct)
    : SLIDER_PRODUCTS_FALLBACK;

  const blendProducts = hasApiData && rawMateriaPrima.length > 0
    ? groupVariants(rawMateriaPrima).slice(0, 3).map(mapShopwareProduct)
    : BLEND_PRODUCTS_FALLBACK;

  return (
    <>
      {/* ── 1. Hero — fades + slides up on mount ── */}
      <div className={styles.heroWrapper}>
        <Hero image={HERO_IMAGE} />
      </div>

      {/* ── 2. FilterTags — fadeUp ── */}
      <AnimateIn animation="fadeUp">
        <FilterTags />
      </AnimateIn>

      {/* ── 3. Bestseller header — label → title → link stagger ── */}
      <AnimatedSectionHeader
        label="I più amati"
        title="I nostri Bestseller"
        count={sliderProducts.length}
        viewAllHref="/collections/all"
      />

      {/* ── 4. ProductSlider — fadeUp ── */}
      <AnimateIn animation="fadeUp" delay={40}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            Caricamento prodotti...
          </div>
        ) : (
          <ProductSlider>
            {sliderProducts.map((p) => (
              <ProductCard key={p.name} {...p} />
            ))}
          </ProductSlider>
        )}
      </AnimateIn>

      {/* ── 5. CategoryBanners — clip-path reveal, staggered ── */}
      <div style={{ background: 'var(--color-light)' }}>
        <AnimatedCategoryBanners filterImage={EDITORIAL_IMAGE} espressoImage={EDITORIAL_IMAGE} />
      </div>

      {/* ── 6. AboutSection — fadeUp ── */}
      <AnimateIn animation="fadeUp">
        <AboutSection />
      </AnimateIn>

      {/* ── 7. Story section — stagger header then slider ── */}
      <div style={{ background: 'var(--color-light)', paddingTop: 60 }}>
        <AnimatedSectionHeader label="La nostra storia" title="Dal campo alla tavola" count={3} />
        <AnimateIn animation="fadeUp" delay={80}>
          <StorySlider />
        </AnimateIn>
      </div>

      {/* ── 8. Specialità — header + stagger product grid ── */}
      <AnimatedSectionHeader
        label="Materia prima"
        title="Le nostre specialità"
        count={8}
        viewAllHref="/collections/all"
        style={{ marginTop: 60 }}
      />
      <AnimatedProductGrid products={blendProducts} />

      {/* ── 9. RedMarquee — fadeIn (already has its own CSS scroll animation) ── */}
      <AnimateIn animation="fadeIn">
        <RedMarquee />
      </AnimateIn>

      {/* ── 10. GuidesEditorial — text slides left, image slides right ── */}
      <AnimatedGuidesEditorial image={EDITORIAL_IMAGE} />

      {/* ── 11. Blog — header + stagger cards with image hover zoom ── */}
      <AnimatedSectionHeader
        label="Dal blog"
        title="Storie e ricette"
        viewAllHref="/"
        viewAllText="Tutti gli articoli →"
        style={{ marginTop: 60 }}
      />
      <AnimatedBlogGrid />
    </>
  );
}
