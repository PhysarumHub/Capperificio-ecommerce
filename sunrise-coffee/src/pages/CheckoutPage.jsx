import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCartContext, useCustomerContext } from '../context/ShopwareContext';
import { gtmBeginCheckout, gtmAddShippingInfo, gtmPurchase } from '../lib/utils/gtm';
import {
  getShippingMethods, createCheckoutIntent, confirmCheckout,
} from '../lib/api/checkout';
import { getCountries, getSalutations } from '../lib/api/customer';
import { useSEO } from '../hooks/useSEO';
import { formatPrice } from '../lib/utils/price';
import { isShopwareConfigured, getContextToken, setContextToken } from '../lib/shopware-client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
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
                background: done ? 'var(--color-dark)' : active ? 'var(--color-red)' : 'var(--color-light)',
                border: done || active ? 'none' : '1.5px solid var(--color-red)',
                color: done || active ? '#fff' : 'var(--color-red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 13 : 12, fontWeight: 700, transition: 'all .3s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              {!isMobile && (
                <span style={{
                  fontSize: 10, fontWeight: active ? 700 : 400,
                  color: active ? 'var(--color-red)' : done ? 'var(--color-dark)' : 'var(--color-mid)',
                  letterSpacing: '.04em', textTransform: 'uppercase',
                }}>
                  {label}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: done ? 'var(--color-dark)' : 'var(--color-border)',
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
        color: error ? 'var(--color-red)' : 'var(--color-mid)',
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
  borderBottom: `1.5px solid ${hasError ? 'var(--color-red)' : 'var(--color-dark)'}`,
  borderRadius: 0,
  background: 'transparent',
  fontSize: _isMobile ? 16 : 15,
  boxSizing: 'border-box',
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-dark)',
  outline: 'none',
  transition: 'border-bottom-color .2s',
  WebkitAppearance: 'none',
});

// ── Metodo radio card ──────────────────────────────────────────────
function MethodCard({ method, selected, onSelect, name, isMobile }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 0',
      borderBottom: `1.5px solid ${selected ? 'var(--color-dark)' : 'var(--color-border)'}`,
      cursor: 'pointer',
      background: 'transparent',
      transition: 'border-color .2s',
    }}>
      <input
        type="radio" name={name} value={method.id}
        checked={selected} onChange={() => onSelect(method.id)}
        style={{ accentColor: 'var(--color-red)', width: 18, height: 18, flexShrink: 0 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-dark)' }}>{method.translated?.name || method.name}</div>
        {method.translated?.description && (
          <div style={{ fontSize: 12, color: 'var(--color-mid)', marginTop: 2 }}>{method.translated.description}</div>
        )}
      </div>
    </label>
  );
}

