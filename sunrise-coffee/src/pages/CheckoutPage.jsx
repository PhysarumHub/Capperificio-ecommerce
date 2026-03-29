import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCartContext, useCustomerContext } from '../context/ShopwareContext';
import { getShippingMethods, getPaymentMethods, updateContext, placeOrder } from '../lib/api/checkout';
import { getCountries, getSalutations, register } from '../lib/api/customer';
import { formatPrice } from '../lib/utils/price';
import { isShopwareConfigured } from '../lib/shopware-client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import StripePaymentForm from '../components/checkout/StripePaymentForm';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const B2B_GROUP_NAME = import.meta.env.VITE_B2B_GROUP_NAME || 'B2B';

// ── Responsive hook ────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

// ── Lista paesi completa ───────────────────────────────────────────
const ALL_COUNTRIES = [
  { iso: 'IT', name: 'Italia' },
  { iso: 'DE', name: 'Germania' },
  { iso: 'FR', name: 'Francia' },
  { iso: 'ES', name: 'Spagna' },
  { iso: 'GB', name: 'Regno Unito' },
  { iso: 'AT', name: 'Austria' },
  { iso: 'BE', name: 'Belgio' },
  { iso: 'CH', name: 'Svizzera' },
  { iso: 'NL', name: 'Paesi Bassi' },
  { iso: 'PT', name: 'Portogallo' },
  { iso: 'SE', name: 'Svezia' },
  { iso: 'DK', name: 'Danimarca' },
  { iso: 'NO', name: 'Norvegia' },
  { iso: 'FI', name: 'Finlandia' },
  { iso: 'PL', name: 'Polonia' },
  { iso: 'CZ', name: 'Repubblica Ceca' },
  { iso: 'RO', name: 'Romania' },
  { iso: 'HU', name: 'Ungheria' },
  { iso: 'GR', name: 'Grecia' },
  { iso: 'US', name: 'Stati Uniti' },
  { iso: 'CA', name: 'Canada' },
  { iso: 'AU', name: 'Australia' },
  { iso: 'JP', name: 'Giappone' },
];

function detectCountryIso() {
  const lang = navigator.language || navigator.languages?.[0] || 'it-IT';
  const parts = lang.split('-');
  return parts.length > 1 ? parts[1].toUpperCase() : 'IT';
}

