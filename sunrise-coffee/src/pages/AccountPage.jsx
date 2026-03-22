import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCustomerContext } from '../context/ShopwareContext';
import { getOrders } from '../lib/api/customer';
import { formatPrice } from '../lib/utils/price';

export default function AccountPage() {
  const { isLoggedIn, loading, logout, customer } = useCustomerContext();

  if (loading) return null;

  if (!isLoggedIn) return <Navigate to="/" replace />;

  return <AccountDashboard customer={customer} logout={logout} />;
}

// ── Account dashboard ─────────────────────────────────────
function AccountDashboard({ customer, logout }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(data?.elements || data?.orders?.elements || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)' }}>Il mio account</h1>
        <button
          onClick={logout}
          style={{
            padding: '10px 24px',
            border: '1px solid #ddd',
            background: '#fff',
            borderRadius: 'var(--radius-pill)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Esci
        </button>
      </div>

      {/* Profile card */}
      <div style={{ background: '#f9f7f4', border: '1px solid var(--color-border)', padding: 24, borderRadius: 12, marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 12 }}>Profilo</h2>
        <p style={{ marginBottom: 4 }}>
          <strong>Nome:</strong> {customer?.firstName} {customer?.lastName}
        </p>
        <p>
          <strong>Email:</strong> {customer?.email}
        </p>
      </div>

      {/* Orders */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 20 }}>
          Storico ordini
        </h2>

        {ordersLoading ? (
          <p style={{ color: '#999' }}>Caricamento ordini...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <p style={{ marginBottom: 16 }}>Nessun ordine ancora.</p>
            <Link
              to="/collections/all"
              style={{
                display: 'inline-block',
                background: 'var(--color-red)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: 'var(--radius-pill)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Vai allo shop
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: '16px 20px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Ordine #{order.orderNumber}
                  </div>
                  <div style={{ fontSize: 13, color: '#888' }}>
                    {new Date(order.orderDateTime || order.createdAt).toLocaleDateString('it-IT')}
                    {' · '}
                    {order.lineItems?.length || 0} articolo/i
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {formatPrice(order.amountTotal)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 4,
                      color: order.stateMachineState?.name === 'completed' ? '#2C8843' : '#888',
                    }}
                  >
                    {order.stateMachineState?.translated?.name || order.stateMachineState?.name || 'In elaborazione'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