// ── Order summary collassabile su mobile ───────────────────────────
function OrderSummary({ cart, totalPrice, positionPrice, isB2B, address, step, selectedCountryName, placing, isMobile }) {
  const [open, setOpen] = useState(!isMobile);
  useEffect(() => { setOpen(!isMobile); }, [isMobile]);

  const FREE_SHIPPING_MIN = 50;
  const shippingCost = cart?.deliveries?.[0]?.shippingCosts?.totalPrice ?? 0;
  const hasFreeShipping = shippingCost <= 0 || (positionPrice != null && positionPrice >= FREE_SHIPPING_MIN);
  const productItems = (cart?.lineItems ?? []).filter((i) => i.type === 'product');
  const totalTax = productItems.reduce((sum, item) =>
    sum + (item.price?.calculatedTaxes ?? []).reduce((s, t) => s + (t.tax ?? 0), 0), 0);

  const row = (label, value, opts = {}) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: opts.large ? 16 : 14, fontWeight: opts.bold ? 700 : 400, color: opts.accent ? 'var(--color-red)' : 'var(--color-dark)' }}>
      <span>{label}</span>
      <span style={{ fontWeight: opts.bold ? 700 : 500 }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      background: 'var(--color-light)',
      borderTop: '1px solid var(--color-border)',
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
            {isB2B && totalTax > 0 && row('IVA', formatPrice(totalTax))}
            {row(
              'Spedizione',
              hasFreeShipping ? <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>Gratuita</span> : formatPrice(shippingCost)
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '14px 0' }} />

          {row('Totale', formatPrice(totalPrice), { bold: true, large: true, accent: true })}

          {/* Info indirizzo */}
          {step >= 1 && address.email && (
            <div style={{ fontSize: 12, color: 'var(--color-mid)', marginTop: 16, lineHeight: 1.8, borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
              <div>📧 {address.email}</div>
            </div>
          )}
          {step >= 2 && address.firstName && (
            <div style={{ fontSize: 12, color: 'var(--color-mid)', marginTop: 8, lineHeight: 1.8 }}>
              <div>📦 {address.firstName} {address.lastName}</div>
              <div>{[address.street, address.houseNumber].filter(Boolean).join(', ')}, {address.zipcode} {address.city}</div>
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
  useSEO({ title: 'Checkout', path: '/checkout', noindex: true });

  const isMobile = useIsMobile();
  const { cart, itemCount, totalPrice, positionPrice, fetchCart } = useCartContext();
  const { isLoggedIn, customer, isB2B } = useCustomerContext();

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
  const [addrQuery, setAddrQuery] = useState('');
  const [addrSuggestions, setAddrSuggestions] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [serverContextToken, setServerContextToken] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeLoadError, setStripeLoadError] = useState(null);

  const detectedIso = useMemo(() => detectCountryIso(), []);

  const [address, setAddress] = useState({
    email: '', firstName: '', lastName: '',
    street: '', houseNumber: '', zipcode: '', city: '',
    countryIso: detectedIso,
  });
  const [touched, setTouched] = useState({});

  // ── Paesi EU Est (per distinguere Europa Est da Ovest) ─────────────
  const EU_EAST = new Set(['PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'GR', 'CY', 'MT']);

  // ── Filtra i metodi di spedizione in base al paese selezionato ─────
  const filteredShippingMethods = useMemo(() => {
    if (!shippingMethods.length) return [];
    const iso = address.countryIso;
    const isItaly = iso === 'IT';
    const isEastEU = EU_EAST.has(iso);

    // cerca un metodo che corrisponde al paese
    const matchItaly = shippingMethods.filter((m) => /italia/i.test(m.name || '') || /italia/i.test(m.translated?.name || ''));
    const matchEastEU = shippingMethods.filter((m) => /europa\s*(est|orientale)/i.test(m.name || '') || /europa\s*(est|orientale)/i.test(m.translated?.name || ''));
    const matchWestEU = shippingMethods.filter((m) => /europa\s*(ovest|occidentale)/i.test(m.name || '') || /europa\s*(ovest|occidentale)/i.test(m.translated?.name || ''));
    // fallback generico "europa" (senza est/ovest)
    const matchEuropaGeneric = shippingMethods.filter((m) => /europa/i.test(m.name || '') || /europa/i.test(m.translated?.name || ''));

    if (isItaly && matchItaly.length) return matchItaly;
    if (!isItaly && isEastEU && matchEastEU.length) return matchEastEU;
    if (!isItaly && !isEastEU && matchWestEU.length) return matchWestEU;
    if (!isItaly && matchEuropaGeneric.length) return matchEuropaGeneric;
    // nessun match specifico: mostra tutti
    return shippingMethods;
  }, [shippingMethods, address.countryIso]);

  // ── Auto-seleziona quando cambia il filtro ─────────────────────────
  useEffect(() => {
    if (!filteredShippingMethods.length) return;
    const stillValid = filteredShippingMethods.some((m) => m.id === selectedShipping);
    if (!stillValid) setSelectedShipping(filteredShippingMethods[0].id);
  }, [filteredShippingMethods]);

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
  }, []);

  // Se cambia il metodo di spedizione (l'importo può variare), invalida il
  // PaymentIntent: verrà ricreato dal server con il totale aggiornato.
  useEffect(() => { setStripeClientSecret(null); }, [selectedShipping]);

  // ── Prepara il checkout e crea il PaymentIntent unico (carta/wallet/PayPal) ──
  // Tutto lato server in un'unica chiamata atomica: registra il guest, imposta la
  // spedizione, calcola il totale reale dal carrello e crea il PaymentIntent.
  // Restituisce il context token autoritativo → niente più race condition sul token.
  const preparingRef = useRef(false);
  useEffect(() => {
    if (step !== 2 || !selectedShipping || !stripePromise) return;
    if (stripeClientSecret || stripeLoadError || preparingRef.current) return;
    let cancelled = false;
    preparingRef.current = true;
    setStripeLoading(true);
    (async () => {
      try {
        const data = await createCheckoutIntent({
          contextToken: getContextToken(),
          shippingMethodId: selectedShipping,
          customer: {
            email: address.email,
            firstName: address.firstName,
            lastName: address.lastName,
            salutationId,
            storefrontUrl: import.meta.env.VITE_SHOPWARE_STOREFRONT_URL || window.location.origin,
          },
          billingAddress: {
            firstName: address.firstName,
            lastName: address.lastName,
            street: [address.street, address.houseNumber].filter(Boolean).join(', '),
            zipcode: address.zipcode,
            city: address.city,
            salutationId,
            ...(resolvedCountryId ? { countryId: resolvedCountryId } : {}),
          },
        });
        if (cancelled) return;
        // Adotta il token autoritativo del server (il carrello è migrato lì)
        if (data.contextToken) { setContextToken(data.contextToken); setServerContextToken(data.contextToken); }
        if (data.clientSecret) setStripeClientSecret(data.clientSecret);
        fetchCart(); // aggiorna il riepilogo (spedizione/totale) sul token corretto
      } catch (e) {
        if (!cancelled) setStripeLoadError(e.message || 'Impossibile inizializzare il pagamento.');
      } finally {
        preparingRef.current = false;
        if (!cancelled) setStripeLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [step, selectedShipping, stripeClientSecret, stripeLoadError]);

  // Ricerca indirizzo con Nominatim (OpenStreetMap, gratuito)
  useEffect(() => {
    if (addrQuery.length < 4) { setAddrSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setAddrLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addrQuery)}&format=json&addressdetails=1&limit=6`,
          { headers: { 'Accept-Language': 'it' } }
        );
        const data = await res.json();
        setAddrSuggestions(data);
      } catch {
        setAddrSuggestions([]);
      } finally {
        setAddrLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [addrQuery]);

  const applyAddrSuggestion = (result) => {
    const a = result.address || {};
    const street = a.road || a.pedestrian || a.footway || '';
    const houseNumber = a.house_number || '';
    const city = a.city || a.town || a.village || a.municipality || a.county || '';
    const zipcode = a.postcode || '';
    const countryIso = (a.country_code || '').toUpperCase();
    setAddress((p) => ({
      ...p,
      ...(street && { street }),
      houseNumber,
      ...(city && { city }),
      ...(zipcode && { zipcode }),
      ...(countryIso && { countryIso }),
    }));
    setTouched((p) => ({ ...p, street: true, houseNumber: true, city: true, zipcode: true }));
    setAddrQuery('');
    setAddrSuggestions([]);
    setShowManual(true);
  };

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
  const [showManual, setShowManual] = useState(false);

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
      if (!validateStep(['firstName', 'lastName', 'email'])) {
        setFormError('Compila tutti i campi obbligatori per continuare.');
        triggerShake();
        return;
      }
    }
    if (step === 1) {
      if (!validateStep(['street', 'houseNumber', 'zipcode', 'city'])) {
        setShowManual(true);
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
    const nextStep = step + 1;
    if (nextStep === 2) {
      gtmBeginCheckout(cart?.lineItems ?? [], totalPrice);
    }
    if (nextStep === 2 && step === 1) {
      const method = shippingMethods.find(m => m.id === selectedShipping);
      gtmAddShippingInfo(method?.translated?.name || method?.name, totalPrice);
    }
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Finalizzazione: il server verifica il pagamento, crea l'ordine e lo segna pagato.
  const handleStripeSuccess = async (paymentIntentId) => {
    setOrderError(null);
    setPlacing(true);
    try {
      if (!paymentIntentId) throw new Error('Pagamento non identificato. Riprova.');
      const token = serverContextToken || getContextToken();
      const { orderNumber: num } = await confirmCheckout({ paymentIntentId, contextToken: token });
      setOrderNumber(num || '—');
      gtmPurchase({
        orderNumber: num || paymentIntentId,
        total: totalPrice,
        shipping: cart?.deliveries?.[0]?.shippingCosts?.totalPrice ?? 0,
        lineItems: cart?.lineItems ?? [],
      });
      await fetchCart();
    } catch (e) {
      // 409 = ordine già elaborato (es. dal webhook Stripe): è un successo, non un errore.
      if (/già elaborato|already/i.test(e?.message || '')) {
        setOrderNumber('—');
        await fetchCart();
        return;
      }
      setOrderError(e.message || 'Errore durante il completamento ordine. Riprova.');
      throw e;
    } finally {
      setPlacing(false);
    }
  };

  // ── Ordine confermato ──────────────────────────────────────────
  if (orderNumber) return (
    <div style={{ padding: isMobile ? '60px 24px' : '80px 40px', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ fontSize: 56, color: 'var(--color-red)', marginBottom: 16 }}>✓</div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 'var(--text-3xl)' : 'var(--text-4xl)', marginBottom: 12 }}>
        Ordine confermato!
      </h1>
      <p style={{ color: 'var(--color-mid)', fontSize: 15, marginBottom: 6 }}>Ordine #{orderNumber}</p>
      <p style={{ color: 'var(--color-mid)', fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
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
      <p style={{ color: 'var(--color-mid)', marginBottom: 24 }}>Il carrello è vuoto.</p>
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
            isB2B={isB2B}
            address={address} step={step}
            selectedCountryName={selectedCountryName}
            placing={placing} isMobile={isMobile}
          />
        </div>
      )}

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
            <div style={{ paddingBottom: 40 }}>
              <StepBar step={step} isMobile={isMobile} />
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 6, marginTop: 0, color: 'var(--color-dark)' }}>
                Informazioni di contatto
              </h2>
              <p style={{ fontSize: 13, color: 'var(--color-mid)', marginBottom: 24, marginTop: 0 }}>
                Hai già un account?{' '}
                <Link to="/account/login" style={{ color: 'var(--color-red)', fontWeight: 600 }}>Accedi</Link>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Nome" error={err('firstName')} required>
                    <input autoComplete="given-name" value={address.firstName} onChange={setField('firstName')} onBlur={blur('firstName')} placeholder="Mario" style={is('firstName')} />
                  </Field>
                  <Field label="Cognome" error={err('lastName')} required>
                    <input autoComplete="family-name" value={address.lastName} onChange={setField('lastName')} onBlur={blur('lastName')} placeholder="Rossi" style={is('lastName')} />
                  </Field>
                </div>
                <Field label="Email" error={err('email')} required>
                  <input
                    type="email" inputMode="email" autoComplete="email"
                    value={address.email} onChange={setField('email')} onBlur={blur('email')}
                    placeholder="mario@esempio.it" style={is('email')}
                  />
                </Field>
              </div>
              <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>
              <button onClick={goNext} style={{ ...primaryBtn(isMobile), animation: shake ? 'shake 0.5s ease' : 'none' }}>Continua →</button>
              {formError && <p style={{ color: 'var(--color-red)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>⚠ {formError}</p>}
            </div>
          )}

          {/* STEP 1: Indirizzo */}
          {step === 1 && (
            <div style={{ paddingBottom: 40 }}>
              <StepBar step={step} isMobile={isMobile} />
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 6, marginTop: 0, color: 'var(--color-dark)' }}>
                Indirizzo di spedizione
              </h2>
              <p style={{ fontSize: 13, color: 'var(--color-mid)', marginBottom: 20, marginTop: 0 }}>
                Cerca il tuo indirizzo o compilalo manualmente
              </p>

              {/* Ricerca indirizzo automatica */}
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <input
                  type="text"
                  value={addrQuery}
                  onChange={(e) => setAddrQuery(e.target.value)}
                  placeholder="🔍  Es. Via Roma 1, 00100 Milano…"
                  style={{ ...inputStyle(false, isMobile), borderBottomColor: 'var(--color-red)' }}
                />
                {addrLoading && (
                  <span style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--color-mid)' }}>⏳</span>
                )}
                {addrSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
                    background: 'var(--color-light)', border: '1px solid var(--color-border)',
                    maxHeight: 240, overflowY: 'auto',
                    boxShadow: '0 8px 28px rgba(0,0,0,.10)',
                    marginTop: 2,
                  }}>
                    {addrSuggestions.map((s, i) => (
                      <div
                        key={i}
                        onMouseDown={() => applyAddrSuggestion(s)}
                        style={{
                          padding: '12px 16px', cursor: 'pointer', fontSize: 14,
                          borderBottom: '1px solid var(--color-border)',
                          color: 'var(--color-dark)', lineHeight: 1.4,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-cream)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-light)'}
                      >
                        <div style={{ fontWeight: 500 }}>
                          {[s.address?.road, s.address?.house_number].filter(Boolean).join(', ') || s.display_name.split(',')[0]}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-mid)', marginTop: 2 }}>
                          {[s.address?.postcode, s.address?.city || s.address?.town || s.address?.village, s.address?.country].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle manuale */}
              {!showManual && (
                <button
                  type="button"
                  onClick={() => setShowManual(true)}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-red)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textAlign: 'left', marginBottom: 8 }}
                >
                  Inserisci manualmente
                </button>
              )}

              {showManual && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginTop: 4 }}>
                  <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 110px', gap: 14 }}>
                    <Field label="Via" error={err('street')} required>
                      <input autoComplete="address-line1" value={address.street} onChange={setField('street')} onBlur={blur('street')} placeholder="Via Roma" style={is('street')} />
                    </Field>
                    <Field label="Civico" error={err('houseNumber')} required>
                      <input autoComplete="address-line2" value={address.houseNumber} onChange={setField('houseNumber')} onBlur={blur('houseNumber')} placeholder="1" style={is('houseNumber')} />
                    </Field>
                  </div>
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
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-mid)', fontSize: 14 }}>▾</span>
                      {countrySearch !== '' && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                          background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: 8,
                          maxHeight: 200, overflowY: 'auto',
                          boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                        }}>
                          {countryList.length === 0
                            ? <div style={{ padding: '12px 14px', color: 'var(--color-mid)', fontSize: 14 }}>Nessun paese trovato</div>
                            : countryList.map((c) => (
                              <div
                                key={c.iso}
                                onMouseDown={() => { setAddress((p) => ({ ...p, countryIso: c.iso })); setCountrySearch(''); }}
                                style={{
                                  padding: '12px 14px', cursor: 'pointer', fontSize: 15,
                                  background: c.iso === address.countryIso ? 'var(--color-cream)' : '#fff',
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
              )}

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <StepBar step={step} isMobile={isMobile} />
              {loadingMethods ? (
                <div style={{ color: 'var(--color-mid)', padding: '40px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
                  Caricamento metodi...
                </div>
              ) : (
                <>
                  {filteredShippingMethods.length > 0 && (
                    <div style={{ paddingBottom: 40 }}>
                      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 14, marginTop: 0, color: 'var(--color-dark)' }}>
                        Spedizione
                      </h2>
                      {filteredShippingMethods.length === 1 ? (
                        // Un solo metodo → mostra info, nessuna scelta da fare
                        <div style={{
                          padding: '14px 0',
                          borderBottom: '1.5px solid var(--color-dark)',
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                          <span style={{ fontSize: 18, color: 'var(--color-dark)' }}>✓</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-dark)' }}>
                              {filteredShippingMethods[0].translated?.name || filteredShippingMethods[0].name}
                            </div>
                            {filteredShippingMethods[0].translated?.description && (
                              <div style={{ fontSize: 12, color: 'var(--color-mid)', marginTop: 2 }}>
                                {filteredShippingMethods[0].translated.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Più metodi → mostra selezione radio
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {filteredShippingMethods.map((m) => (
                            <MethodCard key={m.id} method={m} selected={selectedShipping === m.id} onSelect={setSelectedShipping} name="shipping" isMobile={isMobile} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* ── Pagamento ──────────────────────────── */}
                  <div style={{ paddingBottom: 40 }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 6, marginTop: 0, color: 'var(--color-dark)' }}>
                      Pagamento
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--color-mid)', marginBottom: 20, marginTop: 0 }}>
                      Carta, Apple Pay, Google Pay e altri metodi disponibili. 🔒 Pagamento sicuro.
                    </p>

                    {/* Payment Element unico (carta + wallet + PayPal via Stripe) */}
                    {!stripePromise ? (
                      <p style={{ color: 'var(--color-mid)', fontSize: 13 }}>
                        Configura <code>VITE_STRIPE_PUBLIC_KEY</code> nel file <code>.env</code> per abilitare il pagamento.
                      </p>
                    ) : (
                      stripeLoading
                        ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-mid)' }}>⏳ Caricamento pagamento...</div>
                        : stripeLoadError
                          ? (
                            <div style={{ padding: '24px 0' }}>
                              <p style={{ color: 'var(--color-red)', fontSize: 13, marginBottom: 12 }}>⚠ {stripeLoadError}</p>
                              <button
                                onClick={() => setStripeLoadError(null)}
                                style={{ background: 'none', border: '1.5px solid var(--color-dark)', borderRadius: 'var(--radius-pill)', padding: '10px 24px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600 }}
                              >
                                Riprova
                              </button>
                            </div>
                          )
                        : stripeClientSecret && (
                          <Elements stripe={stripePromise} options={{
                            clientSecret: stripeClientSecret,
                            locale: 'it',
                            appearance: {
                              theme: 'none',
                              variables: {
                                colorPrimary: '#2C4A2C',
                                colorBackground: '#FCF3DF',
                                colorText: '#2C4A2C',
                                colorDanger: '#547054',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                borderRadius: '0px',
                                spacingUnit: '4px',
                              },
                              rules: {
                                '.Input': {
                                  border: 'none',
                                  borderBottom: '1.5px solid #2C4A2C',
                                  boxShadow: 'none',
                                  padding: '11px 0',
                                  background: 'transparent',
                                },
                                '.Input:focus': {
                                  border: 'none',
                                  borderBottom: '1.5px solid #547054',
                                  boxShadow: 'none',
                                  outline: 'none',
                                },
                                '.Label': {
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  color: '#6B8A6B',
                                  marginBottom: '6px',
                                },
                                '.Tab': {
                                  border: 'none',
                                  borderBottom: '1.5px solid rgba(84,112,84,0.22)',
                                  borderRadius: '0',
                                  boxShadow: 'none',
                                  background: 'transparent',
                                },
                                '.Tab--selected': {
                                  borderBottom: '2px solid #2C4A2C',
                                  boxShadow: 'none',
                                },
                              },
                            },
                          }}>
                            <StripePaymentForm
                              onSuccess={handleStripeSuccess}
                              totalPrice={totalPrice}
                              isMobile={isMobile}
                            />
                          </Elements>
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
            isB2B={isB2B}
            address={address} step={step}
            selectedCountryName={selectedCountryName} orderError={orderError}
            placing={placing} isMobile={false}
          />
        )}
      </div>
    </div>
  );
}

function primaryBtn(isMobile) {
  return {
    width: '100%', padding: isMobile ? '16px 0' : '15px 0',
    marginTop: 24, background: 'var(--color-red)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-pill)', fontSize: isMobile ? 16 : 15,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
    letterSpacing: '.04em', minHeight: 52,
  };
}

function secondaryBtn(isMobile) {
  return {
    padding: isMobile ? '14px 20px' : '12px 22px',
    background: '#fff', color: 'var(--color-dark)', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  };
}
