import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartContext } from '../../context/ShopwareContext';
import { getCartQuantity } from '../../lib/utils/availability';
import styles from './ProductCard.module.css';

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h8.2a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20.5" r="1.4" />
      <circle cx="17.5" cy="20.5" r="1.4" />
    </svg>
  );
}

export default function ProductCard({
  id,
  name,
  slug,
  price,
  oldPrice,
  image,
  hoverImage,
  badge,
  badgeColor,
  options,
  sizes,
  variantMap = {},
  availabilityMap = {},
  variant = 'default',
  soldOut = false,
  children,
}) {
  const { addItem, removeItem, cart } = useCartContext();
  const [qty, setQty] = useState(0);
  const [showControl, setShowControl] = useState(false);
  const [showTag, setShowTag] = useState(false);
  const debounceRef = useRef(null);

  const variantList = options?.length ? options : sizes ? [sizes] : null;

  const hasPerVariantAvailability = Object.keys(availabilityMap).length > 0;

  // Default sulla prima variante acquistabile: partire da una esaurita quando
  // altri formati sono disponibili nasconde il prodotto senza motivo.
  const defaultVariant = variantList
    ? (variantList.find((v) => availabilityMap[v] !== false) ?? variantList[0])
    : null;
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);

  // Sold-out for the currently selected state:
  // 1. Whole product sold-out (soldOut prop from parent)
  // 2. Per-variant: explicit false in availabilityMap for this option
  // 3. No per-variant data: fall back to the product-level soldOut
  const isCurrentVariantSoldOut = soldOut || (
    hasPerVariantAvailability && selectedVariant
      ? availabilityMap[selectedVariant] === false
      : false
  );

  // For variant products: only allow direct-add when we have the specific child variant ID.
  // When variantMap is empty (Shopware doesn't include children in listings), adding the
  // parent product ID to cart would be wrong — the card Link leads to the PDP instead.
  const directCartId = variantList
    ? ((selectedVariant && variantMap[selectedVariant]) || null)
    : id;
  const canDirectAdd = Boolean(directCartId) && !isCurrentVariantSoldOut;

  // Il carrello è la verità: Shopware risponde 200 anche quando riduce o rifiuta
  // la riga (stock esaurito), quindi il contatore ottimistico va riallineato.
  const showControlRef = useRef(false);
  showControlRef.current = showControl;
  useEffect(() => {
    if (!cart || !directCartId) return;
    const realQty = getCartQuantity(cart, directCartId);
    setQty(realQty);
    if (realQty === 0) {
      setShowControl(false);
      setShowTag(false);
    } else if (!showControlRef.current) {
      setShowTag(true);
    }
  }, [cart, directCartId]);

  const base = `/product/${slug || name.toLowerCase().replace(/\s+/g, '-')}`;
  const href = selectedVariant ? `${base}?variant=${encodeURIComponent(selectedVariant)}` : base;

  const handleVariantClick = (e, v) => {
    e.preventDefault();
    e.stopPropagation();
    if (v === selectedVariant) return;
    setSelectedVariant(v);
    setQty(0);
    setShowControl(false);
    setShowTag(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
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
    if (!canDirectAdd) return;
    const next = qty + 1;
    setQty(next);
    setShowControl(true);
    setShowTag(false);
    try {
      await addItem(directCartId, 1);
      scheduleCollapse(next);
    } catch {
      setQty(qty);
      if (qty === 0) { setShowControl(false); setShowTag(false); }
    }
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
      if (directCartId && cart) {
        const lineItem = cart.lineItems?.find((li) => li.referencedId === directCartId);
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

  const control = isCurrentVariantSoldOut ? (
    <span className={styles.soldOutBadge}>Esaurito</span>
  ) : showControl ? (
    <div className={styles.qtyControl} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <button className={styles.qtyBtn} onClick={handleDecrease} aria-label="Riduci">−</button>
      <span className={styles.qtyNum}>{qty}</span>
      <button className={styles.qtyBtn} onClick={handleAdd} aria-label="Aumenta">+</button>
    </div>
  ) : showTag ? (
    <button className={styles.cartTag} onClick={handleTagClick} aria-label="Nel carrello">
      Nel carrello · {qty}
    </button>
  ) : canDirectAdd ? (
    <button className={styles.addToCart} onClick={handleAdd} aria-label="Aggiungi al carrello">
      <CartIcon />
    </button>
  ) : null;

  const variantChips = variantList && (
    <div className={styles.variants}>
      {variantList.map((v, i) => {
        const chipSoldOut = hasPerVariantAvailability && availabilityMap[v] === false;
        return (
          <button
            key={i}
            className={[
              styles.variantChip,
              selectedVariant === v ? styles.variantChipSelected : '',
              chipSoldOut ? styles.variantChipSoldOut : '',
            ].filter(Boolean).join(' ')}
            onClick={(e) => handleVariantClick(e, v)}
            aria-pressed={selectedVariant === v}
            aria-disabled={chipSoldOut}
          >
            {v}
          </button>
        );
      })}
    </div>
  );

  if (variant === 'merch') {
    return (
      <div className={styles.card}>
        <div className={`${styles.imgWrap} ${styles.imgSquare}`}>
          {image ? <img src={image} alt={name} className={styles.productImg} loading="lazy" decoding="async" /> : children}
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
          <img src={image} alt={name} className={styles.productImg} loading="lazy" decoding="async" />
        ) : (
          <div className={styles.imgPlaceholder} />
        )}
        {hoverImage && (
          <img src={hoverImage} alt="" aria-hidden="true" className={styles.hoverImg} loading="lazy" decoding="async" />
        )}
        {control}
      </div>
      <div className={styles.info}>
        <div className={styles.infoLeft}>
          <span className={styles.name}>{name}</span>
          {variantChips}
        </div>
        <div className={styles.pricing}>
          <span className={styles.price}>
            {oldPrice ? `In saldo · ${price}` : price}
          </span>
        </div>
      </div>
    </Link>
  );
}
