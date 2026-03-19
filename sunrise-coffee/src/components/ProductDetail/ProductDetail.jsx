import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard/ProductCard';
import SectionHeader from '../SectionHeader/SectionHeader';
import { useCartContext } from '../../context/ShopwareContext';
import { formatPrice } from '../../lib/utils/price';
import { getProductImage, getProductSlug } from '../../lib/utils/image';
import styles from './ProductDetail.module.css';

const SIZES = ['250g', '500g', '1kg'];
const GRINDS = ['Beans', 'Espresso', 'Stovetop', 'Plunger', 'Aeropress', 'Pour Over'];
const FALLBACK_PRICES = { '250g': 25, '500g': 42, '1kg': 75 };

const BREW_RECIPES_FALLBACK = [
  { name: 'Pour-over', rows: [['Coffee', '15g medium-fine'], ['Water', '250ml at 94°C'], ['Ratio', '1:16.6'], ['Bloom', '30ml, 30 sec'], ['Total time', '2:30 – 3:00']] },
  { name: 'Drip', rows: [['Coffee', '60g medium'], ['Water', '1L at 92–96°C'], ['Ratio', '1:16'], ['Total time', '4:00 – 5:00']] },
  { name: 'AeroPress', rows: [['Coffee', '14g fine-medium'], ['Water', '200ml at 92°C'], ['Ratio', '1:14'], ['Steep', '1:30, then press 30 sec']] },
  { name: 'Plunger / French Press', rows: [['Coffee', '30g coarse'], ['Water', '500ml at 96°C'], ['Ratio', '1:16'], ['Steep', '4:00, then plunge slowly']] },
];

// Mapping custom field name → label accordion
const BREW_CUSTOM_FIELDS = [
  { key: 'capperificio_brew_pour_over', name: 'Pour-over' },
  { key: 'capperificio_brew_drip',      name: 'Drip' },
  { key: 'capperificio_brew_aeropress', name: 'AeroPress' },
  { key: 'capperificio_brew_plunger',   name: 'Plunger / French Press' },
];

const ALSO_LIKE_FALLBACK = [
  { name: 'Day For It', image: '/images/PRODUCTSTILL.jpg', badge: 'New!' },
  { name: 'Buoi Sang', image: '/images/PRODUCTSTILL.jpg' },
  { name: "It's Golden", image: '/images/PRODUCTSTILL.jpg' },
  { name: 'Andean Sky', image: '/images/PRODUCTSTILL.jpg' },
];

/* ─── Fallback data for when Shopware is not connected ─── */

const FALLBACK_PRODUCT = {
  name: 'Sweet Velvet',
  description: `Indulge in the luxurious charm of <em>Sweet Velvet</em>, a beautifully balanced filter
    coffee blend that combines washed and natural processes for a truly unique flavor
    experience. With its smooth notes of vanilla, buttery caramel sweetness, and the juicy
    vibrance of stone fruit, this coffee offers a delightful harmony of richness and
    brightness. Designed for pour-over or drip brewing, <em>Sweet Velvet</em> delivers a
    silky, aromatic cup that's as comforting as it is exquisite.`,
  tastingNotes: 'Vanilla\nCaramel\nFruity',
  region: 'Various',
  type: 'Blend',
  bestFor: 'Filter',
  process: 'Washed & Natural',
  images: ['/images/PRODUCTSTILL.jpg', '/images/PRODUCTSTILL.jpg', '/images/PRODUCTSTILL.jpg', '/images/PRODUCTSTILL.jpg'],
};

