import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerContext } from '../context/ShopwareContext';
import { getOrders, getCountries, getSalutations, register } from '../lib/api/customer';
import { formatPrice } from '../lib/utils/price';

function inputStyle(hasError) {
  return {
    width: '100%',
    padding: '11px 14px',
    border: `1.5px solid ${hasError ? 'var(--color-red)' : '#ddd'}`,
    borderRadius: 8,
    fontSize: 15,
    boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'border-color .2s',
    WebkitAppearance: 'none',
  };
}

function Field({ label, error, children, required }) {
  return (
    <div data-error={error ? 'true' : undefined}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 600,
        color: error ? 'var(--color-red)' : '#777',
        marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em',
      }}>
        {label}{required && <span style={{ color: 'var(--color-red)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 12, color: 'var(--color-red)', marginTop: 4 }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

function StepBar({ step }) {
  const steps = ['Account', 'Sicurezza', 'Indirizzo'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 36 }}>
      {steps.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 60 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: done ? '#2C8843' : active ? 'var(--color-red)' : '#e8e8e8',
                color: done || active ? '#fff' : '#aaa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 13 : 12, fontWeight: 700, transition: 'all .3s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 400,
                color: active ? 'var(--color-red)' : done ? '#2C8843' : '#aaa',
                letterSpacing: '.04em', textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: done ? '#2C8843' : '#e8e8e8',
                margin: '0 8px', marginBottom: 20,
                transition: 'background .3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

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
  const [step, setStep] = useState(0);
  const [countries, setCountries] = useState([]);
  const [salutations, setSalutations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
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

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const blur = (key) => () => setTouched((prev) => ({ ...prev, [key]: true }));

  function validateStep(s) {
    const errs = {};
    if (s === 0) {
      if (!form.firstName.trim()) errs.firstName = 'Inserisci il nome';
      if (!form.lastName.trim()) errs.lastName = 'Inserisci il cognome';
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = 'Inserisci un\'email valida';
    }
    if (s === 1) {
      if (form.password.length < 8) errs.password = 'Minimo 8 caratteri';
      if (form.password !== form.passwordConfirm) errs.passwordConfirm = 'Le password non corrispondono';
    }
    if (s === 2) {
      if (!form.street.trim()) errs.street = 'Inserisci via e numero civico';
      if (!form.zipcode.trim()) errs.zipcode = 'Inserisci il CAP';
      if (!form.city.trim()) errs.city = 'Inserisci la città';
      if (!form.countryId) errs.countryId = 'Seleziona un paese';
    }
    return errs;
  }

  const goNext = (e) => {
    e.preventDefault();
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const allTouched = {};
      Object.keys(errs).forEach((k) => (allTouched[k] = true));
      setTouched((prev) => ({ ...prev, ...allTouched }));
      return;
    }
    setFormError(null);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setFormError(null);
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep(2);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (countries.length === 0) {
      setFormError('Impossibile caricare i paesi. Ricarica la pagina.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const billingAddress = {
        firstName: form.firstName,
        lastName: form.lastName,
        street: form.street,
        zipcode: form.zipcode,
        city: form.city,
        salutationId: form.salutationId,
        countryId: form.countryId,
      };
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
      setFormError(err.message || 'Registrazione fallita. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 48, color: '#2C8843', marginBottom: 16 }}>✓</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', marginBottom: 8 }}>
          Account creato!
        </h2>
        <p style={{ color: '#666' }}>Reindirizzamento al login...</p>
      </div>
    );
  }

  const btnStyle = (disabled) => ({
    padding: '13px 0',
    background: disabled ? '#bbb' : 'var(--color-red)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    fontSize: 15,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-sans)',
    flex: 1,
  });

  const outlineBtn = {
    padding: '13px 0',
    background: '#fff',
    color: '#555',
    border: '1.5px solid #ddd',
    borderRadius: 'var(--radius-pill)',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    flex: '0 0 auto',
    minWidth: 100,
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-3xl)', marginBottom: 28 }}>
        Crea Account
      </h1>

      <StepBar step={step} />

      {/* Step 0 — Account */}
      {step === 0 && (
        <form onSubmit={goNext} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nome" required error={touched.firstName && errors.firstName}>
              <input
                value={form.firstName}
                onChange={setField('firstName')}
                onBlur={blur('firstName')}
                style={inputStyle(touched.firstName && errors.firstName)}
              />
            </Field>
            <Field label="Cognome" required error={touched.lastName && errors.lastName}>
              <input
                value={form.lastName}
                onChange={setField('lastName')}
                onBlur={blur('lastName')}
                style={inputStyle(touched.lastName && errors.lastName)}
              />
            </Field>
          </div>
          <Field label="Email" required error={touched.email && errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={setField('email')}
              onBlur={blur('email')}
              style={inputStyle(touched.email && errors.email)}
            />
          </Field>
          <button type="submit" style={btnStyle(false)}>Continua →</button>
        </form>
      )}

      {/* Step 1 — Sicurezza */}
      {step === 1 && (
        <form onSubmit={goNext} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Password" required error={touched.password && errors.password}>
            <input
              type="password"
              value={form.password}
              onChange={setField('password')}
              onBlur={blur('password')}
              style={inputStyle(touched.password && errors.password)}
              placeholder="Minimo 8 caratteri"
            />
          </Field>
          <Field label="Conferma password" required error={touched.passwordConfirm && errors.passwordConfirm}>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={setField('passwordConfirm')}
              onBlur={blur('passwordConfirm')}
              style={inputStyle(touched.passwordConfirm && errors.passwordConfirm)}
            />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={goBack} style={outlineBtn}>← Indietro</button>
            <button type="submit" style={btnStyle(false)}>Continua →</button>
          </div>
        </form>
      )}

      {/* Step 2 — Indirizzo */}
      {step === 2 && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Via e numero civico" required error={touched.street && errors.street}>
            <input
              value={form.street}
              onChange={setField('street')}
              onBlur={blur('street')}
              style={inputStyle(touched.street && errors.street)}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="CAP" required error={touched.zipcode && errors.zipcode}>
              <input
                value={form.zipcode}
                onChange={setField('zipcode')}
                onBlur={blur('zipcode')}
                style={inputStyle(touched.zipcode && errors.zipcode)}
              />
            </Field>
            <Field label="Città" required error={touched.city && errors.city}>
              <input
                value={form.city}
                onChange={setField('city')}
                onBlur={blur('city')}
                style={inputStyle(touched.city && errors.city)}
              />
            </Field>
          </div>
          <Field label="Paese" required error={touched.countryId && errors.countryId}>
            <select
              value={form.countryId}
              onChange={setField('countryId')}
              onBlur={blur('countryId')}
              disabled={countries.length === 0}
              style={inputStyle(touched.countryId && errors.countryId)}
            >
              {countries.length === 0
                ? <option value="">Caricamento paesi...</option>
                : countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.translated?.name || c.name}</option>
                  ))
              }
            </select>
          </Field>

          {formError && (
            <p style={{ color: 'var(--color-red)', fontSize: 13 }}>⚠ {formError}</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={goBack} style={outlineBtn}>← Indietro</button>
            <button type="submit" disabled={submitting} style={btnStyle(submitting)}>
              {submitting ? 'Creazione in corso...' : 'Crea Account →'}
            </button>
          </div>
        </form>
      )}
    </div>
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
