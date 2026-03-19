import { Link } from 'react-router-dom';
import { useCartContext } from '../context/ShopwareContext';
import { formatPrice } from '../lib/utils/price';
import { getProductImage } from '../lib/utils/image';

export default function CartPage() {
  const { cart, loading, error, updateQuantity, removeItem, clearCart, itemCount, totalPrice } = useCartContext();

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

  const lineItems = cart?.lineItems || [];

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
              borderBottom: '1px solid #eee',
              alignItems: 'center',
            }}
          >
            <img
              src={item.cover?.url || getProductImage(item)}
              alt={item.label}
              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-lg)', marginBottom: 4 }}>
                {item.label}
              </h3>
              <p style={{ color: '#666', fontSize: 14 }}>
                {formatPrice(item.price?.unitPrice)}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                style={{ width: 32, height: 32, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', borderRadius: 4 }}
              >
                &minus;
              </button>
              <span style={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                style={{ width: 32, height: 32, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', borderRadius: 4 }}
              >
                +
              </button>
            </div>
            <div style={{ minWidth: 80, textAlign: 'right', fontWeight: 600 }}>
              {formatPrice(item.price?.totalPrice)}
            </div>
            <button
              onClick={() => removeItem(item.id)}
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
          style={{ background: 'none', border: '1px solid #ccc', padding: '10px 20px', borderRadius: 'var(--radius-pill)', cursor: 'pointer' }}
        >
          Svuota carrello
        </button>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Subtotale</p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
            {formatPrice(totalPrice)}
          </p>
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
