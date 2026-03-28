import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCartContext } from '../../context/ShopwareContext';
import styles from './ProductCard.module.css';

export default function ProductCard({
  id,
  name,
  slug,
  price,
  oldPrice,
  image,
  badge,
  badgeColor,
  options,
  sizes,
  variant = 'default',
  children,
}) {
  const { addItem, removeItem, cart } = useCartContext();
  const [qty, setQty] = useState(0);
  const [showControl, setShowControl] = useState(false);
  const [showTag, setShowTag] = useState(false);
  const debounceRef = useRef(null);

  const variantList = options?.length ? options : sizes ? [sizes] : null;
  const [selectedVariant, setSelectedVariant] = useState(variantList?.[0] ?? null);

  const base = `/product/${slug || name.toLowerCase().replace(/\s+/g, '-')}`;
  const href = selectedVariant ? `${base}?variant=${encodeURIComponent(selectedVariant)}` : base;

  const handleVariantClick = (e, v) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(v);
  };

  const scheduleCollapse = (currentQty) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (currentQty === 0) return;
    debounceRef.current = setTimeout(() => {
      setShowControl(false);
      setShowTag(true);
    }, 2000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = qty + 1;
    setQty(next);
    setShowControl(true);
    setShowTag(false);
    if (id) try { await addItem(id, 1); } catch {}
    scheduleCollapse(next);
  };

  const handleDecrease = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = qty - 1;
    setQty(next);
    if (next === 0) {
      setShowControl(false);
      setShowTag(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (id && cart) {
        const lineItem = cart.lineItems?.find((li) => li.referencedId === id);
        try { if (lineItem) await removeItem(lineItem.id); } catch {}
      }
    } else {
      scheduleCollapse(next);
    }
  };

  const handleTagClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTag(false);
    setShowControl(true);
    scheduleCollapse(qty);
  };

  const control = showControl ? (
    <div className={styles.qtyControl} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <button className={styles.qtyBtn} onClick={handleDecrease} aria-label="Riduci">−</button>
      <span className={styles.qtyNum}>{qty}</span>
      <button className={styles.qtyBtn} onClick={handleAdd} aria-label="Aumenta">+</button>
    </div>
  ) : showTag ? (
    <button className={styles.cartTag} onClick={handleTagClick} aria-label="Nel carrello">
      Nel carrello · {qty}
    </button>
  ) : (
    <button className={styles.addToCart} onClick={handleAdd} aria-label="Aggiungi al carrello">+</button>
  );

  if (variant === 'merch') {
    return (
      <div className={styles.card}>
        <div className={`${styles.imgWrap} ${styles.imgSquare}`}>
          {image ? <img src={image} alt={name} className={styles.productImg} /> : children}
          {control}
        </div>
        <div className={styles.merchFooter}>
          <span className={styles.merchName}>{name}</span>
          <span className={styles.merchPrice}>{price}</span>
        </div>
      </div>
    );
  }

  return (
    <Link to={href} className={styles.card}>
      <div className={styles.imgWrap}>
        {badge && (
          <span className={`${styles.badge} ${badgeColor === 'blue' ? styles.badgeBlue : ''}`}>
            {badge}
          </span>
        )}
        {image ? (
          <img src={image} alt={name} className={styles.productImg} />
        ) : (
          <div className={styles.imgPlaceholder} />
        )}
        {control}
      </div>
      <div className={styles.info}>
        <div className={styles.infoLeft}>
          <span className={styles.name}>{name}</span>
          {variantList && (
            <div className={styles.variants}>
              {variantList.map((v, i) => (
                <button
                  key={i}
                  className={`${styles.variantChip} ${selectedVariant === v ? styles.variantChipSelected : ''}`}
                  onClick={(e) => handleVariantClick(e, v)}
                  aria-pressed={selectedVariant === v}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.pricing}>
          {oldPrice && <span className={styles.oldPrice}>{oldPrice}</span>}
          <span className={styles.price}>
            {oldPrice ? `On Sale from ${price}` : `From ${price}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
