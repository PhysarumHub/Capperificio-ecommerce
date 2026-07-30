import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../ProductCard/ProductCard';
import SectionHeader from '../SectionHeader/SectionHeader';
import { useCartContext } from '../../context/ShopwareContext';
import { useProducts } from '../../hooks/useProducts';
import { formatPrice } from '../../lib/utils/price';
import { getProductImage, getProductSlug, proxyUrl } from '../../lib/utils/image';
import { getProductVariants } from '../../lib/api/products';
import { getCatalogEntry } from '../../data/capperificioCatalog';
import { resolveProductSoldOut } from '../../lib/utils/availability';
import { gtmViewItem, gtmAddToCart } from '../../lib/utils/gtm';
import useInView from '../../hooks/useInView';
import styles from './ProductDetail.module.css';
import anim from '../../styles/animations.module.css';

const SIZES = ['250g', '500g', '1kg'];
const GRINDS = ['Beans', 'Espresso', 'Stovetop', 'Plunger', 'Aeropress', 'Pour Over'];
const FALLBACK_PRICES = { '250g': 25, '500g': 42, '1kg': 75 };

const BREW_RECIPES_FALLBACK = [
  { name: 'Pour-over', rows: [['Coffee', '15g medium-fine'], ['Water', '250ml at 94°C'], ['Ratio', '1:16.6'], ['Bloom', '30ml, 30 sec'], ['Total time', '2:30 – 3:00']] },
  { name: 'Drip', rows: [['Coffee', '60g medium'], ['Water', '1L at 92–96°C'], ['Ratio', '1:16'], ['Total time', '4:00 – 5:00']] },
  { name: 'AeroPress', rows: [['Coffee', '14g fine-medium'], ['Water', '200ml at 92°C'], ['Ratio', '1:14'], ['Steep', '1:30, then press 30 sec']] },
  { name: 'Plunger / French Press', rows: [['Coffee', '30g coarse'], ['Water', '500ml at 96°C'], ['Ratio', '1:16'], ['Steep', '4:00, then plunge slowly']] },
];

const BREW_CUSTOM_FIELDS = [
  { key: 'capperificio_brew_pour_over', name: 'In cucina' },
  { key: 'capperificio_brew_drip',      name: 'Abbinamenti' },
  { key: 'capperificio_brew_aeropress', name: 'Conservazione' },
  { key: 'capperificio_brew_plunger',   name: 'Lo sapevi?' },
];

const B2B_CATEGORY_ID = import.meta.env.VITE_B2B_CATEGORY_ID || null;

function groupVariants(rawList) {
  const standalone = rawList.filter(p => !p.parentId);
  const children   = rawList.filter(p => !!p.parentId);
  const groups = {};
  children.forEach(child => {
    if (!groups[child.parentId]) groups[child.parentId] = [];
    groups[child.parentId].push(child);
  });
  const parentIds = new Set(Object.keys(groups));
  const buildVariantMap = (cList) => {
    const map = {};
    cList.forEach(child => {
      const name = child.options?.[0]?.translated?.name || child.options?.[0]?.name;
      if (name) map[name] = child.id;
    });
    return map;
  };
  const result = standalone.map(p => {
    const flatSiblings = groups[p.id] || [];
    if (!flatSiblings.length) return p;
    const allOptions = [...new Set(
      flatSiblings.flatMap(c => c.options?.map(o => o.translated?.name || o.name).filter(Boolean) || [])
    )];
    return { ...p, _allVariantOptions: allOptions, _firstVariantId: flatSiblings[0]?.id, _variantMap: buildVariantMap(flatSiblings) };
  });
  Object.entries(groups).forEach(([parentId, siblings]) => {
    if (standalone.some(p => p.id === parentId)) return;
    const allOptions = [...new Set(
      siblings.flatMap(c => c.options?.map(o => o.translated?.name || o.name).filter(Boolean) || [])
    )];
    result.push({ ...siblings[0], _allVariantOptions: allOptions, _variantMap: buildVariantMap(siblings) });
  });
  return result;
}

