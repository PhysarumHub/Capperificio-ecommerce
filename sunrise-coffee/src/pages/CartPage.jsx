import { Link } from 'react-router-dom';
import { useCartContext, useCustomerContext } from '../context/ShopwareContext';
import { formatPrice } from '../lib/utils/price';
import { getProductImage, proxyUrl } from '../lib/utils/image';

function getVariantLabel(item) {
  const options = item.payload?.options;
  if (!options?.length) return null;
  return options.map((o) => o.option).filter(Boolean).join(' · ');
}

export default function CartPage() {
  const { cart, loading, error, updateQuantity, removeItem, mergeUpdate, removeItems, clearCart, itemCount, positionPrice } = useCartContext();
  const { isB2B } = useCustomerContext();
  const netPrice = cart?.price?.netPrice ?? 0;
  const totalTax = (cart?.price?.calculatedTaxes ?? []).reduce((s, t) => s + (t.tax ?? 0), 0);
  const displayTotal = isB2B ? netPrice : positionPrice;

  if (loading && !cart) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)' }}>Caricamento carrello...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-red)' }}>{error}</p>
        <Link to="/" style={{ color: 'var(--color-red)', textDecoration: 'underline' }}>Continua lo shopping</Link>
      </div>
    );
  }

  const rawItems = (cart?.lineItems || []).filter((item) => item.type === 'product');

  // Group duplicate line items for the same product into one row
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

  const handleUpdateQty = (group, newQty) => {
    const [firstId, ...duplicates] = group._allIds;
    mergeUpdate(firstId, newQty, duplicates);
  };

  const handleRemoveGroup = (group) => removeItems(group._allIds);

  if (lineItems.length === 0) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)', marginBottom: 16 }}>Il carrello è vuoto</h1>
        <p style={{ marginBottom: 24, color: '#666' }}>Non hai ancora aggiunto nessun prodotto.</p>
        <Link
          to="/collections/all"
          style={{
            display: 'inline-block',
            background: 'var(--color-red)',
            color: '#fff',
            padding: '14px 32px',
            borderRadius: 'var(--radius-pill)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Vai allo shop
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)', marginBottom: 32 }}>
        Il tuo carrello ({itemCount})
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {lineItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              gap: 20,
              padding: '20px 0',
              borderBottom: '1px solid var(--color-border)',
              alignItems: 'center',
            }}
          >
            <img
              src={proxyUrl(item.cover?.url) || getProductImage(item)}
              alt={item.label}
              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-lg)', marginBottom: 4 }}>
                {item.label}
              </h3>
              {getVariantLabel(item) && (
                <span style={{
                  display: 'inline-block', fontSize: 12, color: '#666',
                  background: '#eee', borderRadius: 20, padding: '2px 10px', marginBottom: 4,
                }}>
                  {getVariantLabel(item)}
                </span>
              )}
              <p style={{ color: '#666', fontSize: 14 }}>
                {formatPrice(isB2B ? item.price?.netPrice : item.price?.unitPrice)}
                {isB2B && <span style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}>+ IVA</span>}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => handleUpdateQty(item, Math.max(1, item.quantity - 1))}
                style={{ width: 32, height: 32, border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', borderRadius: 4 }}
              >
                &minus;
              </button>
              <span style={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
              <button
                onClick={() => handleUpdateQty(item, item.quantity + 1)}
                style={{ width: 32, height: 32, border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', borderRadius: 4 }}
              >
                +
              </button>
            </div>
            <div style={{ minWidth: 80, textAlign: 'right', fontWeight: 600 }}>
              {formatPrice(isB2B ? (item.price?.netPrice ?? 0) * item.quantity : item._totalPrice)}
            </div>
            <button
              onClick={() => handleRemoveGroup(item)}
              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 18 }}
              aria-label="Remove item"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={clearCart}
          style={{ background: 'none', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: 'var(--radius-pill)', cursor: 'pointer' }}
        >
          Svuota carrello
        </button>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>{isB2B ? 'Subtotale (netto)' : 'Subtotale'}</p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
            {formatPrice(displayTotal)}
          </p>
          {isB2B && (
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              IVA {formatPrice(totalTax)} · Totale {formatPrice(positionPrice)}
            </p>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
        <Link
          to="/collections/all"
          style={{
            padding: '14px 28px',
            border: '1px solid var(--color-red)',
            color: 'var(--color-red)',
            borderRadius: 'var(--radius-pill)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Continua lo shopping
        </Link>
        <Link
          to="/checkout"
          style={{
            padding: '14px 28px',
            background: 'var(--color-red)',
            color: '#fff',
            borderRadius: 'var(--radius-pill)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Checkout →
        </Link>
      </div>
    </div>
  );
}