// ── Step bar ───────────────────────────────────────────────────────
function StepBar({ step, isMobile }) {
  const steps = ['Contatti', 'Indirizzo', 'Pagamento'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: isMobile ? 32 : 48 }}>
      {steps.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: isMobile ? 44 : 60 }}>
              <div style={{
                width: isMobile ? 28 : 36, height: isMobile ? 28 : 36, borderRadius: '50%',
                background: done ? '#2C4A2C' : active ? '#3A6B35' : '#FCF3DF',
                border: done || active ? 'none' : '1.5px solid #3A6B35',
                color: done || active ? '#fff' : '#3A6B35',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 13 : 12, fontWeight: 700, transition: 'all .3s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              {!isMobile && (
                <span style={{
                  fontSize: 10, fontWeight: active ? 700 : 400,
                  color: active ? '#3A6B35' : done ? '#2C4A2C' : '#6B8A6B',
                  letterSpacing: '.04em', textTransform: 'uppercase',
                }}>
                  {label}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: done ? '#2C4A2C' : 'rgba(84, 112, 84, 0.22)',
                margin: isMobile ? '0 6px' : '0 8px',
                marginBottom: isMobile ? 0 : 20,
                transition: 'background .3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Campo con validazione ──────────────────────────────────────────
function Field({ label, error, children, full, required }) {
  return (
    <div data-error={error ? 'true' : undefined} style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 600,
        color: error ? 'var(--color-red)' : '#777',
        marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em',
      }}>
        {label}{required && <span style={{ color: 'var(--color-red)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 12, color: 'var(--color-red)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

const inputStyle = (hasError, _isMobile) => ({
  width: '100%',
  padding: '11px 0',
  border: 'none',
  borderBottom: `1.5px solid ${hasError ? 'var(--color-red)' : '#3A6B35'}`,
  borderRadius: 0,
  background: 'var(--color-light)',
  fontSize: 16,
  boxSizing: 'border-box',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  transition: 'border-bottom-color .2s',
  WebkitAppearance: 'none',
});

// ── Metodo radio card ──────────────────────────────────────────────
function MethodCard({ method, selected, onSelect, name, isMobile }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: isMobile ? '16px 14px' : '14px 18px',
      border: `1.5px solid ${selected ? '#3A6B35' : 'var(--color-border)'}`,
      borderRadius: 10, cursor: 'pointer',
      background: selected ? 'rgba(58,107,53,0.06)' : '#fff',
      transition: 'all .2s',
    }}>
      <input
        type="radio" name={name} value={method.id}
        checked={selected} onChange={() => onSelect(method.id)}
        style={{ accentColor: 'var(--color-red)', width: 18, height: 18, flexShrink: 0 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{method.translated?.name || method.name}</div>
        {method.translated?.description && (
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{method.translated.description}</div>
        )}
      </div>
    </label>
  );
}

// ── Order summary collassabile su mobile ───────────────────────────
function OrderSummary({ cart, totalPrice, positionPrice, isB2B, address, step, selectedCountryName, placing, isMobile }) {
  const [open, setOpen] = useState(!isMobile);
  useEffect(() => { setOpen(!isMobile); }, [isMobile]);

  const shippingCost = (totalPrice || 0) - (positionPrice || 0);
  const hasFreeShipping = shippingCost <= 0;
  const netPrice = cart?.price?.netPrice ?? 0;
  const calculatedTaxes = cart?.price?.calculatedTaxes ?? [];
  const totalTax = calculatedTaxes.reduce((sum, t) => sum + (t.tax ?? 0), 0);

  const row = (label, value, opts = {}) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: opts.large ? 16 : 14, fontWeight: opts.bold ? 700 : 400, color: opts.accent ? 'var(--color-red)' : 'var(--color-dark)' }}>
      <span>{label}</span>
      <span style={{ fontWeight: opts.bold ? 700 : 500 }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      background: 'var(--color-light)',
      border: '1px solid var(--color-border)',
      borderRadius: 14,
      overflow: 'hidden',
      position: isMobile ? 'static' : 'sticky',
      top: 80,
    }}>
      {isMobile && (
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            width: '100%', padding: '16px 20px',
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: 'var(--font-sans)',
            borderBottom: open ? '1px solid var(--color-border)' : 'none',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-dark)' }}>
            {open ? 'Nascondi riepilogo' : 'Mostra riepilogo ordine'}
          </span>
          <span style={{ fontWeight: 700, color: 'var(--color-red)', fontSize: 15 }}>
            {open ? '▲' : '▾'} {formatPrice(totalPrice)}
          </span>
        </button>
      )}

      {open && (
        <div style={{ padding: isMobile ? '16px 20px 20px' : 28 }}>
          {!isMobile && (
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', color: 'var(--color-dark)', marginBottom: 20, marginTop: 0 }}>
              Il tuo ordine
            </h2>
          )}

          {/* Prodotti */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
            {Object.values(
              (cart?.lineItems?.filter(i => i.type === 'product') ?? []).reduce((acc, item) => {
                const key = item.referencedId || item.id;
                if (!acc[key]) acc[key] = { ...item, _total: item.price?.totalPrice ?? 0 };
                else { acc[key].quantity += item.quantity; acc[key]._total += item.price?.totalPrice ?? 0; }
                return acc;
              }, {})
            ).map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-mid)' }}>Qtà: {item.quantity}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-dark)', flexShrink: 0 }}>{formatPrice(item._total)}</span>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '14px 0' }} />

          {/* Breakdown costi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {row('Subtotale', formatPrice(positionPrice || 0))}
            {row(
              'Spedizione',
              hasFreeShipping ? <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>Gratuita</span> : formatPrice(shippingCost)
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '14px 0' }} />

          {isB2B ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {row('Totale imponibile', formatPrice(netPrice))}
              {row('IVA', formatPrice(totalTax))}
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
              {row('Totale IVA inclusa', formatPrice(totalPrice), { bold: true, large: true, accent: true })}
            </div>
          ) : (
            row('Totale', formatPrice(totalPrice), { bold: true, large: true, accent: true })
          )}

          {/* Info indirizzo */}
          {step >= 1 && address.email && (
            <div style={{ fontSize: 12, color: 'var(--color-mid)', marginTop: 16, lineHeight: 1.8, borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
              <div>📧 {address.email}</div>
            </div>
          )}
          {step >= 2 && address.firstName && (
            <div style={{ fontSize: 12, color: 'var(--color-mid)', marginTop: 8, lineHeight: 1.8 }}>
              <div>📦 {address.firstName} {address.lastName}</div>
              <div>{address.street}, {address.zipcode} {address.city}</div>
              <div>{selectedCountryName}</div>
            </div>
          )}

          {step === 2 && placing && (
            <p style={{ color: 'var(--color-mid)', fontSize: 13, marginTop: 12 }}>⏳ Completamento ordine...</p>
          )}

          <p style={{ fontSize: 11, color: 'var(--color-mid)', textAlign: 'center', marginTop: 16, opacity: .7 }}>
            🔒 Ordine sicuro · Dati protetti
          </p>
        </div>
      )}
    </div>
  );
}

