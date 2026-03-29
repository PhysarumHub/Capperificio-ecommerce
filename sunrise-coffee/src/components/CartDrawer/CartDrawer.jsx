import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCartContext, useCustomerContext } from '../../context/ShopwareContext';
import { formatPrice } from '../../lib/utils/price';
import { getProductImage, proxyUrl } from '../../lib/utils/image';
import styles from './CartDrawer.module.css';

const FREE_SHIPPING_THRESHOLD = 50;

function getVariantLabel(item) {
  const options = item.payload?.options;
  if (!options?.length) return null;
  return options.map((o) => o.option).filter(Boolean).join(' · ');
}

export default function CartDrawer({ open, onClose }) {
  const { cart, loading, updateQuantity, removeItem, optimisticMerge, mergeUpdate, removeItems, itemCount, totalPrice, positionPrice } = useCartContext();
  const { isB2B } = useCustomerContext();
  const netPrice = cart?.price?.netPrice ?? 0;
  const totalTax = (cart?.price?.calculatedTaxes ?? []).reduce((s, t) => s + (t.tax ?? 0), 0);
  const displayTotal = isB2B ? netPrice : positionPrice;

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rawItems = (cart?.lineItems || []).filter((item) => item.type === 'product');

  const groupedMap = {};
  rawItems.forEach((item) => {
    const key = item.referencedId || item.id;
    if (!groupedMap[key]) {
      groupedMap[key] = { ...item, _allIds: [item.id], _totalPrice: item.price?.totalPrice || 0 };
    } else {
      groupedMap[key].quantity += item.quantity;
      groupedMap[key]._totalPrice += item.price?.totalPrice || 0;
      groupedMap[key]._allIds.push(item.id);
    }
  });
  const lineItems = Object.values(groupedMap);

  // Optimistic update instantly, debounce API call to coalesce rapid clicks
  const apiTimers = useRef({});
  const latestQty = useRef({});

  const handleUpdateQty = (group, newQty) => {
    const [firstId, ...duplicates] = group._allIds;
    latestQty.current[firstId] = { newQty, duplicates };

    // Instant visual feedback — no waiting for API
    optimisticMerge(firstId, newQty, duplicates);

    // Debounce: only fire API once user stops clicking for 350ms
    clearTimeout(apiTimers.current[firstId]);
    apiTimers.current[firstId] = setTimeout(async () => {
      const { newQty: qty, duplicates: dups } = latestQty.current[firstId];
      delete apiTimers.current[firstId];
      delete latestQty.current[firstId];
      await mergeUpdate(firstId, qty, dups);
      // Se l'utente ha cliccato mentre l'API era in volo, ri-applica l'ottimistico
      // per evitare che la risposta del server sovrascriva lo stato più recente
      if (latestQty.current[firstId]) {
        const { newQty: pendingQty, duplicates: pendingDups } = latestQty.current[firstId];
        optimisticMerge(firstId, pendingQty, pendingDups);
      }
    }, 350);
  };
  const handleRemove = (group) => removeItems(group._allIds);

  const remaining = FREE_SHIPPING_THRESHOLD - (positionPrice || 0);
  const freeShippingUnlocked = remaining <= 0;

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-label="Carrello"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>
            Il tuo carrello{itemCount > 0 ? ` · ${itemCount}` : ''}
          </span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Chiudi carrello">✕</button>
        </div>

        {/* Shipping progress bar */}
        <div className={styles.shippingBar}>
          {freeShippingUnlocked ? (
            <span className={styles.shippingMsg}>Hai sbloccato la spedizione gratuita! 🎉</span>
          ) : (
            <span className={styles.shippingMsg}>
              Aggiungi <strong>{formatPrice(remaining)}</strong> per la spedizione gratuita
            </span>
          )}
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{ width: `${Math.min(100, ((positionPrice || 0) / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
            />
          </div>
        </div>

        {/* Items */}
        <div className={styles.items}>
          {loading && !cart ? (
            <p className={styles.empty}>Caricamento...</p>
          ) : lineItems.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.empty}>Il carrello è vuoto</p>
              <Link to="/collections/all" className={styles.shopLink} onClick={onClose}>
                Vai allo shop →
              </Link>
            </div>
          ) : (
            lineItems.map((item) => (
              <div key={item.id} className={styles.item}>
                <img
                  src={proxyUrl(item.cover?.url) || getProductImage(item)}
                  alt={item.label}
                  className={styles.itemImg}
                />
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.label}</span>
                  {getVariantLabel(item) && (
                    <span className={styles.itemVariant}>{getVariantLabel(item)}</span>
                  )}
                  <span className={styles.itemPrice}>{formatPrice(isB2B ? item.price?.unitPrice / (1 + (item.price?.taxRules?.[0]?.taxRate ?? 22) / 100) : item.price?.unitPrice)}</span>
                  <div className={styles.itemQty}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => handleUpdateQty(item, Math.max(1, item.quantity - 1))}
                    >−</button>
                    <span className={styles.qtyNum}>{item.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => handleUpdateQty(item, item.quantity + 1)}
                    >+</button>
                  </div>
                  <button className={styles.removeBtn} onClick={() => handleRemove(item)}>
                    Rimuovi
                  </button>
                </div>
                <span className={styles.itemTotal}>{formatPrice(isB2B ? item.price?.netPrice * item.quantity : item._totalPrice)}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {lineItems.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.subtotal}>
              <span>{isB2B ? 'Subtotale (netto)' : 'Subtotale'}</span>
              <span className={styles.subtotalPrice}>{formatPrice(displayTotal)}</span>
            </div>
            {isB2B && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-mid)', marginTop: -6 }}>
                <span>IVA</span>
                <span>{formatPrice(totalTax)}</span>
              </div>
            )}
            <p className={styles.taxNote}>{isB2B ? 'Prezzi IVA esclusa · spedizione calcolata al checkout' : 'Tasse e spedizione calcolate al checkout'}</p>
            <Link to="/checkout" className={styles.checkoutBtn} onClick={onClose}>
              Checkout →
            </Link>
            <Link to="/cart" className={styles.viewCartLink} onClick={onClose}>
              Visualizza carrello completo
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
