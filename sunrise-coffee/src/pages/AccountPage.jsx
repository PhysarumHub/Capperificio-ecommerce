import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCustomerContext } from '../context/ShopwareContext';
import { getOrders, submitReview } from '../lib/api/customer';
import { useSEO } from '../hooks/useSEO';
import { formatPrice } from '../lib/utils/price';
import { proxyUrl } from '../lib/utils/image';

export default function AccountPage() {
  useSEO({ title: 'Il mio Account', path: '/account', noindex: true });

  const { isLoggedIn, loading, logout, customer } = useCustomerContext();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return <AccountDashboard customer={customer} logout={logout} />;
}

// ── Solo due varianti: arancione (attivo/in corso) e nero (concluso/neutro) ──
const BADGE = {
  orange: { color: 'var(--color-red)',  bg: 'rgba(216,64,50,0.1)' },
  dark:   { color: 'var(--color-dark)', bg: '#f0eeeb' },
};

const ORDER_STATES = {
  open:        { label: 'Ricevuto',       variant: 'orange' },
  in_progress: { label: 'In lavorazione', variant: 'orange' },
  completed:   { label: 'Completato',     variant: 'dark'   },
  cancelled:   { label: 'Annullato',      variant: 'dark'   },
};

const DELIVERY_STATES = {
  open:               { label: 'In preparazione', variant: 'orange' },
  shipped:            { label: 'Spedito',          variant: 'dark'   },
  shipped_partially:  { label: 'Parz. spedito',    variant: 'orange' },
  returned:           { label: 'Reso',             variant: 'dark'   },
  returned_partially: { label: 'Reso parz.',       variant: 'dark'   },
  cancelled:          { label: 'Annullato',        variant: 'dark'   },
};

const PAYMENT_STATES = {
  open:       { label: 'In attesa',   variant: 'orange' },
  paid:       { label: 'Pagato',      variant: 'dark'   },
  authorized: { label: 'Autorizzato', variant: 'orange' },
  cancelled:  { label: 'Annullato',   variant: 'dark'   },
  refunded:   { label: 'Rimborsato',  variant: 'dark'   },
};

function Badge({ stateKey, map }) {
  const s = map[stateKey] || { label: stateKey || '—', variant: 'dark' };
  const b = BADGE[s.variant] || BADGE.dark;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 100,
      fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
      color: b.color, background: b.bg,
    }}>
      {s.label}
    </span>
  );
}

// ── Raggruppa i lineItems per referencedId ──────────────────
function groupItems(lineItems) {
  const map = {};
  (lineItems || []).filter(i => i.type === 'product').forEach(item => {
    const key = item.referencedId || item.id;
    const price = item.totalPrice ?? item.price?.totalPrice ?? 0;
    if (!map[key]) {
      map[key] = { ...item, _qty: item.quantity, _total: price };
    } else {
      map[key]._qty   += item.quantity;
      map[key]._total += price;
    }
  });
  return Object.values(map);
}

// ── Form recensione inline ─────────────────────────────────
function ReviewForm({ productId, onClose }) {
  const [points, setPoints]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!points) { setError('Seleziona un punteggio.'); return; }
    if (!title.trim()) { setError('Inserisci un titolo.'); return; }
    if (!content.trim()) { setError('Scrivi la tua recensione.'); return; }
    setSending(true); setError('');
    try {
      await submitReview(productId, { title: title.trim(), content: content.trim(), points });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Errore durante l\'invio. Riprova.');
    } finally {
      setSending(false);
    }
  };

  if (done) return (
    <div style={{ padding: '12px 14px', background: 'rgba(216,64,50,0.06)', borderRadius: 8, fontSize: 13, color: 'var(--color-red)', fontWeight: 600, marginTop: 8 }}>
      ✓ Recensione inviata, grazie!
    </div>
  );

  const star = (n) => {
    const filled = n <= (hovered || points);
    return (
      <span
        key={n}
        onMouseEnter={() => setHovered(n)}
        onMouseLeave={() => setHovered(0)}
        onClick={() => { setPoints(n); setError(''); }}
        style={{ fontSize: 22, cursor: 'pointer', color: filled ? 'var(--color-red)' : 'var(--color-border)', transition: 'color .15s', userSelect: 'none' }}
      >
        ★
      </span>
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 10, padding: '14px', background: '#fff', borderRadius: 8, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={sectionLabel}>La tua recensione</span>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-mid)', padding: 0 }}>✕</button>
      </div>

      {/* Stelle */}
      <div style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map(star)}</div>

      {/* Titolo */}
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Titolo (es. Ottimo caffè!)"
        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-border)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
      />

      {/* Testo */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Descrivi la tua esperienza..."
        rows={3}
        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-border)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
      />

      {error && <p style={{ fontSize: 12, color: 'var(--color-red)', margin: 0 }}>⚠ {error}</p>}

      <button
        type="submit"
        disabled={sending}
        style={{ padding: '10px 0', background: sending ? '#ccc' : 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}
      >
        {sending ? 'Invio...' : 'Invia recensione →'}
      </button>
    </form>
  );
}

