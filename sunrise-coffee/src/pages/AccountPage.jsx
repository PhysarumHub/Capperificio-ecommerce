import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCustomerContext } from '../context/ShopwareContext';
import { getOrders } from '../lib/api/customer';
import { formatPrice } from '../lib/utils/price';
import { proxyUrl } from '../lib/utils/image';

export default function AccountPage() {
  const { isLoggedIn, loading, logout, customer } = useCustomerContext();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return <AccountDashboard customer={customer} logout={logout} />;
}

// ── Stato badge ────────────────────────────────────────────
const ORDER_STATES = {
  open:        { label: 'Ricevuto',       color: '#f59e0b', bg: '#fef3c7' },
  in_progress: { label: 'In lavorazione', color: '#3b82f6', bg: '#eff6ff' },
  completed:   { label: 'Completato',     color: '#16a34a', bg: '#dcfce7' },
  cancelled:   { label: 'Annullato',      color: '#dc2626', bg: '#fee2e2' },
};

const DELIVERY_STATES = {
  open:               { label: 'Da spedire',  color: '#f59e0b', bg: '#fef3c7' },
  shipped:            { label: 'Spedito',      color: '#3b82f6', bg: '#eff6ff' },
  delivered:          { label: 'Consegnato',   color: '#16a34a', bg: '#dcfce7' },
  returned:           { label: 'Reso',         color: '#dc2626', bg: '#fee2e2' },
  returned_partially: { label: 'Reso parz.',   color: '#f59e0b', bg: '#fef3c7' },
  cancelled:          { label: 'Annullato',    color: '#dc2626', bg: '#fee2e2' },
};

const PAYMENT_STATES = {
  open:       { label: 'In attesa',  color: '#f59e0b', bg: '#fef3c7' },
  paid:       { label: 'Pagato',     color: '#16a34a', bg: '#dcfce7' },
  cancelled:  { label: 'Annullato',  color: '#dc2626', bg: '#fee2e2' },
  refunded:   { label: 'Rimborsato', color: '#6366f1', bg: '#eef2ff' },
  authorized: { label: 'Autorizzato',color: '#3b82f6', bg: '#eff6ff' },
};

function Badge({ stateKey, map }) {
  const s = map[stateKey] || { label: stateKey || '—', color: '#888', bg: '#f3f4f6' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 100,
      fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
      color: s.color, background: s.bg,
    }}>
      {s.label}
    </span>
  );
}

// ── Riga prodotto ──────────────────────────────────────────
function OrderItem({ item }) {
  const img = item.cover?.url ? proxyUrl(item.cover.url) : null;
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{
        width: 52, height: 52, borderRadius: 6, flexShrink: 0, overflow: 'hidden',
        background: '#f5f3f0', border: '1px solid var(--color-border)',
      }}>
        {img && <img src={img} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Qtà: {item.quantity}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
        {formatPrice(item.price?.totalPrice)}
      </div>
    </div>
  );
}

// ── Shipping step tracker ──────────────────────────────────
function ShippingTracker({ stateKey }) {
  const steps = [
    { key: 'open',      label: 'Ricevuto' },
    { key: 'shipped',   label: 'In spedizione' },
    { key: 'delivered', label: 'Consegnato' },
  ];
  const activeIdx = stateKey === 'delivered' ? 2 : stateKey === 'shipped' ? 1 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', margin: '12px 0 4px' }}>
      {steps.map((s, i) => {
        const done = i <= activeIdx;
        const active = i === activeIdx;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: done ? 'var(--color-red)' : '#e8e8e8',
                color: done ? '#fff' : '#aaa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 9, textTransform: 'uppercase', letterSpacing: '.04em',
                fontWeight: active ? 700 : 400,
                color: active ? 'var(--color-red)' : done ? '#555' : '#aaa',
              }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 16, margin: '0 6px 16px',
                background: i < activeIdx ? 'var(--color-red)' : '#e8e8e8',
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

  const products = (order.lineItems || []).filter(i => i.type === 'product');
  const delivery = order.deliveries?.[0];
  const transaction = order.transactions?.[0];
  const deliveryState = delivery?.stateMachineState?.technicalName;
  const paymentState = transaction?.stateMachineState?.technicalName;
  const orderState = order.stateMachineState?.technicalName;
  const trackingCodes = delivery?.trackingCodes || [];
  const shippingMethod = delivery?.shippingMethod?.translated?.name || delivery?.shippingMethod?.name;
  const date = new Date(order.orderDateTime || order.createdAt).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header card */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '16px 20px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              Ordine #{order.orderNumber}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
              {date} · {products.length} prodotto{products.length !== 1 ? 'i' : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {orderState && <Badge stateKey={orderState} map={ORDER_STATES} />}
              {deliveryState && <Badge stateKey={deliveryState} map={DELIVERY_STATES} />}
              {paymentState && <Badge stateKey={paymentState} map={PAYMENT_STATES} />}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--color-red)' }}>
              {formatPrice(order.amountTotal)}
            </div>
            <div style={{ fontSize: 18, color: '#aaa', marginTop: 8 }}>{open ? '▲' : '▾'}</div>
          </div>
        </div>
      </button>

      {/* Dettaglio espandibile */}
      {open && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 20px', background: '#faf9f7' }}>

          {/* Prodotti */}
          {products.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#888', marginBottom: 8 }}>
                Prodotti
              </div>
              {products.map(item => <OrderItem key={item.id} item={item} />)}
            </div>
          )}

          {/* Spedizione */}
          {delivery && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#888', marginBottom: 8 }}>
                Spedizione
              </div>
              {shippingMethod && (
                <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
                  📦 {shippingMethod}
                </div>
              )}
              <ShippingTracker stateKey={deliveryState} />
              {trackingCodes.length > 0 && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#888', marginBottom: 4 }}>
                    Tracking
                  </div>
                  {trackingCodes.map((code, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: 'var(--color-red)' }}>
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
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#888', marginBottom: 6 }}>
                  Indirizzo di consegna
                </div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>
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
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#888', marginBottom: 6 }}>
                Pagamento
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
                {transaction.paymentMethod?.translated?.name || transaction.paymentMethod?.name || 'Metodo di pagamento'}
                {paymentState && <Badge stateKey={paymentState} map={PAYMENT_STATES} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────
function AccountDashboard({ customer, logout }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(data?.elements || data?.orders?.elements || []))
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
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)' }}>Il mio account</h1>
        <button
          onClick={logout}
          style={{
            padding: '10px 22px', border: '1px solid var(--color-border)',
            background: '#fff', borderRadius: 'var(--radius-pill)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
          }}
        >
          Esci
        </button>
      </div>

      {/* Profilo */}
      <div style={{
        background: '#faf9f7', border: '1px solid var(--color-border)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 36,
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--color-red)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, flexShrink: 0,
        }}>
          {(customer?.firstName?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
            {customer?.firstName} {customer?.lastName}
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>{customer?.email}</div>
          {memberSince && (
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>Cliente dal {memberSince}</div>
          )}
        </div>
      </div>

      {/* Ordini */}
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 16 }}>
        Storico ordini
      </h2>

      {ordersLoading ? (
        <div style={{ color: '#aaa', padding: '32px 0', textAlign: 'center', fontSize: 14 }}>
          Caricamento ordini...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🛒</div>
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