export default function ProductDetail({ product: shopwareProduct, loading, error, slug }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [size, setSize] = useState('250g');
  const [grind, setGrind] = useState('Beans');
  const [qty, setQty] = useState(1);
  const [openBrew, setOpenBrew] = useState(null);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const feedbackTimeout = useRef(null);
  const { addItem } = useCartContext();

  // Parse Shopware configurator settings into grouped options { 'Size': [{id, name}], 'Grind': [...] }
  const configuratorGroups = {};
  if (shopwareProduct?.configuratorSettings?.length) {
    shopwareProduct.configuratorSettings.forEach((setting) => {
      const group = setting.option?.group;
      const option = setting.option;
      if (!group || !option) return;
      const groupName = group.translated?.name || group.name;
      const optionName = option.translated?.name || option.name;
      if (!configuratorGroups[groupName]) configuratorGroups[groupName] = [];
      configuratorGroups[groupName].push({ id: option.id, name: optionName });
    });
  }
  const hasConfigurator = Object.keys(configuratorGroups).length > 0;

  // Initialize selected options to the first value of each group when the product loads
  useEffect(() => {
    if (!hasConfigurator) return;
    const defaults = {};
    Object.entries(configuratorGroups).forEach(([group, options]) => {
      if (options.length > 0) defaults[group] = options[0].id;
    });
    setSelectedOptions(defaults);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopwareProduct?.id]);

  // Use Shopware product data if available, otherwise fallback
  const hasApiProduct = Boolean(shopwareProduct);

  const productName = hasApiProduct
    ? (shopwareProduct.translated?.name || shopwareProduct.name)
    : FALLBACK_PRODUCT.name;

  const productDescription = hasApiProduct
    ? (shopwareProduct.translated?.description || shopwareProduct.description || '')
    : FALLBACK_PRODUCT.description;

  const productPrice = hasApiProduct
    ? (shopwareProduct.calculatedPrice?.unitPrice || shopwareProduct.price?.[0]?.gross || 0)
    : FALLBACK_PRICES[size];

  const productImages = hasApiProduct
    ? (shopwareProduct.media?.length
      ? shopwareProduct.media.map((m) => m.media?.url || m.url).filter(Boolean)
      : [getProductImage(shopwareProduct)])
    : FALLBACK_PRODUCT.images;

  // Extract properties for info table, in canonical display order
  const PROPERTY_ORDER = ['Tasting notes', 'Region', 'Type', 'Best for', 'Process'];
  const properties = hasApiProduct ? (shopwareProduct.properties || []) : [];
  const groupedProperties = properties.reduce((acc, prop) => {
    const groupName = prop.group?.translated?.name || prop.group?.name || 'Other';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(prop.translated?.name || prop.name);
    return acc;
  }, {});
  const sortedProperties = [
    ...PROPERTY_ORDER.filter((g) => groupedProperties[g]),
    ...Object.keys(groupedProperties).filter((g) => !PROPERTY_ORDER.includes(g)),
  ].map((g) => [g, groupedProperties[g]]);

  // Cross-selling products
  const crossSellings = hasApiProduct
    ? (shopwareProduct.crossSellings || []).flatMap((cs) =>
        (cs.assignedProducts || []).map((ap) => ap.product).filter(Boolean)
      )
    : [];

  const alsoLikeProducts = crossSellings.length > 0
    ? crossSellings.slice(0, 4).map((p) => ({
        name: p.translated?.name || p.name,
        slug: getProductSlug(p),
        image: getProductImage(p),
        price: formatPrice(p.calculatedPrice?.unitPrice || p.price?.[0]?.gross),
      }))
    : ALSO_LIKE_FALLBACK.map((p) => ({ ...p, price: '$25.00' }));

  const unitPrice = hasApiProduct ? productPrice : FALLBACK_PRICES[size];
  const totalPrice = unitPrice * qty;

  const handleAddToCart = async () => {
    if (hasApiProduct && shopwareProduct.id) {
      try {
        await addItem(shopwareProduct.id, qty);
      } catch {
        // Still show feedback even if API fails
      }
    }
    setAddedFeedback(true);
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setAddedFeedback(false), 1800);
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', color: '#999' }}>Caricamento prodotto...</p>
      </div>
    );
  }

  if (error && !hasApiProduct) {
    // Show fallback product when API fails
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link to="/">Home</Link><span className={styles.sep}>/</span>
        <Link to="/collections/all">All Coffee</Link><span className={styles.sep}>/</span>
        <span>{productName}</span>
      </div>

      {/* Product section — 3 columns */}
      <section className={styles.productSection}>
        {/* LEFT COL */}
        <div className={styles.colLeft}>
          <p
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: productDescription }}
          />

          {(() => {
            const cf = shopwareProduct?.customFields || {};
            const bullets = [cf.capperificio_bullet_1, cf.capperificio_bullet_2, cf.capperificio_bullet_3].filter(Boolean);
            const fallbackBullets = ['Freshly Roasted in Melbourne', 'Free Standard Delivery over $50'];
            return (
              <ul className={styles.bullets}>
                {(bullets.length > 0 ? bullets : fallbackBullets).map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            );
          })()}

          {hasApiProduct && sortedProperties.length > 0 ? (
            <table className={styles.infoTable}>
              <tbody>
                {sortedProperties.map(([group, values]) => (
                  <tr key={group}>
                    <td>{group}</td>
                    <td>
                      {group === 'Tasting notes'
                        ? values.map((v, i) => <span key={i}>{v}{i < values.length - 1 && <br />}</span>)
                        : values.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className={styles.infoTable}>
              <tbody>
                <tr><td>Tasting notes</td><td>Vanilla<br/>Caramel<br/>Fruity</td></tr>
                <tr><td>Region</td><td>Various</td></tr>
                <tr><td>Type</td><td>Blend</td></tr>
                <tr><td>Best for</td><td>Filter</td></tr>
                <tr><td>Process</td><td>Washed &amp; Natural</td></tr>
              </tbody>
            </table>
          )}

          <div className={styles.sectionTitle}>Brew Recipes</div>
          <div className={styles.brewAccordion}>
            {(() => {
              const cf = shopwareProduct?.customFields || {};
              const hasBrewCustomFields = BREW_CUSTOM_FIELDS.some(({ key }) => cf[key]);

              if (hasBrewCustomFields) {
                return BREW_CUSTOM_FIELDS.filter(({ key }) => cf[key]).map(({ key, name }) => {
                  const isOpen = openBrew === name;
                  return (
                    <div key={key} className={styles.brewItem}>
                      <button className={styles.brewToggle} onClick={() => setOpenBrew(isOpen ? null : name)}>
                        <span>{name}</span>
                        <span className={`${styles.brewIcon} ${isOpen ? styles.brewIconOpen : ''}`}>+</span>
                      </button>
                      {isOpen && (
                        <div className={styles.brewContent}>
                          <p dangerouslySetInnerHTML={{ __html: cf[key] }} />
                        </div>
                      )}
                    </div>
                  );
                });
              }

              return BREW_RECIPES_FALLBACK.map((recipe) => {
                const isOpen = openBrew === recipe.name;
                return (
                  <div key={recipe.name} className={styles.brewItem}>
                    <button className={styles.brewToggle} onClick={() => setOpenBrew(isOpen ? null : recipe.name)}>
                      <span>{recipe.name}</span>
                      <span className={`${styles.brewIcon} ${isOpen ? styles.brewIconOpen : ''}`}>+</span>
                    </button>
                    {isOpen && (
                      <div className={styles.brewContent}>
                        <table>
                          <tbody>
                            {recipe.rows.map(([label, value]) => (
                              <tr key={label}><td>{label}</td><td>{value}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* CENTER COL */}
        <div className={styles.colCenter}>
          {productImages.map((src, i) => (
            <div key={i} className={styles.productImage}>
              <img src={src} alt={`${productName} — ${i + 1}`} className={styles.pdpImg} />
            </div>
          ))}
        </div>

        {/* RIGHT COL */}
        <div className={styles.colRight}>
          <h1 className={styles.pdpTitle}>{productName}</h1>
          {shopwareProduct?.customFields?.capperificio_calibro && (
            <span className={styles.calibroTag}>
              {shopwareProduct.customFields.capperificio_calibro}
            </span>
          )}
          <div className={styles.pdpPrice}>
            {hasApiProduct ? formatPrice(unitPrice) : `$${unitPrice.toFixed(2)}`}
          </div>

          {hasApiProduct && hasConfigurator ? (
            Object.entries(configuratorGroups).map(([groupName, options]) => (
              <div key={groupName}>
                <div className={styles.optionLabel}>{groupName}:</div>
                <div className={styles.options}>
                  {options.map((opt) => (
                    <label key={opt.id} className={styles.option}>
                      <input
                        type="radio"
                        name={groupName}
                        value={opt.id}
                        checked={selectedOptions[groupName] === opt.id}
                        onChange={() => setSelectedOptions((prev) => ({ ...prev, [groupName]: opt.id }))}
                      />
                      <span>{opt.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))
          ) : !hasApiProduct ? (
            <>
              <div className={styles.optionLabel}>Size:</div>
              <div className={styles.options}>
                {SIZES.map((s) => (
                  <label key={s} className={styles.option}>
                    <input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
              <div className={styles.optionLabel}>Grind:</div>
              <div className={styles.options}>
                {GRINDS.map((g) => (
                  <label key={g} className={styles.option}>
                    <input type="radio" name="grind" value={g} checked={grind === g} onChange={() => setGrind(g)} />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </>
          ) : null}

          <div className={styles.qtyRow}>
            <div className={styles.qty}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">&minus;</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase quantity">+</button>
            </div>
            <button
              className={styles.btnAddCart}
              onClick={handleAddToCart}
              style={addedFeedback ? { background: '#2C8843', color: '#fff', borderColor: '#2C8843' } : {}}
            >
              {addedFeedback
                ? 'Added ✓'
                : <>Add to Cart <span>→</span> {hasApiProduct ? formatPrice(totalPrice) : `$${totalPrice.toFixed(2)}`}</>
              }
            </button>
          </div>
        </div>
      </section>

      {/* You may also like */}
      <section className={styles.alsoLikeSection}>
        <SectionHeader label="Recommended" title="You may also like" />
        <div className={styles.alsoLikeGrid}>
          {alsoLikeProducts.map((product) => (
            <ProductCard
              key={product.name}
              name={product.name}
              slug={product.slug}
              price={product.price}
              image={product.image}
              badge={product.badge}
            />
          ))}
        </div>
      </section>
    </>
  );
}
