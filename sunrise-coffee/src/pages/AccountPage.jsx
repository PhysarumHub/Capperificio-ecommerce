import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerContext } from '../context/ShopwareContext';
import { getOrders, getCountries, getSalutations, register } from '../lib/api/customer';
import { formatPrice } from '../lib/utils/price';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: 15,
  boxSizing: 'border-box',
  fontFamily: 'var(--font-sans)',
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#555',
  marginBottom: 5,
};

export default function AccountPage() {
  const { isLoggedIn, loading, error, login, logout, customer } = useCustomerContext();

  if (!isLoggedIn) {
    return <AuthForms login={login} loading={loading} error={error} />;
  }

  return <AccountDashboard customer={customer} logout={logout} />;
}

// ── Auth forms (login + register) ────────────────────────
function AuthForms({ login, loading, error }) {
  const [tab, setTab] = useState('login');

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '60px 20px' }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: 32 }}>
        {['login', 'register'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--color-red)' : '2px solid transparent',
              marginBottom: -2,
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              color: tab === t ? 'var(--color-red)' : '#999',
              cursor: 'pointer',
            }}
          >
            {t === 'login' ? 'Accedi' : 'Crea Account'}
          </button>
        ))}
      </div>

      {tab === 'login' ? (
        <LoginForm login={login} loading={loading} error={error} />
      ) : (
        <RegisterForm onRegistered={() => setTab('login')} />
      )}
    </div>
  );
}

function LoginForm({ login, loading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await login(email, password);
    } catch (err) {
      setFormError(err.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-3xl)', marginBottom: 8 }}>
        Bentornato
      </h1>

      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
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
          background: loading ? '#bbb' : 'var(--color-red)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          fontSize: 16,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {loading ? 'Accesso in corso...' : 'Accedi →'}
      </button>
    </form>
  );
}

function RegisterForm({ onRegistered }) {
  const [countries, setCountries] = useState([]);
  const [salutations, setSalutations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    street: '',
    zipcode: '',
    city: '',
    countryId: '',
    salutationId: '',
  });

  useEffect(() => {
    getCountries()
      .then((co) => {
        setCountries(co);
        const italy = co.find((c) => c.iso === 'IT') || co[0];
        if (italy) setForm((prev) => ({ ...prev, countryId: italy.id }));
      })
      .catch(() => {});

    getSalutations()
      .then((sa) => {
        setSalutations(sa);
        if (sa.length) setForm((prev) => ({ ...prev, salutationId: sa[0].id }));
      })
      .catch(() => {});
  }, []);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (countries.length === 0) {
      setFormError('Impossibile caricare i paesi. Controlla la connessione a Shopware e ricarica la pagina.');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setFormError('Le password non corrispondono.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('La password deve essere di almeno 8 caratteri.');
      return;
    }

    setSubmitting(true);
    try {
      const billingAddress = {
        firstName: form.firstName,
        lastName: form.lastName,
        street: form.street,
        zipcode: form.zipcode,
        city: form.city,
        salutationId: form.salutationId,
      };
      if (form.countryId) billingAddress.countryId = form.countryId;
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        salutationId: form.salutationId,
        storefrontUrl: import.meta.env.VITE_SHOPWARE_STOREFRONT_URL || window.location.origin,
        billingAddress,
      });
      setSuccess(true);
      setTimeout(() => onRegistered(), 2000);
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 40, color: '#2C8843', marginBottom: 12 }}>✓</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', marginBottom: 8 }}>
          Account Created!
        </h2>
        <p style={{ color: '#666' }}>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-3xl)', marginBottom: 8 }}>
        Crea Account
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Nome *</label>
          <input value={form.firstName} onChange={setField('firstName')} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Cognome *</label>
          <input value={form.lastName} onChange={setField('lastName')} required style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Email *</label>
        <input type="email" value={form.email} onChange={setField('email')} required style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Password *</label>
          <input type="password" value={form.password} onChange={setField('password')} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Conferma Password *</label>
          <input type="password" value={form.passwordConfirm} onChange={setField('passwordConfirm')} required style={inputStyle} />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginTop: 4 }}>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>Indirizzo di fatturazione</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Via e numero civico *</label>
            <input value={form.street} onChange={setField('street')} required style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>CAP *</label>
              <input value={form.zipcode} onChange={setField('zipcode')} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Città *</label>
              <input value={form.city} onChange={setField('city')} required style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Paese *</label>
            <select value={form.countryId} onChange={setField('countryId')} style={inputStyle} disabled={countries.length === 0}>
              {countries.length === 0
                ? <option value="">Caricamento paesi...</option>
                : countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.translated?.name || c.name}</option>
                  ))
              }
            </select>
          </div>
        </div>
      </div>

      {formError && (
        <p style={{ color: 'var(--color-red)', fontSize: 14 }}>{formError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '14px 0',
          background: submitting ? '#bbb' : 'var(--color-red)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          fontSize: 16,
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          marginTop: 4,
        }}
      >
        {submitting ? 'Creazione in corso...' : 'Crea Account →'}
      </button>
    </form>
  );
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
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 12 }}>Profile</h2>
        <p style={{ marginBottom: 4 }}>
          <strong>Name:</strong> {customer?.firstName} {customer?.lastName}
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