function mapRelatedProduct(product) {
  const price = product.calculatedPrice || product.price?.[0];
  const listPrice = price?.listPrice;

  // Solo quando abbiamo il variantMap reale (figli presenti nella risposta API)
  // mostriamo i chip e usiamo gli ID variante per il carrello.
  // Se il prodotto è un padre senza figli nella risposta → nascondiamo i chip
  // e non esponiamo l'id (ProductCard esce subito da handleAdd).
  const hasKnownVariants = Object.keys(product._variantMap || {}).length > 0;
  const variantMap = hasKnownVariants ? product._variantMap : {};

  const fromConfigurator = product.configuratorSettings
    ?.map((s) => s.option?.translated?.name || s.option?.name)
    .filter(Boolean);
  // Usa configuratorSettings (sempre completo dal padre) per i chip;
  // fallback a _allVariantOptions se il configurator non è presente
  const options = fromConfigurator?.length
    ? [...new Set(fromConfigurator)]
    : (hasKnownVariants ? product._allVariantOptions : undefined);

  // Se è un padre senza figli noti non possiamo risolvere l'ID variante per il carrello
  const isUnresolvableParent = !product.parentId && !hasKnownVariants
    && (product.configuratorSettings?.length > 0);
  const id = isUnresolvableParent
    ? undefined
    : (product._firstVariantId || product.id);

  return {
    id,
    name: product.translated?.name || product.name,
    slug: getProductSlug(product),
    image: getProductImage(product),
    price: formatPrice(price?.unitPrice),
    oldPrice: listPrice?.price ? formatPrice(listPrice.price) : undefined,
    badge: listPrice?.price ? 'In saldo' : undefined,
    soldOut: (product.availableStock ?? 1) <= 0,
    options,
    variantMap,
  };
}

