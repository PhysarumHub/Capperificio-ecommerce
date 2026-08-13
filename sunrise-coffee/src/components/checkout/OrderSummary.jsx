import { useState, useEffect } from 'react';
import { formatPrice } from '../../lib/utils/price';
import { getProductImage, proxyUrl } from '../../lib/utils/image';
import { getPromotionDiscount, getShippingCosts } from '../../lib/utils/promotion';
import { isShippingFree } from '../../lib/utils/shipping';
import CartStockNotices from '../CartStockNotices/CartStockNotices';
import PromoCode from '../PromoCode/PromoCode';
import { ChevronIcon, LockIcon, TruckIcon, MailIcon } from './CheckoutIcons';
import styles from './Checkout.module.css';

function getVariantLabel(item) {
  const options = item.payload?.options;
  if (!options?.length) return null;
  return options.map((o) => o.option).filter(Boolean).join(' · ');
}

/**
 * Raggruppa le righe che puntano allo stesso prodotto: Shopware può spezzare in
 * più line item lo stesso articolo, e nel riepilogo va mostrato come uno solo.
 */
function groupItems(cart) {
  const products = (cart?.lineItems ?? []).filter((i) => i.type === 'product');
  const grouped = products.reduce((acc, item) => {
    const key = item.referencedId || item.id;
    if (!acc[key]) acc[key] = { ...item, _total: item.price?.totalPrice ?? 0 };
    else {
      acc[key].quantity += item.quantity;
      acc[key]._total += item.price?.totalPrice ?? 0;
    }
    return acc;
  }, {});
  return Object.values(grouped);
}

/**
 * Riepilogo dell'ordine: sticky accanto al form su desktop, collassabile in
 * cima alla pagina su mobile.
 */
export default function OrderSummary({ cart, totalPrice, isB2B, placing, onPromoChange }) {
  const [open, setOpen] = useState(false);

  // Su desktop il riepilogo è sempre aperto: il toggle esiste solo sotto i 900px.
  const [isCompact, setIsCompact] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = (e) => setIsCompact(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const items = groupItems(cart);
  // `positionPrice` include già gli sconti promozionali, che qui vanno su una
  // riga a parte: il subtotale si somma quindi dai soli prodotti.
  const subtotal = items.reduce((sum, i) => sum + (i._total ?? 0), 0);
  const promoDiscount = getPromotionDiscount(cart);   // ≤ 0
  const shippingCost = getShippingCosts(cart);
  // Solo il costo reale calcolato da Shopware decide: la spedizione gratuita è
  // configurata per la sola Italia, quindi dedurla dal subtotale mostrerebbe
  // "Gratuita" su ordini esteri che invece la pagano.
  const freeShipping = isShippingFree(shippingCost);
  const totalTax = (cart?.lineItems ?? [])
    .filter((i) => i.type === 'product')
    .reduce((sum, item) =>
      sum + (item.price?.calculatedTaxes ?? []).reduce((s, t) => s + (t.tax ?? 0), 0), 0);

  const bodyVisible = !isCompact || open;

  return (
    <aside className={styles.summary} aria-label="Riepilogo ordine">
      <button
        type="button"
        className={styles.summaryToggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.summaryToggleLabel}>
          <ChevronIcon size={16} up={open} />
          {open ? 'Nascondi riepilogo' : 'Mostra riepilogo ordine'}
        </span>
        <span className={styles.summaryToggleTotal}>{formatPrice(totalPrice)}</span>
      </button>

      {bodyVisible && (
        <div className={styles.summaryBody}>
          <h2 className={styles.summaryTitle}>Il tuo ordine</h2>

          {/* Avvisi di stock: qui uno scostamento non gestito diventa un ordine fallito */}
          <CartStockNotices cart={cart} />

          <ul className={styles.items}>
            {items.map((item) => {
              const variant = getVariantLabel(item);
              return (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemThumb}>
                    <img
                      className={styles.itemImg}
                      src={proxyUrl(item.cover?.url) || getProductImage(item)}
                      alt=""
                      loading="lazy"
                      width={60}
                      height={60}
                    />
                    <span className={styles.itemQty}>{item.quantity}</span>
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.label}</p>
                    {variant && <p className={styles.itemVariant}>{variant}</p>}
                  </div>
                  <span className={styles.itemPrice}>{formatPrice(item._total)}</span>
                </li>
              );
            })}
          </ul>

          <PromoCode cart={cart} onChange={onPromoChange} disabled={placing} />

          <div className={styles.rule} />

          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Subtotale</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {promoDiscount !== 0 && (
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Sconto</span>
                <span className={styles.totalAccent}>{formatPrice(promoDiscount)}</span>
              </div>
            )}

            {isB2B && totalTax > 0 && (
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>IVA</span>
                <span>{formatPrice(totalTax)}</span>
              </div>
            )}

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Spedizione</span>
              {freeShipping
                ? <span className={styles.totalAccent}>Gratuita</span>
                : <span>{formatPrice(shippingCost)}</span>}
            </div>
          </div>

          <div className={styles.rule} />

          <div className={styles.grandTotal}>
            <span className={styles.grandTotalLabel}>Totale</span>
            <span className={styles.grandTotalValue}>{formatPrice(totalPrice)}</span>
          </div>
          {!isB2B && <p className={styles.taxNote}>IVA inclusa</p>}

          {/* Rassicurazioni concrete al posto del generico "Ordine sicuro":
              dicono cosa succede dopo, che è ciò che trattiene chi esita. */}
          <div className={styles.trust}>
            <p className={styles.trustItem}>
              <LockIcon size={16} />
              <span>Pagamento cifrato gestito da <strong>Stripe</strong>. I dati della carta non passano dai nostri server.</span>
            </p>
            {/* I tempi di consegna non sono scritti qui: li dichiara il metodo
                di spedizione scelto, sopra nel form. Ripeterli a mano voleva
                dire prometterne di diversi da quelli configurati su Shopware. */}
            <p className={styles.trustItem}>
              <TruckIcon size={16} />
              <span>Spedizione <strong>tracciata</strong>: il codice arriva via email alla partenza del pacco.</span>
            </p>
            <p className={styles.trustItem}>
              <MailIcon size={16} />
              <span>Email di conferma con il numero d’ordine <strong>subito dopo l’acquisto</strong>.</span>
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
