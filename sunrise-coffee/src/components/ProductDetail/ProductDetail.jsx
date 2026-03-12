import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard/ProductCard';
import SectionHeader from '../SectionHeader/SectionHeader';
import styles from './ProductDetail.module.css';

const SIZES = ['250g', '500g', '1kg'];
const GRINDS = ['Beans', 'Espresso', 'Stovetop', 'Plunger', 'Aeropress', 'Pour Over'];
const PRICES = { '250g': 25, '500g': 42, '1kg': 75 };

const BREW_RECIPES = [
  { name: 'Pour-over', rows: [['Coffee', '15g medium-fine'], ['Water', '250ml at 94°C'], ['Ratio', '1:16.6'], ['Bloom', '30ml, 30 sec'], ['Total time', '2:30 – 3:00']] },
  { name: 'Drip', rows: [['Coffee', '60g medium'], ['Water', '1L at 92–96°C'], ['Ratio', '1:16'], ['Total time', '4:00 – 5:00']] },
  { name: 'AeroPress', rows: [['Coffee', '14g fine-medium'], ['Water', '200ml at 92°C'], ['Ratio', '1:14'], ['Steep', '1:30, then press 30 sec']] },
  { name: 'Plunger / French Press', rows: [['Coffee', '30g coarse'], ['Water', '500ml at 96°C'], ['Ratio', '1:16'], ['Steep', '4:00, then plunge slowly']] },
];

const ALSO_LIKE = [
  { name: 'Day For It', image: '/images/PRODUCTSTILL.jpg', badge: 'New!' },
  { name: 'Buoi Sang', image: '/images/PRODUCTSTILL.jpg' },
  { name: "It's Golden", image: '/images/PRODUCTSTILL.jpg' },
  { name: 'Andean Sky', image: '/images/PRODUCTSTILL.jpg' },
];

export default function ProductDetail() {
  const [size, setSize] = useState('250g');
  const [grind, setGrind] = useState('Beans');
  const [qty, setQty] = useState(1);
  const [openBrew, setOpenBrew] = useState(null);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const feedbackTimeout = useRef(null);

  const unitPrice = PRICES[size];
  const totalPrice = unitPrice * qty;

  const handleAddToCart = () => {
    setAddedFeedback(true);
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setAddedFeedback(false), 1800);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link to="/">Home</Link><span className={styles.sep}>/</span>
        <Link to="/">All Coffee</Link><span className={styles.sep}>/</span>
        <span>Sweet Velvet</span>
      </div>

      {/* Product section — 3 columns */}
      <section className={styles.productSection}>
        {/* LEFT COL */}
        <div className={styles.colLeft}>
          <p className={styles.description}>
            Indulge in the luxurious charm of <em>Sweet Velvet</em>, a beautifully balanced filter
            coffee blend that combines washed and natural processes for a truly unique flavor
            experience. With its smooth notes of vanilla, buttery caramel sweetness, and the juicy
            vibrance of stone fruit, this coffee offers a delightful harmony of richness and
            brightness. Designed for pour-over or drip brewing, <em>Sweet Velvet</em> delivers a
            silky, aromatic cup that's as comforting as it is exquisite.
          </p>

          <ul className={styles.bullets}>
            <li>Freshly Roasted in Melbourne</li>
            <li>Free Standard Delivery over $50</li>
          </ul>

          <table className={styles.infoTable}>
            <tbody>
              <tr><td>Tasting notes</td><td>Vanilla<br/>Caramel<br/>Fruity</td></tr>
              <tr><td>Region</td><td>Various</td></tr>
              <tr><td>Type</td><td>Blend</td></tr>
              <tr><td>Best for</td><td>Filter</td></tr>
              <tr><td>Process</td><td>Washed &amp; Natural</td></tr>
            </tbody>
          </table>

          <div className={styles.sectionTitle}>Brew Recipes</div>
          <div className={styles.brewAccordion}>
            {BREW_RECIPES.map((recipe) => {
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
            })}
          </div>
        </div>

        {/* CENTER COL */}
        <div className={styles.colCenter}>
          <div className={styles.productImage}>
            <img src="/images/PRODUCTSTILL.jpg" alt="Sweet Velvet — bag" className={styles.pdpImg} />
          </div>
          <div className={styles.productImage}>
            <img src="/images/PRODUCTSTILL.jpg" alt="Sweet Velvet — detail" className={styles.pdpImg} />
          </div>
          <div className={styles.productImage}>
            <img src="/images/PRODUCTSTILL.jpg" alt="Sweet Velvet — beans" className={styles.pdpImg} />
          </div>
          <div className={styles.productImage}>
            <img src="/images/PRODUCTSTILL.jpg" alt="Sweet Velvet — lifestyle" className={styles.pdpImg} />
          </div>
        </div>

        {/* RIGHT COL */}
        <div className={styles.colRight}>
          <h1 className={styles.pdpTitle}>Sweet Velvet</h1>
          <div className={styles.pdpPrice}>${unitPrice.toFixed(2)}</div>

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
              {addedFeedback ? 'Added ✓' : <>Add to Cart <span>→</span> ${totalPrice.toFixed(2)}</>}
            </button>
          </div>

          <button className={styles.btnBuyNow}>
            Buy It Now <span>→</span>
          </button>
        </div>
      </section>

      {/* You may also like */}
      <section className={styles.alsoLikeSection}>
        <SectionHeader label="Recommended" title="You may also like" />
        <div className={styles.alsoLikeGrid}>
          {ALSO_LIKE.map((product) => (
            <ProductCard
              key={product.name}
              name={product.name}
              price="$25.00"
              image={product.image}
              badge={product.badge}
            />
          ))}
        </div>
      </section>
    </>
  );
}
