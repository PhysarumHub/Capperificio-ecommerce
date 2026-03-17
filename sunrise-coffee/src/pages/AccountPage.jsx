import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerContext } from '../context/ShopwareContext';
import { getOrders } from '../lib/api/customer';
import { formatPrice } from '../lib/utils/price';
import { useEffect } from 'react';

export default function AccountPage() {
  const { customer, isLoggedIn, loading, error, login, logout, register } = useCustomerContext();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return <LoginForm login={login} loading={loading} error={error} />;
  }

  return <AccountDashboard customer={customer} logout={logout} />;
}

function LoginForm({ login, loading, error }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await login(email, password);
    } catch (err) {
      setFormError(err.message || 'Invalid credentials');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '60px 20px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)', marginBottom: 32, textAlign: 'center' }}>
        {isRegister ? 'Create Account' : 'Login'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>

        {(formError || error) && (
          <p style={{ color: 'var(--color-red)', fontSize: 14 }}>{formError || error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '14px 0',
            background: loading ? '#999' : 'var(--color-red)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Please wait...' : 'Login'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
        Don't have an account?{' '}
        <Link to="/account/register" style={{ color: 'var(--color-red)' }}>Register</Link>
      </p>
    </div>
  );
}

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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)' }}>My Account</h1>
        <button
          onClick={logout}
          style={{
            padding: '10px 24px',
            border: '1px solid #ccc',
            background: '#fff',
            borderRadius: 'var(--radius-pill)',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ background: '#f9f9f9', padding: 24, borderRadius: 12, marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 12 }}>Profile</h2>
        <p><strong>Name:</strong> {customer?.firstName} {customer?.lastName}</p>
        <p><strong>Email:</strong> {customer?.email}</p>
      </div>

      <div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 16 }}>Order History</h2>
        {ordersLoading ? (
          <p style={{ color: '#666' }}>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p style={{ color: '#666' }}>No orders yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((order) => (
              <div key={order.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>Order #{order.orderNumber}</span>
                  <span style={{ color: '#666', fontSize: 14 }}>
                    {new Date(order.orderDateTime || order.createdAt).toLocaleDateString('it-IT')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666', fontSize: 14 }}>
                    {order.lineItems?.length || 0} item(s)
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {formatPrice(order.amountTotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