// ── Riga prodotto ──────────────────────────────────────────
function OrderItem({ item, canReview }) {
  const [reviewing, setReviewing] = useState(false);
  const img = item.cover?.url ? proxyUrl(item.cover.url) : null;
  const productId = item.referencedId || item.id;

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: reviewing ? 12 : 0 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 6, flexShrink: 0,
          overflow: 'hidden', background: 'var(--color-light)',
          border: '1px solid var(--color-border)',
        }}>
          {img && <img src={img} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-dark)' }}>
            {item.label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-mid)', marginTop: 2 }}>Qtà: {item._qty}</div>
          {canReview && !reviewing && (
            <button
              onClick={() => setReviewing(true)}
              style={{ marginTop: 4, background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--color-red)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', textDecoration: 'underline' }}
            >
              Lascia una recensione
            </button>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, flexShrink: 0, color: 'var(--color-dark)' }}>
          {formatPrice(item._total)}
        </div>
      </div>
      {reviewing && <ReviewForm productId={productId} onClose={() => setReviewing(false)} />}
    </div>
  );
}

// ── Tracker spedizione ──────────────────────────────────────
function ShippingTracker({ stateKey }) {
  const steps = ['open', 'shipped'];
  const labels = ['In preparazione', 'Spedito'];
  const activeIdx = stateKey === 'shipped' || stateKey === 'shipped_partially' ? 1 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', margin: '12px 0 4px' }}>
      {steps.map((_, i) => {
        const done   = i <= activeIdx;
        const active = i === activeIdx;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: done ? 'var(--color-red)' : 'var(--color-border)',
                color: done ? '#fff' : 'var(--color-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 9, textTransform: 'uppercase', letterSpacing: '.04em',
                fontWeight: active ? 700 : 400,
                color: active ? 'var(--color-red)' : done ? 'var(--color-dark)' : 'var(--color-mid)',
              }}>
                {labels[i]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 6px 16px',
                background: i < activeIdx ? 'var(--color-red)' : 'var(--color-border)',
                transition: 'background .3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Card ordine espandibile ────────────────────────────────
function OrderCard({ order }) {
  const [open, setOpen] = useState(false);

  const grouped   = groupItems(order.lineItems);
  const delivery  = order.deliveries?.[0];
  const canReview = ['shipped', 'shipped_partially', 'completed'].includes(
    delivery?.stateMachineState?.technicalName || order.stateMachineState?.technicalName
  );
  const transaction = order.transactions?.[0];
  const deliveryState = delivery?.stateMachineState?.technicalName;
  const paymentState  = transaction?.stateMachineState?.technicalName;
  const orderState    = order.stateMachineState?.technicalName;
  const trackingCodes = delivery?.trackingCodes || [];
  const shippingMethod = delivery?.shippingMethod?.translated?.name || delivery?.shippingMethod?.name;
  const date = new Date(order.orderDateTime || order.createdAt).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>

      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '16px 20px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: 'var(--color-dark)' }}>
              Ordine #{order.orderNumber}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-mid)', marginBottom: 8 }}>
              {date} · {grouped.length} prodotto{grouped.length !== 1 ? 'i' : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {orderState    && <Badge stateKey={orderState}    map={ORDER_STATES}    />}
              {deliveryState && <Badge stateKey={deliveryState} map={DELIVERY_STATES} />}
              {paymentState  && <Badge stateKey={paymentState}  map={PAYMENT_STATES}  />}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--color-red)' }}>
              {formatPrice(order.amountTotal)}
            </div>
            <div style={{ fontSize: 16, color: 'var(--color-mid)', marginTop: 8 }}>{open ? '▲' : '▾'}</div>
          </div>
        </div>
      </button>

      {/* Dettaglio */}
      {open && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 20px', background: 'var(--color-light)' }}>

          {/* Prodotti raggruppati */}
          {grouped.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={sectionLabel}>Prodotti</div>
              {grouped.map(item => <OrderItem key={item.id} item={item} canReview={canReview} />)}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, fontWeight: 700, fontSize: 14, color: 'var(--color-dark)' }}>
                Totale: {formatPrice(order.amountTotal)}
              </div>
            </div>
          )}

          {/* Spedizione */}
          {delivery && (
            <div style={{ marginBottom: 16 }}>
              <div style={sectionLabel}>Spedizione</div>
              {shippingMethod && (
                <div style={{ fontSize: 13, color: 'var(--color-mid)', marginBottom: 6 }}>
                  {shippingMethod}
                </div>
              )}
              <ShippingTracker stateKey={deliveryState} />
              {trackingCodes.length > 0 && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <div style={sectionLabel}>Codice tracking</div>
                  {trackingCodes.map((code, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--color-red)', marginTop: 2 }}>
                      {code}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Indirizzo di consegna */}
          {delivery?.shippingOrderAddress && (() => {
            const a = delivery.shippingOrderAddress;
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={sectionLabel}>Indirizzo di consegna</div>
                <div style={{ fontSize: 13, color: 'var(--color-mid)', lineHeight: 1.8 }}>
                  <div>{a.firstName} {a.lastName}</div>
                  <div>{a.street}</div>
                  <div>{a.zipcode} {a.city}</div>
                </div>
              </div>
            );
          })()}

          {/* Pagamento */}
          {transaction && (
            <div>
              <div style={sectionLabel}>Pagamento</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-mid)' }}>
                {transaction.paymentMethod?.translated?.name || transaction.paymentMethod?.name || '—'}
                {paymentState && <Badge stateKey={paymentState} map={PAYMENT_STATES} />}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

const sectionLabel = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.07em', color: 'var(--color-mid)', marginBottom: 8,
};

// ── Dashboard ──────────────────────────────────────────────
function AccountDashboard({ customer, logout }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then(data => setOrders(data?.elements || data?.orders?.elements || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

  const memberSince = customer?.createdAt
    ? new Date(customer.createdAt).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)', color: 'var(--color-dark)' }}>
          Il mio account
        </h1>
        <button
          onClick={logout}
          style={{
            padding: '10px 22px', border: '1px solid var(--color-border)',
            background: '#fff', borderRadius: 'var(--radius-pill)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            fontWeight: 600, fontSize: 14, color: 'var(--color-dark)',
          }}
        >
          Esci
        </button>
      </div>

      {/* Profilo */}
      <div style={{
        background: 'var(--color-light)', border: '1px solid var(--color-border)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 36,
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--color-red)', color: '#fff', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700,
        }}>
          {(customer?.firstName?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2, color: 'var(--color-dark)' }}>
            {customer?.firstName} {customer?.lastName}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-mid)' }}>{customer?.email}</div>
          {memberSince && (
            <div style={{ fontSize: 12, color: 'var(--color-mid)', marginTop: 2 }}>
              Cliente dal {memberSince}
            </div>
          )}
        </div>
      </div>

      {/* Ordini */}
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 16, color: 'var(--color-dark)' }}>
        Storico ordini
      </h2>

      {ordersLoading ? (
        <div style={{ color: 'var(--color-mid)', padding: '32px 0', textAlign: 'center', fontSize: 14 }}>
          Caricamento ordini...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-mid)' }}>
          <p style={{ marginBottom: 20, fontSize: 15 }}>Non hai ancora effettuato ordini.</p>
          <Link
            to="/collections/all"
            style={{
              display: 'inline-block', background: 'var(--color-red)', color: '#fff',
              padding: '13px 32px', borderRadius: 'var(--radius-pill)',
              textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}
          >
            Vai allo shop →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}