// ── Checkout principale ────────────────────────────────────────────
export default function CheckoutPage() {
  const isMobile = useIsMobile();
  const { cart, itemCount, totalPrice, positionPrice, fetchCart } = useCartContext();
  const { isLoggedIn, customer } = useCustomerContext();

  const [step, setStep] = useState(isLoggedIn ? 1 : 0);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [swCountries, setSwCountries] = useState([]);
  const [salutationId, setSalutationId] = useState('');
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [paymentTab, setPaymentTab] = useState('stripe'); // 'stripe' | 'paypal'
  const [stripePaymentMethodId, setStripePaymentMethodId] = useState('');
  const [paypalPaymentMethodId, setPaypalPaymentMethodId] = useState('');
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  const detectedIso = useMemo(() => detectCountryIso(), []);

  const [address, setAddress] = useState({
    email: '', firstName: '', lastName: '',
    street: '', zipcode: '', city: '',
    countryIso: detectedIso,
  });
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (isLoggedIn && customer) {
      setAddress((p) => ({ ...p, email: customer.email || '', firstName: customer.firstName || '', lastName: customer.lastName || '' }));
      setStep(1);
    }
  }, [isLoggedIn, customer]);

  useEffect(() => {
    if (!isShopwareConfigured()) { setLoadingMethods(false); return; }
    getShippingMethods().then((sm) => { setShippingMethods(sm); if (sm.length) setSelectedShipping(sm[0].id); }).catch(() => {}).finally(() => setLoadingMethods(false));
    getCountries().then((co) => setSwCountries(co)).catch(() => {});
    getSalutations().then((sa) => { if (sa.length) setSalutationId(sa[0].id); }).catch(() => {});
    getPaymentMethods().then((methods) => {
      const isStripe = (m) => /stripe/i.test(m.handlerIdentifier || '') || /stripe/i.test(m.name || '') || /stripe/i.test(m.translated?.name || '');
      const isPaypal = (m) => /paypal/i.test(m.handlerIdentifier || '') || /paypal/i.test(m.name || '') || /paypal/i.test(m.translated?.name || '');
      const stripePm = methods.find(isStripe);
      const paypalPm = methods.find(isPaypal);
      if (stripePm) setStripePaymentMethodId(stripePm.id);
      if (paypalPm) setPaypalPaymentMethodId(paypalPm.id);
    }).catch(() => {});
  }, []);

  // Crea PaymentIntent Stripe quando si arriva allo step 2 con tab stripe
  useEffect(() => {
    if (step !== 2 || paymentTab !== 'stripe' || !stripePromise || stripeClientSecret) return;
    setStripeLoading(true);
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: totalPrice }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.clientSecret) setStripeClientSecret(d.clientSecret); })
      .catch(() => setOrderError('Impossibile inizializzare il pagamento con carta. Riprova o usa PayPal.'))
      .finally(() => setStripeLoading(false));
  }, [step, paymentTab, stripeClientSecret, totalPrice]);

  const setField = (key) => (e) => {
    setAddress((p) => ({ ...p, [key]: e.target.value }));
    setTouched((p) => ({ ...p, [key]: true }));
  };
  const blur = (key) => () => setTouched((p) => ({ ...p, [key]: true }));

  const err = (key, val = address[key]) => {
    if (!touched[key]) return null;
    if (!val?.trim()) return 'Campo obbligatorio';
    if (key === 'email' && !/\S+@\S+\.\S+/.test(val)) return 'Email non valida';
    if (key === 'zipcode' && !/^\d{4,10}$/.test(val.trim())) return 'CAP non valido';
    return null;
  };

  const countryList = useMemo(() => {
    const base = swCountries.length > 0
      ? swCountries.map((c) => ({ iso: c.iso, name: c.translated?.name || c.name, id: c.id }))
      : ALL_COUNTRIES;
    const filtered = countrySearch
      ? base.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
      : base;
    return filtered.sort((a, b) => {
      if (a.iso === detectedIso) return -1;
      if (b.iso === detectedIso) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [swCountries, countrySearch, detectedIso]);

  const resolvedCountryId = useMemo(() =>
    swCountries.find((c) => c.iso === address.countryIso)?.id || null,
    [swCountries, address.countryIso]
  );

  const selectedCountryName = useMemo(() =>
    countryList.find((c) => c.iso === address.countryIso)?.name || address.countryIso,
    [countryList, address.countryIso]
  );

  const [formError, setFormError] = useState('');
  const [shake, setShake] = useState(false);

  const validateStep = (fields) => {
    const t = {};
    fields.forEach((f) => { t[f] = true; });
    setTouched((p) => ({ ...p, ...t }));
    return fields.every((f) => !err(f, address[f]));
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const goNext = () => {
    setFormError('');
    if (step === 0) {
      if (!validateStep(['email'])) {
        setFormError('Inserisci un indirizzo email valido per continuare.');
        triggerShake();
        setTimeout(() => document.querySelector('input[type="email"]')?.focus(), 50);
        return;
      }
    }
    if (step === 1) {
      if (!validateStep(['firstName', 'lastName', 'street', 'zipcode', 'city'])) {
        setFormError('Compila tutti i campi obbligatori prima di continuare.');
        triggerShake();
        setTimeout(() => {
          const firstError = document.querySelector('[data-error="true"]');
          firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstError?.querySelector('input')?.focus();
        }, 50);
        return;
      }
    }
    setFormError('');
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Chiamata dopo che il pagamento (Stripe o PayPal) è stato confermato
  const handlePlaceOrder = async () => {
    setOrderError(null);
    setPlacing(true);
    try {
      if (!isLoggedIn) {
        const billingAddress = {
          firstName: address.firstName,
          lastName: address.lastName,
          street: address.street,
          zipcode: address.zipcode,
          city: address.city,
          salutationId,
          ...(resolvedCountryId ? { countryId: resolvedCountryId } : {}),
        };
        await register({
          guest: true,
          email: address.email,
          firstName: address.firstName,
          lastName: address.lastName,
          salutationId,
          storefrontUrl: import.meta.env.VITE_SHOPWARE_STOREFRONT_URL || window.location.origin,
          billingAddress,
        });
      }
      const paymentMethodId = paymentTab === 'paypal' ? paypalPaymentMethodId : stripePaymentMethodId;
      await updateContext({
        shippingMethodId: selectedShipping,
        ...(paymentMethodId ? { paymentMethodId } : {}),
      });
      const order = await placeOrder();
      setOrderNumber(order?.orderNumber || order?.id || '—');
      await fetchCart();
    } catch (e) {
      setOrderError(e.message || 'Errore durante il completamento ordine. Riprova.');
      throw e; // rilancia per gestire dentro i provider di pagamento
    } finally {
      setPlacing(false);
    }
  };

  // ── Ordine confermato ──────────────────────────────────────────
  if (orderNumber) return (
    <div style={{ padding: isMobile ? '60px 24px' : '80px 40px', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ fontSize: 56, color: '#2C8843', marginBottom: 16 }}>✓</div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 'var(--text-3xl)' : 'var(--text-4xl)', marginBottom: 12 }}>
        Ordine confermato!
      </h1>
      <p style={{ color: '#888', fontSize: 15, marginBottom: 6 }}>Ordine #{orderNumber}</p>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
        Grazie per il tuo acquisto. Riceverai una email di conferma a breve.
      </p>
      <Link to="/" style={{
        display: 'inline-block', background: 'var(--color-red)', color: '#fff',
        padding: '14px 36px', borderRadius: 'var(--radius-pill)',
        textDecoration: 'none', fontWeight: 600, fontSize: 16,
      }}>
        Torna allo shop
      </Link>
    </div>
  );

  if (!itemCount) return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)', marginBottom: 16 }}>Checkout</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>Il carrello è vuoto.</p>
      <Link to="/collections/all" style={{ color: 'var(--color-red)', textDecoration: 'underline' }}>Vai allo shop</Link>
    </div>
  );

  const is = (key) => inputStyle(!!err(key), isMobile);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '28px 16px 80px' : '48px 24px 100px' }}>

      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 'var(--text-3xl)' : 'var(--text-4xl)', marginBottom: isMobile ? 24 : 36 }}>
        Checkout
      </h1>

      {/* Su mobile: order summary prima del form */}
      {isMobile && (
        <div style={{ marginBottom: 28 }}>
          <OrderSummary
            cart={cart} totalPrice={totalPrice} positionPrice={positionPrice}
            isB2B={customer?.group?.name === B2B_GROUP_NAME}
            address={address} step={step}
            selectedCountryName={selectedCountryName}
            placing={placing} isMobile={isMobile}
          />
        </div>
      )}

      <StepBar step={step} isMobile={isMobile} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
        gap: isMobile ? 0 : 52,
        alignItems: 'start',
      }}>

        {/* ── Form ────────────────────────────────────────────── */}
        <div>

          {/* STEP 0: Contatti */}
          {step === 0 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 20, marginTop: 0 }}>
                Informazioni di contatto
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Email" error={err('email')} required>
                  <input
                    type="email" inputMode="email" autoComplete="email"
                    value={address.email} onChange={setField('email')} onBlur={blur('email')}
                    placeholder="mario@esempio.it" style={is('email')}
                  />
                </Field>
                <p style={{ fontSize: 13, color: '#aaa' }}>
                  Hai già un account?{' '}
                  <Link to="/account/login" style={{ color: 'var(--color-red)' }}>Accedi</Link>
                </p>
              </div>
              <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>
              <button onClick={goNext} style={{ ...primaryBtn(isMobile), animation: shake ? 'shake 0.5s ease' : 'none' }}>Continua →</button>
              {formError && <p style={{ color: 'var(--color-red)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>⚠ {formError}</p>}
            </div>
          )}

          {/* STEP 1: Indirizzo */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 20, marginTop: 0 }}>
                Indirizzo di spedizione
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                <Field label="Nome" error={err('firstName')} required>
                  <input autoComplete="given-name" value={address.firstName} onChange={setField('firstName')} onBlur={blur('firstName')} style={is('firstName')} />
                </Field>
                <Field label="Cognome" error={err('lastName')} required>
                  <input autoComplete="family-name" value={address.lastName} onChange={setField('lastName')} onBlur={blur('lastName')} style={is('lastName')} />
                </Field>
                <Field label="Via e numero civico" error={err('street')} full required>
                  <input autoComplete="street-address" value={address.street} onChange={setField('street')} onBlur={blur('street')} placeholder="Via Roma 1" style={is('street')} />
                </Field>
                <Field label="CAP" error={err('zipcode')} required>
                  <input autoComplete="postal-code" inputMode="numeric" value={address.zipcode} onChange={setField('zipcode')} onBlur={blur('zipcode')} placeholder="00100" style={is('zipcode')} />
                </Field>
                <Field label="Città" error={err('city')} required>
                  <input autoComplete="address-level2" value={address.city} onChange={setField('city')} onBlur={blur('city')} placeholder="Roma" style={is('city')} />
                </Field>

                {/* Country smart search */}
                <Field label="Paese" full>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      autoComplete="country-name"
                      value={countrySearch !== '' ? countrySearch : selectedCountryName}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      onFocus={() => setCountrySearch('')}
                      onBlur={() => setTimeout(() => setCountrySearch(''), 200)}
                      style={{ ...inputStyle(false, isMobile), paddingRight: 24 }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#aaa', fontSize: 12 }}>▾</span>
                    {countrySearch !== '' && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                        background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: 8,
                        maxHeight: 200, overflowY: 'auto',
                        boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                      }}>
                        {countryList.length === 0
                          ? <div style={{ padding: '12px 14px', color: '#aaa', fontSize: 14 }}>Nessun paese trovato</div>
                          : countryList.map((c) => (
                            <div
                              key={c.iso}
                              onMouseDown={() => { setAddress((p) => ({ ...p, countryIso: c.iso })); setCountrySearch(''); }}
                              style={{
                                padding: '12px 14px', cursor: 'pointer', fontSize: 15,
                                background: c.iso === address.countryIso ? 'rgba(58,107,53,0.06)' : '#fff',
                                fontWeight: c.iso === address.countryIso ? 600 : 400,
                                borderBottom: '1px solid var(--color-border)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              }}
                            >
                              {c.name}
                              {!c.id && swCountries.length > 0 && (
                                <span style={{ fontSize: 11, color: '#f0a000' }}>non disp.</span>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                  {!resolvedCountryId && swCountries.length > 0 && (
                    <p style={{ fontSize: 12, color: '#f0a000', marginTop: 6 }}>
                      ⚠ Paese non trovato nel sistema. Continua comunque o scegli un altro paese.
                    </p>
                  )}
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
                {!isLoggedIn && (
                  <button onClick={() => setStep(0)} style={secondaryBtn(isMobile)}>← Indietro</button>
                )}
                <button onClick={goNext} style={{ ...primaryBtn(isMobile), flex: 1, animation: shake ? 'shake 0.5s ease' : 'none' }}>Continua →</button>
              </div>
              {formError && <p style={{ color: 'var(--color-red)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>⚠ {formError}</p>}
            </div>
          )}

          {/* STEP 2: Spedizione & Pagamento */}
          {step === 2 && (
            <div>
              {loadingMethods ? (
                <div style={{ color: '#aaa', padding: '40px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
                  Caricamento metodi...
                </div>
              ) : (
                <>
                  {shippingMethods.length > 0 && (
                    <div style={{ marginBottom: 32 }}>
                      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 14, marginTop: 0 }}>
                        Spedizione
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {shippingMethods.map((m) => (
                          <MethodCard key={m.id} method={m} selected={selectedShipping === m.id} onSelect={setSelectedShipping} name="shipping" isMobile={isMobile} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* ── Pagamento ──────────────────────────── */}
                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 14, marginTop: 0 }}>
                      Pagamento
                    </h2>

                    {/* Tab Stripe | PayPal */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                      {[
                        { key: 'stripe', label: '💳 Carta di credito' },
                        { key: 'paypal', label: '🅿 PayPal' },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setPaymentTab(key)}
                          style={{
                            flex: 1, padding: '10px 0', border: `1.5px solid ${paymentTab === key ? '#3A6B35' : 'var(--color-border)'}`,
                            borderRadius: 8, background: paymentTab === key ? 'rgba(58,107,53,0.06)' : '#fff',
                            fontWeight: paymentTab === key ? 700 : 400, fontSize: 14,
                            cursor: 'pointer', fontFamily: 'var(--font-sans)',
                            color: paymentTab === key ? '#3A6B35' : '#444',
                            transition: 'all .2s',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Stripe Elements */}
                    {paymentTab === 'stripe' && (
                      stripeLoading || !stripeClientSecret
                        ? <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>⏳ Caricamento pagamento...</div>
                        : stripePromise && (
                          <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret, locale: 'it' }}>
                            <StripePaymentForm
                              onSuccess={handlePlaceOrder}
                              totalPrice={totalPrice}
                              isMobile={isMobile}
                            />
                          </Elements>
                        )
                    )}
                    {paymentTab === 'stripe' && !stripePromise && (
                      <p style={{ color: '#aaa', fontSize: 13 }}>
                        Configura <code>VITE_STRIPE_PUBLIC_KEY</code> nel file <code>.env</code> per abilitare il pagamento con carta.
                      </p>
                    )}

                    {/* PayPal */}
                    {paymentTab === 'paypal' && (
                      import.meta.env.VITE_PAYPAL_CLIENT_ID
                        ? (
                          <PayPalScriptProvider options={{
                            clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
                            currency: 'EUR',
                            locale: 'it_IT',
                          }}>
                            <PayPalButtons
                              style={{ layout: 'vertical', shape: 'pill' }}
                              createOrder={(_data, actions) =>
                                actions.order.create({
                                  purchase_units: [{
                                    amount: {
                                      value: totalPrice.toFixed(2),
                                      currency_code: 'EUR',
                                    },
                                  }],
                                })
                              }
                              onApprove={async (_data, actions) => {
                                await actions.order.capture();
                                await handlePlaceOrder();
                              }}
                              onError={(err) => setOrderError('Errore PayPal: ' + (err?.message || 'Riprova.'))}
                            />
                          </PayPalScriptProvider>
                        )
                        : (
                          <p style={{ color: '#aaa', fontSize: 13 }}>
                            Configura <code>VITE_PAYPAL_CLIENT_ID</code> nel file <code>.env</code> per abilitare PayPal.
                          </p>
                        )
                    )}

                    {orderError && (
                      <p style={{ color: 'var(--color-red)', fontSize: 13, marginTop: 14 }}>{orderError}</p>
                    )}
                  </div>
                </>
              )}


              <div style={{ marginTop: 16 }}>
                <button onClick={() => setStep(1)} style={secondaryBtn(isMobile)}>← Indietro</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Order summary desktop ────────────────────────────── */}
        {!isMobile && (
          <OrderSummary
            cart={cart} totalPrice={totalPrice} positionPrice={positionPrice}
            isB2B={customer?.group?.name === B2B_GROUP_NAME}
            address={address} step={step}
            selectedCountryName={selectedCountryName} orderError={orderError}
            placing={placing} onPlaceOrder={handlePlaceOrder} isMobile={false}
          />
        )}
      </div>
    </div>
  );
}

function primaryBtn(isMobile) {
  return {
    width: '100%', padding: isMobile ? '16px 0' : '14px 0',
    marginTop: 8, background: 'var(--color-red)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-pill)', fontSize: isMobile ? 16 : 15,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
    letterSpacing: '.04em', minHeight: 52,
  };
}

function secondaryBtn(isMobile) {
  return {
    padding: isMobile ? '14px 20px' : '12px 22px',
    background: '#fff', color: '#444', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  };
}