const ALSO_LIKE_FALLBACK = [
  { name: 'Day For It', image: '/images/PRODUCTSTILL.jpg', badge: 'New!' },
  { name: 'Buoi Sang', image: '/images/PRODUCTSTILL.jpg' },
  { name: "It's Golden", image: '/images/PRODUCTSTILL.jpg' },
  { name: 'Andean Sky', image: '/images/PRODUCTSTILL.jpg' },
];

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
  const [searchParams] = useSearchParams();
  const [selectedOptions, setSelectedOptions] = useState({});
  const [variants, setVariants] = useState([]);
  const [variantsLoaded, setVariantsLoaded] = useState(false);
  const [size, setSize] = useState('250g');
  const [grind, setGrind] = useState('Beans');
  const [openBrew, setOpenBrew] = useState(null);
  const [cartQty, setCartQty] = useState(0);
  const [showControl, setShowControl] = useState(false);
  const [showTag, setShowTag] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [stickyVisible, setStickyVisible] = useState(true);
  const debounceRef = useRef(null);
  const cancelAddRef = useRef(false);
  const touchStartX = useRef(null);
  const alsoLikeSectionRef = useRef(null);
  const [alsoLikeGridRef, alsoLikeGridInView] = useInView({ threshold: 0.01, rootMargin: '120px' });
  const { addItem } = useCartContext();


  const scheduleCollapse = (currentQty) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (currentQty === 0) return;
    debounceRef.current = setTimeout(() => {
      setShowControl(false);
      setShowTag(true);
    }, 2000);
  };

  const handleAdd = async () => {
    if (isSoldOut) return;
    cancelAddRef.current = false;
    const next = cartQty + 1;
    setCartQty(next);
    setShowControl(true);
    setShowTag(false);
    const price = shopwareProduct?.calculatedPrice?.unitPrice ?? shopwareProduct?.price?.[0]?.gross ?? 0;
    gtmAddToCart({ id: shopwareProduct?.id || '', name: shopwareProduct?.translated?.name || shopwareProduct?.name || '', price }, 1);
    if (hasApiProduct && shopwareProduct?.id) {
      const itemId = activeVariant?.id || shopwareProduct.id;
      try { await addItem(itemId, 1); } catch {}
    }
    if (!cancelAddRef.current) scheduleCollapse(next);
  };

  const handleDecrease = () => {
    const next = cartQty - 1;
    setCartQty(next);
    if (next === 0) {
      setShowControl(false);
      setShowTag(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    } else {
      scheduleCollapse(next);
    }
  };

  // Hide sticky only when user scrolls into the "also like" section
  useEffect(() => {
    const alsoLike = alsoLikeSectionRef.current;
    if (!alsoLike) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(alsoLike);
    return () => observer.disconnect();
  }, []);

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

  useEffect(() => {
    if (!hasConfigurator) return;
    const preselect = searchParams.get('variant');
    const defaults = {};
    Object.entries(configuratorGroups).forEach(([group, opts]) => {
      if (!opts.length) return;
      const match = preselect && opts.find((o) => o.name === preselect);
      defaults[group] = match ? match.id : opts[0].id;
    });
    setSelectedOptions(defaults);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopwareProduct?.id]);

  // Carica le varianti figlie per abilitare il cart con l'ID corretto
  useEffect(() => {
    if (!shopwareProduct?.configuratorSettings?.length) {
      setVariants([]);
      setVariantsLoaded(true);
      return;
    }
    setVariantsLoaded(false);
    getProductVariants(shopwareProduct.id).then((res) => {
      setVariants(res?.elements || []);
      setVariantsLoaded(true);
    });
  }, [shopwareProduct?.id]);

  // Trova la variante che corrisponde alle opzioni selezionate
  const activeVariant = useMemo(() => {
    if (!variants.length || !Object.keys(selectedOptions).length) return null;
    const selectedIds = Object.values(selectedOptions);
    return variants.find((v) =>
      selectedIds.every((id) => v.options?.some((o) => o.id === id))
    ) || null;
  }, [variants, selectedOptions]);

  const hasApiProduct = Boolean(shopwareProduct);
  const isSoldOut = hasApiProduct && resolveProductSoldOut({
    product: shopwareProduct,
    hasConfigurator,
    activeVariant,
    variants,
    variantsLoaded,
  });

  // Scheda catalogo Capperificio: fallback locale quando Shopware non ha ancora
  // description / properties / customFields popolati per questo prodotto.
  const catalogEntry = useMemo(() => getCatalogEntry(shopwareProduct), [shopwareProduct]);

  const productName = hasApiProduct
    ? (shopwareProduct.translated?.name || shopwareProduct.name)
    : FALLBACK_PRODUCT.name;

  const productDescription = (hasApiProduct
    ? (shopwareProduct.translated?.description || shopwareProduct.description)
    : null) || catalogEntry?.description || FALLBACK_PRODUCT.description;

  const productPrice = hasApiProduct
    ? (activeVariant?.calculatedPrice?.unitPrice
        || shopwareProduct.calculatedPrice?.unitPrice
        || shopwareProduct.price?.[0]?.gross
        || 0)
    : FALLBACK_PRICES[size];

  const rawMediaImages = (shopwareProduct?.media || [])
    .map((m) => proxyUrl(m.media?.url || m.url))
    .filter(Boolean);
  // Foto: 1) media Shopware  2) foto dal catalogo JSON  3) placeholder generico
  const catalogImages = catalogEntry?.images || [];
  const productImages = hasApiProduct
    ? (rawMediaImages.length
        ? rawMediaImages
        : (catalogImages.length ? catalogImages : [getProductImage(shopwareProduct)]))
    : (catalogImages.length ? catalogImages : FALLBACK_PRODUCT.images);

  const PROPERTY_ORDER = ['Origine', 'Ingredienti', 'Calibro', 'Tipo', 'Formato', 'Peso netto', 'Note di gusto', 'Ideale per'];
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

  // Scheda tecnica da mostrare nel primo screen:
  // 1) Proprietà reali da Shopware  2) catalogo locale  3) (nessuna → fallback caffè)
  // I valori array (es. "Note di gusto") vengono resi su più righe.
  const techRows = sortedProperties.length > 0
    ? sortedProperties
    : (catalogEntry?.properties || []);

  const crossSellings = hasApiProduct
    ? (shopwareProduct.crossSellings || []).flatMap((cs) =>
        (cs.assignedProducts || []).map((ap) => ap.product).filter(Boolean)
      ).filter((p) => !B2B_CATEGORY_ID || !p.categoryTree?.includes(B2B_CATEGORY_ID))
    : [];

  const { products: shopwareRelated } = useProducts({ limit: 20 });

  const alsoLikeProducts = (() => {
    if (crossSellings.length > 0) {
      return groupVariants(crossSellings).slice(0, 4).map(mapRelatedProduct);
    }
    const fromApi = groupVariants(
      shopwareRelated
        .filter((p) => p.id !== shopwareProduct?.id)
        .filter((p) => !B2B_CATEGORY_ID || !p.categoryTree?.includes(B2B_CATEGORY_ID))
    ).slice(0, 4).map(mapRelatedProduct);
    return fromApi.length > 0 ? fromApi : ALSO_LIKE_FALLBACK;
  })();

  const unitPrice = hasApiProduct ? productPrice : FALLBACK_PRICES[size];

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40 && imgIndex < productImages.length - 1) setImgIndex((i) => i + 1);
    if (dx > 40 && imgIndex > 0) setImgIndex((i) => i - 1);
    touchStartX.current = null;
  };

  const purchasePanel = (
    <>
      <h1 className={styles.pdpTitle}>{productName}</h1>
      {(() => {
        const calibro = shopwareProduct?.customFields?.capperificio_calibro || catalogEntry?.calibro;
        if (!calibro || hasConfigurator) return null;
        return <span className={styles.calibroTag}>{calibro}</span>;
      })()}
      <div className={styles.pdpPrice}>
        {hasApiProduct ? formatPrice(unitPrice) : `$${unitPrice.toFixed(2)}`}
      </div>

      {hasApiProduct && hasConfigurator && (
        <div className={styles.optionGroups}>
          {Object.entries(configuratorGroups).map(([groupName, options]) => (
            <div key={groupName} className={styles.optionGroup}>
              <div className={styles.optionChips}>
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    className={`${styles.optionChip} ${selectedOptions[groupName] === opt.id ? styles.optionChipSelected : ''}`}
                    onClick={() => {
                      setSelectedOptions((prev) => ({ ...prev, [groupName]: opt.id }));
                      cancelAddRef.current = true;
                      setCartQty(0);
                      setShowControl(false);
                      setShowTag(false);
                      if (debounceRef.current) clearTimeout(debounceRef.current);
                    }}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSoldOut ? (
        <div className={styles.btnSoldOut}>Temporaneamente esaurito</div>
      ) : showControl ? (
        <div className={styles.pdpQtyControl}>
          <button className={styles.pdpQtyBtn} onClick={handleDecrease} aria-label="Decrease">−</button>
          <span className={styles.pdpQtyNum}>{cartQty}</span>
          <button className={styles.pdpQtyBtn} onClick={handleAdd} aria-label="Increase">+</button>
        </div>
      ) : showTag ? (
        <button
          className={styles.pdpCartTag}
          onClick={() => { setShowTag(false); setShowControl(true); scheduleCollapse(cartQty); }}
        >
          Nel carrello · {cartQty}
        </button>
      ) : (
        <button className={styles.btnAddCart} onClick={handleAdd}>
          Aggiungi al carrello <span>→</span> {hasApiProduct ? formatPrice(unitPrice) : `$${unitPrice.toFixed(2)}`}
        </button>
      )}

      <ul className={styles.trustList}>
        <li>Lavorato Artigianalmente</li>
        <li>Spedizione Gratuita sopra €50</li>
        <li>Consegna in 24–48h</li>
      </ul>
    </>
  );

  if (loading) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', color: '#999' }}>Caricamento prodotto...</p>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link to="/">Home</Link><span className={styles.sep}>/</span>
        <Link to="/collections/all">Tutti i prodotti</Link><span className={styles.sep}>/</span>
        <span>{productName}</span>
      </div>

      {/* Product section — 3 columns desktop / stacked mobile */}
      <section className={styles.productSection}>
        {/* LEFT COL */}
        <div className={styles.colLeft}>
          <p className={styles.description} dangerouslySetInnerHTML={{ __html: productDescription }} />

          {techRows.length > 0 ? (
            <table className={styles.infoTable}>
              <tbody>
                {techRows.map(([group, values]) => {
                  const list = Array.isArray(values) ? values : [values];
                  const multiline = group === 'Note di gusto' || group === 'Tasting notes';
                  return (
                    <tr key={group}>
                      <td>{group}</td>
                      <td>
                        {multiline
                          ? list.map((v, i) => <span key={i}>{v}{i < list.length - 1 && <br />}</span>)
                          : list.join(', ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className={styles.infoTable}>
              <tbody>
                <tr><td>Origine</td><td>Racale (Salento, Puglia)</td></tr>
                <tr><td>Ingredienti</td><td>Capperi 80% – Sale marino integrale 20%</td></tr>
                <tr><td>Note di gusto</td><td>Sapido<br/>Mediterraneo<br/>Aromatico</td></tr>
                <tr><td>Ideale per</td><td>Insalate, primi piatti, salse</td></tr>
                <tr><td>Conservazione</td><td>Luogo fresco e asciutto</td></tr>
              </tbody>
            </table>
          )}

          <div className={styles.sectionTitle}>Suggerimenti d'uso</div>

          <div className={styles.brewAccordion}>
            {(() => {
              const cf = shopwareProduct?.customFields || {};
              const hasBrewCustomFields = BREW_CUSTOM_FIELDS.some(({ key }) => cf[key]);
              // Sezioni "Suggerimenti d'uso": 1) custom field Shopware
              // 2) accordion del catalogo locale  3) (fallback ricette caffè)
              const sections = hasBrewCustomFields
                ? BREW_CUSTOM_FIELDS.filter(({ key }) => cf[key]).map(({ key, name }) => ({ name, html: cf[key] }))
                : (catalogEntry?.accordion || []);
              if (sections.length) {
                return sections.map(({ name, html }) => {
                  const isOpen = openBrew === name;
                  return (
                    <div key={name} className={styles.brewItem}>
                      <button className={styles.brewToggle} onClick={() => setOpenBrew(isOpen ? null : name)}>
                        <span>{name}</span>
                        <span className={`${styles.brewIcon} ${isOpen ? styles.brewIconOpen : ''}`}>+</span>
                      </button>
                      {isOpen && (
                        <div className={styles.brewContent}>
                          <p dangerouslySetInnerHTML={{ __html: html }} />
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

        {/* CENTER COL — desktop: stacked images / mobile: swipe slider */}
        <div className={styles.colCenter}>
          {/* Desktop stacked images */}
          <div className={styles.desktopImages}>
            {productImages.map((src, i) => (
              <div key={i} className={`${styles.productImage} ${anim.imgZoom}`}>
                <img src={src} alt={`${productName} — ${i + 1}`} className={styles.pdpImg} />
              </div>
            ))}
          </div>

          {/* Mobile slider */}
          <div
            className={styles.mobileSlider}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={styles.mobileSliderTrack}
              style={{ transform: `translateX(-${imgIndex * 100}%)` }}
            >
              {productImages.map((src, i) => (
                <div key={i} className={styles.mobileSlide}>
                  <img src={src} alt={`${productName} — ${i + 1}`} className={styles.mobileSlideImg} />
                </div>
              ))}
            </div>
            {productImages.length > 1 && (
              <div className={styles.sliderDots}>
                {productImages.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.sliderDot} ${i === imgIndex ? styles.sliderDotActive : ''}`}
                    onClick={() => setImgIndex(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mobile: product info right below the slider */}
          <div className={styles.mobileInfo}>
            {purchasePanel}
          </div>
        </div>

        {/* RIGHT COL — desktop only */}
        <div className={styles.colRight}>
          {purchasePanel}
        </div>
      </section>

      {/* Mobile sticky Aggiungi al carrello */}
      <div className={`${styles.mobileSticky} ${stickyVisible ? styles.mobileStickyShow : ''}`}>
        <div className={styles.mobileStickyInner}>
          <div>
            <div className={styles.mobileStickyName}>{productName}</div>
            <div className={styles.mobileStickyPrice}>
              {hasApiProduct ? formatPrice(unitPrice) : `$${unitPrice.toFixed(2)}`}
            </div>
          </div>
          {isSoldOut ? (
            <div className={styles.mobileStickyBtnSoldOut}>Esaurito</div>
          ) : showControl ? (
            <div className={styles.pdpQtyControl}>
              <button className={styles.pdpQtyBtn} onClick={handleDecrease} aria-label="Decrease">−</button>
              <span className={styles.pdpQtyNum}>{cartQty}</span>
              <button className={styles.pdpQtyBtn} onClick={handleAdd} aria-label="Increase">+</button>
            </div>
          ) : showTag ? (
            <button
              className={styles.pdpCartTag}
              onClick={() => { setShowTag(false); setShowControl(true); scheduleCollapse(cartQty); }}
            >
              Nel carrello · {cartQty}
            </button>
          ) : (
            <button className={styles.mobileStickyBtn} onClick={handleAdd}>
              Aggiungi al carrello →
            </button>
          )}
        </div>
      </div>

      {/* You may also like */}
      <section ref={alsoLikeSectionRef} className={styles.alsoLikeSection}>
        <SectionHeader label="Ti potrebbe piacere" title="Prodotti correlati" />
        <div ref={alsoLikeGridRef} className={`${styles.alsoLikeGrid} ${alsoLikeGridInView ? styles.alsoLikeGridVisible : ''}`}>
          {alsoLikeProducts.map((product) => (
            <ProductCard
              key={product.id || product.name}
              {...product}
            />
          ))}
        </div>
      </section>
    </>
  );
}
