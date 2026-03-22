import { useState, useEffect } from 'react';
import { useCustomerContext } from '../../context/ShopwareContext';
import { getCountries, getSalutations, register } from '../../lib/api/customer';
import styles from './AuthDrawer.module.css';

// ── Helpers ────────────────────────────────────────────────
function inputStyle(hasError) {
  return {
    width: '100%',
    padding: '11px 14px',
    border: `1.5px solid ${hasError ? 'var(--color-red)' : 'var(--color-border)'}`,
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
    <div style={{ marginBottom: 0 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 600,
        color: error ? 'var(--color-red)' : '#777',
        marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em',
      }}>
        {label}{required && <span style={{ color: 'var(--color-red)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 12, color: 'var(--color-red)', marginTop: 4 }}>⚠ {error}</p>
      )}
    </div>
  );
}

function StepBar({ step }) {
  const steps = ['Account', 'Sicurezza', 'Indirizzo'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 28 }}>
      {steps.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 56 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? '#2C8843' : active ? 'var(--color-red)' : '#e8e8e8',
                color: done || active ? '#fff' : '#aaa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 13 : 12, fontWeight: 700, transition: 'all .3s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 9, fontWeight: active ? 700 : 400,
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
                margin: '0 6px', marginBottom: 18,
                transition: 'background .3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Login form ─────────────────────────────────────────────
function LoginForm({ onSuccess }) {
  const { login, loading, error } = useCustomerContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setFormError(err.message || 'Credenziali non valide. Riprova.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', marginBottom: 4 }}>
        Bentornato
      </h2>

      <Field label="Email" required>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle(false)}
          autoComplete="email"
        />
      </Field>
      <Field label="Password" required>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle(false)}
          autoComplete="current-password"
        />
      </Field>

      {(formError || error) && (
        <p style={{ color: 'var(--color-red)', fontSize: 13 }}>⚠ {formError || error}</p>
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
          fontSize: 15,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          marginTop: 4,
        }}
      >
        {loading ? 'Accesso in corso...' : 'Accedi →'}
      </button>
    </form>
  );
}

// ── Register form (multistep) ──────────────────────────────
function RegisterForm({ onSuccess }) {
  const [step, setStep] = useState(0);
  const [countries, setCountries] = useState([]);
  const [salutations, setSalutations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', passwordConfirm: '',
    street: '', zipcode: '', city: '',
    countryId: '', salutationId: '',
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
        errs.email = "Inserisci un'email valida";
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

  const goBack = () => { setFormError(null); setStep((s) => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep(2);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (countries.length === 0) { setFormError('Impossibile caricare i paesi. Ricarica la pagina.'); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      const billingAddress = {
        firstName: form.firstName, lastName: form.lastName,
        street: form.street, zipcode: form.zipcode, city: form.city,
        salutationId: form.salutationId, countryId: form.countryId,
      };
      await register({
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password,
        salutationId: form.salutationId,
        storefrontUrl: import.meta.env.VITE_SHOPWARE_STOREFRONT_URL || window.location.origin,
        billingAddress,
      });
      setSuccess(true);
      setTimeout(() => onSuccess(), 1800);
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
        <p style={{ color: '#666', fontSize: 14 }}>Accesso in corso...</p>
      </div>
    );
  }

  const primaryBtn = (disabled) => ({
    padding: '13px 0', background: disabled ? '#bbb' : 'var(--color-red)',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)',
    fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-sans)', flex: 1,
  });

  const outlineBtn = {
    padding: '13px 0', background: '#fff', color: '#555',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-pill)',
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-sans)', flex: '0 0 auto', minWidth: 100,
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', marginBottom: 24 }}>
        Crea Account
      </h2>

      <StepBar step={step} />

      {step === 0 && (
        <form onSubmit={goNext} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nome" required error={touched.firstName && errors.firstName}>
              <input value={form.firstName} onChange={setField('firstName')} onBlur={blur('firstName')}
                style={inputStyle(touched.firstName && errors.firstName)} autoComplete="given-name" />
            </Field>
            <Field label="Cognome" required error={touched.lastName && errors.lastName}>
              <input value={form.lastName} onChange={setField('lastName')} onBlur={blur('lastName')}
                style={inputStyle(touched.lastName && errors.lastName)} autoComplete="family-name" />
            </Field>
          </div>
          <Field label="Email" required error={touched.email && errors.email}>
            <input type="email" value={form.email} onChange={setField('email')} onBlur={blur('email')}
              style={inputStyle(touched.email && errors.email)} autoComplete="email" />
          </Field>
          <button type="submit" style={primaryBtn(false)}>Continua →</button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={goNext} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Password" required error={touched.password && errors.password}>
            <input type="password" value={form.password} onChange={setField('password')} onBlur={blur('password')}
              style={inputStyle(touched.password && errors.password)}
              placeholder="Minimo 8 caratteri" autoComplete="new-password" />
          </Field>
          <Field label="Conferma password" required error={touched.passwordConfirm && errors.passwordConfirm}>
            <input type="password" value={form.passwordConfirm} onChange={setField('passwordConfirm')} onBlur={blur('passwordConfirm')}
              style={inputStyle(touched.passwordConfirm && errors.passwordConfirm)} autoComplete="new-password" />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={goBack} style={outlineBtn}>← Indietro</button>
            <button type="submit" style={primaryBtn(false)}>Continua →</button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Via e numero civico" required error={touched.street && errors.street}>
            <input value={form.street} onChange={setField('street')} onBlur={blur('street')}
              style={inputStyle(touched.street && errors.street)} autoComplete="street-address" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="CAP" required error={touched.zipcode && errors.zipcode}>
              <input value={form.zipcode} onChange={setField('zipcode')} onBlur={blur('zipcode')}
                style={inputStyle(touched.zipcode && errors.zipcode)} autoComplete="postal-code" />
            </Field>
            <Field label="Città" required error={touched.city && errors.city}>
              <input value={form.city} onChange={setField('city')} onBlur={blur('city')}
                style={inputStyle(touched.city && errors.city)} autoComplete="address-level2" />
            </Field>
          </div>
          <Field label="Paese" required error={touched.countryId && errors.countryId}>
            <select value={form.countryId} onChange={setField('countryId')} onBlur={blur('countryId')}
              disabled={countries.length === 0}
              style={inputStyle(touched.countryId && errors.countryId)}>
              {countries.length === 0
                ? <option value="">Caricamento paesi...</option>
                : countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.translated?.name || c.name}</option>
                  ))
              }
            </select>
          </Field>
          {formError && <p style={{ color: 'var(--color-red)', fontSize: 13 }}>⚠ {formError}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={goBack} style={outlineBtn}>← Indietro</button>
            <button type="submit" disabled={submitting} style={primaryBtn(submitting)}>
              {submitting ? 'Creazione in corso...' : 'Crea Account →'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Main drawer ────────────────────────────────────────────
export default function AuthDrawer({ open, onClose }) {
  const [tab, setTab] = useState('login');

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

  // Reset to login tab when drawer closes
  useEffect(() => {
    if (!open) setTimeout(() => setTab('login'), 350);
  }, [open]);

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
        aria-label="Accesso account"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Il mio account</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Chiudi">✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {[['login', 'Accedi'], ['register', 'Crea Account']].map(([key, label]) => (
            <button
              key={key}
              className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className={styles.body}>
          {tab === 'login'
            ? <LoginForm onSuccess={onClose} />
            : <RegisterForm onSuccess={() => { setTab('login'); onClose(); }} />
          }
        </div>
      </div>
    </>
  );
}
