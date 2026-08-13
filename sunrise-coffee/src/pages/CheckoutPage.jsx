import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

import { useCartContext, useCustomerContext } from '../context/ShopwareContext';
import { useCheckoutForm, CONTACT_FIELDS, ADDRESS_FIELDS } from '../hooks/useCheckoutForm';
import { useSEO } from '../hooks/useSEO';
import { gtmBeginCheckout, gtmAddShippingInfo, gtmPurchase } from '../lib/utils/gtm';
import {
  getShippingMethods, createCheckoutIntent, confirmCheckout, confirmFreeCheckout,
} from '../lib/api/checkout';
import { getCountries, getSalutations } from '../lib/api/customer';
import { isShopwareConfigured, getContextToken, setContextToken } from '../lib/shopware-client';
import { joinStreetHouseNumber, postcodeExample } from '../lib/utils/address';

import Field from '../components/checkout/Field';
import AddressAutocomplete from '../components/checkout/AddressAutocomplete';
import OrderSummary from '../components/checkout/OrderSummary';
import PaymentSection from '../components/checkout/PaymentSection';
import {
  CheckIcon, AlertIcon, PencilIcon, ArrowRightIcon, SpinnerIcon, ChevronIcon, TruckIcon,
} from '../components/checkout/CheckoutIcons';
import styles from '../components/checkout/Checkout.module.css';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

/** Paesi di ripiego, usati finché Shopware non risponde con i suoi. */
const FALLBACK_COUNTRIES = [
  { iso: 'IT', name: 'Italia' }, { iso: 'DE', name: 'Germania' }, { iso: 'FR', name: 'Francia' },
  { iso: 'ES', name: 'Spagna' }, { iso: 'GB', name: 'Regno Unito' }, { iso: 'AT', name: 'Austria' },
  { iso: 'BE', name: 'Belgio' }, { iso: 'CH', name: 'Svizzera' }, { iso: 'NL', name: 'Paesi Bassi' },
  { iso: 'PT', name: 'Portogallo' }, { iso: 'SE', name: 'Svezia' }, { iso: 'DK', name: 'Danimarca' },
  { iso: 'NO', name: 'Norvegia' }, { iso: 'FI', name: 'Finlandia' }, { iso: 'PL', name: 'Polonia' },
  { iso: 'CZ', name: 'Repubblica Ceca' }, { iso: 'RO', name: 'Romania' }, { iso: 'HU', name: 'Ungheria' },
  { iso: 'GR', name: 'Grecia' }, { iso: 'US', name: 'Stati Uniti' }, { iso: 'CA', name: 'Canada' },
  { iso: 'AU', name: 'Australia' }, { iso: 'JP', name: 'Giappone' },
];

const EU_EAST = new Set(['PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'GR', 'CY', 'MT']);

/** Schermata a tutta pagina per gli stati terminali (esito, attesa, carrello vuoto). */
function ResultScreen({ icon, title, children, action }) {
  return (
    <div className={styles.result}>
      <span className={styles.resultMark}>{icon}</span>
      <h1 className={styles.resultTitle}>{title}</h1>
      {children}
      {action}
    </div>
  );
}

export default function CheckoutPage() {
  useSEO({ title: 'Checkout', path: '/checkout', noindex: true });

  const { cart, itemCount, totalPrice, fetchCart } = useCartContext();
  const { isLoggedIn, customer, isB2B } = useCustomerContext();

  const form = useCheckoutForm({ customer, isLoggedIn });
  const { values, setField, setFields, markTouched, errorFor, validateSection } = form;

  // ── Dati di contorno (spedizione, paesi, saluti) ────────────────────
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [swCountries, setSwCountries] = useState([]);
  const [salutationId, setSalutationId] = useState('');

  // ── Fase della pagina ───────────────────────────────────────────────
  // Un solo passaggio esplicito, al posto dei tre step di prima: il pagamento
  // si apre in fondo alla stessa pagina, senza mai perdere di vista il resto.
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Stato del pagamento ─────────────────────────────────────────────
  const [clientSecret, setClientSecret] = useState(null);
  const [freeOrder, setFreeOrder] = useState(false);
  const [serverContextToken, setServerContextToken] = useState(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);

  // Rientro da un metodo con redirect (iDEAL/Bancontact/3DS): true già al primo
  // render se l'URL porta il client secret, così non lampeggia "carrello vuoto".
  const [verifyingRedirect, setVerifyingRedirect] = useState(
    () => new URLSearchParams(window.location.search).has('payment_intent_client_secret')
  );
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const paymentRef = useRef(null);

  // ── Caricamenti iniziali ────────────────────────────────────────────
  useEffect(() => {
    if (!isShopwareConfigured()) { setLoadingMethods(false); return; }
    getShippingMethods()
      .then((methods) => setShippingMethods(methods))
      .catch(() => {})
      .finally(() => setLoadingMethods(false));
    getCountries().then(setSwCountries).catch(() => {});
    getSalutations().then((list) => { if (list.length) setSalutationId(list[0].id); }).catch(() => {});
  }, []);

  // ── Metodi di spedizione validi per il paese scelto ─────────────────
  const availableMethods = useMemo(() => {
    if (!shippingMethods.length) return [];
    const iso = values.countryIso;
    const nameOf = (m) => `${m.name || ''} ${m.translated?.name || ''}`;
    const pick = (re) => shippingMethods.filter((m) => re.test(nameOf(m)));

    if (iso === 'IT') {
      const italy = pick(/italia/i);
      if (italy.length) return italy;
    } else {
      const regional = EU_EAST.has(iso)
        ? pick(/europa\s*(est|orientale)/i)
        : pick(/europa\s*(ovest|occidentale)/i);
      if (regional.length) return regional;
      const generic = pick(/europa/i);
      if (generic.length) return generic;
    }
    return shippingMethods;
  }, [shippingMethods, values.countryIso]);

  useEffect(() => {
    if (!availableMethods.length) return;
    const stillValid = availableMethods.some((m) => m.id === selectedShipping);
    if (!stillValid) setSelectedShipping(availableMethods[0].id);
  }, [availableMethods, selectedShipping]);

  // ── Paesi ───────────────────────────────────────────────────────────
  // I nomi arrivano da Intl e non da Shopware, che li restituisce in inglese
  // ("Italy") in mezzo a un checkout tutto in italiano. Da Shopware teniamo solo
  // ciò che ci serve davvero: quali paesi esistono e con quale id.
  const countryNames = useMemo(() => {
    try { return new Intl.DisplayNames(['it'], { type: 'region' }); }
    catch { return null; }
  }, []);

  const countryList = useMemo(() => {
    const localName = (iso, fallback) => {
      try { return countryNames?.of(iso) || fallback; }
      catch { return fallback; }
    };
    const base = swCountries.length
      ? swCountries.map((c) => ({
          iso: c.iso,
          name: localName(c.iso, c.translated?.name || c.name),
          id: c.id,
        }))
      : FALLBACK_COUNTRIES.map((c) => ({ ...c, name: localName(c.iso, c.name) }));
    return [...base].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  }, [swCountries, countryNames]);

  const resolvedCountryId = useMemo(
    () => swCountries.find((c) => c.iso === values.countryIso)?.id || null,
    [swCountries, values.countryIso]
  );

  const selectedCountryName = useMemo(
    () => countryList.find((c) => c.iso === values.countryIso)?.name || values.countryIso,
    [countryList, values.countryIso]
  );

  /**
   * Ogni dato che finisce nel PaymentIntent. Quando cambia, il PaymentIntent
   * creato non descrive più questo ordine e va rifatto: prima l'invalidazione
   * scattava solo sul metodo di spedizione, così correggere la via dopo aver
   * aperto il pagamento lasciava l'indirizzo vecchio sull'ordine.
   */
  const intentSignature = useMemo(() => JSON.stringify([
    values.email, values.firstName, values.lastName, values.phone,
    values.street, values.houseNumber, values.zipcode, values.city, values.countryIso,
    values.company, values.vatId, selectedShipping,
  ]), [values, selectedShipping]);

  /** Dati di fatturazione già raccolti dal form, passati a Stripe alla conferma. */
  const billingDetails = useMemo(() => ({
    name: `${values.firstName} ${values.lastName}`.trim(),
    email: values.email,
    ...(values.phone ? { phone: values.phone } : {}),
    address: {
      line1: joinStreetHouseNumber(values.street, values.houseNumber),
      postal_code: values.zipcode,
      city: values.city,
      country: values.countryIso,
    },
  }), [values]);

  const lastSignature = useRef(intentSignature);
  useEffect(() => {
    if (lastSignature.current === intentSignature) return;
    lastSignature.current = intentSignature;
    setClientSecret(null);
    setFreeOrder(false);
    setIntentError(null);
  }, [intentSignature]);

  // ── Creazione del PaymentIntent ─────────────────────────────────────
  const preparing = useRef(false);
  useEffect(() => {
    if (!paymentOpen || !selectedShipping || !stripePromise) return;
    if (clientSecret || freeOrder || intentError || preparing.current) return;
    if (verifyingRedirect || paymentProcessing || orderNumber || placing) return;

    let cancelled = false;
    preparing.current = true;
    setIntentLoading(true);

    (async () => {
      try {
        const data = await createCheckoutIntent({
          contextToken: getContextToken(),
          shippingMethodId: selectedShipping,
          customer: {
            email: values.email,
            firstName: values.firstName,
            lastName: values.lastName,
            salutationId,
            storefrontUrl: import.meta.env.VITE_SHOPWARE_STOREFRONT_URL || window.location.origin,
          },
          billingAddress: {
            firstName: values.firstName,
            lastName: values.lastName,
            street: joinStreetHouseNumber(values.street, values.houseNumber),
            zipcode: values.zipcode,
            city: values.city,
            salutationId,
            ...(values.phone ? { phoneNumber: values.phone } : {}),
            ...(values.company ? { company: values.company } : {}),
            ...(values.vatId ? { vatId: values.vatId } : {}),
            ...(resolvedCountryId ? { countryId: resolvedCountryId } : {}),
          },
        });
        if (cancelled) return;

        // Adotta il token autoritativo del server: il carrello è migrato lì.
        if (data.contextToken) {
          setContextToken(data.contextToken);
          setServerContextToken(data.contextToken);
        }
        if (data.free) setFreeOrder(true);
        else if (data.clientSecret) setClientSecret(data.clientSecret);
        fetchCart();
      } catch (e) {
        if (!cancelled) setIntentError(e.message || 'Impossibile inizializzare il pagamento.');
      } finally {
        preparing.current = false;
        if (!cancelled) setIntentLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [
    paymentOpen, selectedShipping, clientSecret, freeOrder, intentError,
    verifyingRedirect, paymentProcessing, orderNumber, placing,
  ]);

  // ── Apertura del pagamento ──────────────────────────────────────────
  const openPayment = (e) => {
    e?.preventDefault();
    setFormError('');

    const fields = [...CONTACT_FIELDS, ...ADDRESS_FIELDS, 'phone'];
    if (!validateSection(fields)) {
      setFormError('Controlla i campi segnalati per continuare.');
      // Porta l'utente sul primo errore invece di lasciarlo cercare.
      requestAnimationFrame(() => {
        const firstError = document.querySelector('[aria-invalid="true"]');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError?.focus({ preventScroll: true });
      });
      return;
    }

    setPaymentOpen(true);
    gtmBeginCheckout(cart?.lineItems ?? [], totalPrice);
    const method = availableMethods.find((m) => m.id === selectedShipping);
    if (method) gtmAddShippingInfo(method.translated?.name || method.name, totalPrice);

    requestAnimationFrame(() => {
      paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  /** "Modifica": riapre il form. Il PaymentIntent si invalida da sé se cambia qualcosa. */
  const reopenForm = () => {
    setPaymentOpen(false);
    setOrderError(null);
    setIntentError(null);
  };

  // Un codice sconto cambia il totale: il PaymentIntent va rifatto sull'importo nuovo.
  const handlePromoChange = () => {
    setClientSecret(null);
    setFreeOrder(false);
    setIntentError(null);
    setOrderError(null);
    fetchCart();
  };

  // ── Finalizzazione ──────────────────────────────────────────────────
  const finalize = useCallback(async (num, fallbackId) => {
    setOrderNumber(num || '—');
    form.clearStorage();
    gtmPurchase({
      orderNumber: num || fallbackId,
      total: totalPrice,
      shipping: cart?.deliveries?.[0]?.shippingCosts?.totalPrice ?? 0,
      lineItems: cart?.lineItems ?? [],
    });
    await fetchCart();
  }, [form, totalPrice, cart, fetchCart]);

  const handleStripeSuccess = async (paymentIntentId) => {
    setOrderError(null);
    setPlacing(true);
    try {
      if (!paymentIntentId) throw new Error('Pagamento non identificato. Riprova.');
      const token = serverContextToken || getContextToken();
      const { orderNumber: num } = await confirmCheckout({ paymentIntentId, contextToken: token });
      await finalize(num, paymentIntentId);
    } catch (e) {
      // 409 = ordine già creato (es. dal webhook Stripe): è un successo, non un errore.
      if (/già elaborato|already/i.test(e?.message || '')) {
        await finalize(null, paymentIntentId);
        return;
      }
      setOrderError(e.message || 'Errore durante il completamento ordine. Riprova.');
      throw e;
    } finally {
      setPlacing(false);
    }
  };

  const handleFreeOrder = async () => {
    setOrderError(null);
    setPlacing(true);
    try {
      const token = serverContextToken || getContextToken();
      const { orderNumber: num } = await confirmFreeCheckout({ contextToken: token });
      await finalize(num, 'free');
    } catch (e) {
      if (/già elaborato|already/i.test(e?.message || '')) {
        await finalize(null, 'free');
        return;
      }
      setOrderError(e.message || 'Errore durante il completamento ordine. Riprova.');
    } finally {
      setPlacing(false);
    }
  };

  // ── Rientro da un pagamento con redirect ────────────────────────────
  // Stripe riporta il browser su /checkout con il client secret in query string:
  // il componente rimonta da zero, quindi lo stato del PaymentIntent va riletto.
  const redirectHandled = useRef(false);
  useEffect(() => {
    const secret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');
    if (!secret || !stripePromise || redirectHandled.current) {
      if (!secret) setVerifyingRedirect(false);
      return;
    }
    redirectHandled.current = true;
    // Pulisce subito la query string: un refresh a metà verifica diventa un no-op.
    window.history.replaceState(null, '', window.location.pathname);

    (async () => {
      try {
        const stripe = await stripePromise;
        const { paymentIntent } = await stripe.retrievePaymentIntent(secret);
        if (paymentIntent?.status === 'succeeded') {
          try { await handleStripeSuccess(paymentIntent.id); } catch { /* orderError già impostato */ }
        } else if (paymentIntent?.status === 'processing') {
          setPaymentProcessing(true);
        } else {
          setClientSecret(null);
          setPaymentOpen(true);
          setOrderError('Pagamento non completato. Riprova.');
        }
      } catch (e) {
        setOrderError(e.message || 'Impossibile verificare il pagamento. Riprova.');
      } finally {
        setVerifyingRedirect(false);
      }
    })();
  }, []);

  // ── Stati terminali ─────────────────────────────────────────────────
  if (verifyingRedirect) return (
    <div className={styles.loadingBlock} style={{ padding: 'var(--space-15) var(--space-9)' }}>
      <SpinnerIcon size={20} className={styles.spinner} />
      Verifica del pagamento in corso…
    </div>
  );

  if (paymentProcessing) return (
    <ResultScreen
      icon={<SpinnerIcon size={26} className={styles.spinner} />}
      title="Pagamento in elaborazione"
      action={<Link to="/" className={styles.resultLink}>Torna allo shop</Link>}
    >
      <p className={styles.resultText}>
        Stiamo confermando il tuo pagamento. Riceverai l’email di conferma appena è tutto a posto.
      </p>
    </ResultScreen>
  );

  if (orderNumber) return (
    <ResultScreen
      icon={<CheckIcon size={26} />}
      title="Ordine confermato"
      action={<Link to="/" className={styles.resultLink}>Torna allo shop</Link>}
    >
      {orderNumber !== '—' && (
        <p className={styles.resultOrder}>Ordine <strong>#{orderNumber}</strong></p>
      )}
      <p className={styles.resultText}>
        Grazie per il tuo acquisto. Ti abbiamo mandato un’email di conferma con tutti i dettagli.
      </p>
    </ResultScreen>
  );

  if (!itemCount) return (
    <ResultScreen
      icon={<TruckIcon size={26} />}
      title="Il carrello è vuoto"
      action={<Link to="/collections/all" className={styles.resultLink}>Vai allo shop<ArrowRightIcon size={17} /></Link>}
    >
      <p className={styles.resultText}>Aggiungi qualcosa al carrello per completare un ordine.</p>
    </ResultScreen>
  );

  // ── Checkout ────────────────────────────────────────────────────────
  const fieldProps = (key) => ({
    value: values[key],
    onChange: (e) => setField(key, e.target.value),
    onBlur: () => markTouched(key),
    error: errorFor(key),
  });

  return (
    <div className={styles.page}>
      <h1 className={styles.headline}>Completa l’ordine</h1>
      <p className={styles.subhead}>
        {isLoggedIn
          ? `Bentornato${customer?.firstName ? `, ${customer.firstName}` : ''}.`
          : <>Hai già un account? <Link to="/account/login" className={styles.btnLink}>Accedi</Link> per compilare più in fretta.</>}
      </p>

      <div className={styles.grid}>
        {/* Il form copre solo le sezioni compilabili: il blocco pagamento ha il
            proprio <form> (Stripe), e i form annidati sono HTML non valido. */}
        <div className={styles.formColumn}>
        <form onSubmit={openPayment} noValidate>

          {/* ── 1. Contatti ─────────────────────────────────── */}
          <section className={`${styles.section} ${styles.sectionFirst}`}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>01</span>
                Contatti
              </h2>
              {paymentOpen && (
                <button type="button" className={styles.editBtn} onClick={reopenForm}>
                  <PencilIcon size={14} />Modifica
                </button>
              )}
            </div>

            {paymentOpen ? (
              <div className={styles.recap}>
                <div className={styles.recapLine}>
                  <strong>{values.firstName} {values.lastName}</strong><br />
                  {values.email}
                </div>
              </div>
            ) : (
              <div className={styles.sectionBody}>
                <p className={styles.sectionHint}>Ti serviranno per la conferma d’ordine e il tracking.</p>
                <div className={styles.fieldGrid}>
                  <Field label="Nome" autoComplete="given-name" placeholder="Mario" {...fieldProps('firstName')} />
                  <Field label="Cognome" autoComplete="family-name" placeholder="Rossi" {...fieldProps('lastName')} />
                  <Field
                    label="Email" type="email" inputMode="email" autoComplete="email"
                    placeholder="mario@esempio.it" full {...fieldProps('email')}
                  />
                </div>
              </div>
            )}
          </section>

          {/* ── 2. Spedizione ───────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>02</span>
                Spedizione
              </h2>
              {paymentOpen && (
                <button type="button" className={styles.editBtn} onClick={reopenForm}>
                  <PencilIcon size={14} />Modifica
                </button>
              )}
            </div>

            {paymentOpen ? (
              <div className={styles.recap}>
                <div className={styles.recapLine}>
                  <strong>{joinStreetHouseNumber(values.street, values.houseNumber)}</strong><br />
                  {values.zipcode} {values.city} · {selectedCountryName}
                  {values.phone && <><br />{values.phone}</>}
                </div>
              </div>
            ) : (
              <div className={styles.sectionBody}>
                <p className={styles.sectionHint}>Cerca l’indirizzo o compila i campi a mano.</p>

                <AddressAutocomplete
                  countryIso={values.countryIso}
                  onSelect={(patch) => setFields(patch)}
                />

                <div className={styles.fieldGrid}>
                  <div className={styles.streetRow}>
                    <Field label="Via" autoComplete="address-line1" placeholder="Via Roma" {...fieldProps('street')} />
                    <Field label="Civico" autoComplete="address-line2" placeholder="12" {...fieldProps('houseNumber')} />
                  </div>

                  <Field
                    label="CAP" autoComplete="postal-code" inputMode="text"
                    placeholder={postcodeExample(values.countryIso)} {...fieldProps('zipcode')}
                  />
                  <Field label="Città" autoComplete="address-level2" placeholder="Racale" {...fieldProps('city')} />

                  <Field label="Paese" as="custom" error={null} full>
                    {({ id }) => (
                      <div className={styles.selectWrap}>
                        <select
                          id={id}
                          className={styles.select}
                          value={values.countryIso}
                          onChange={(e) => setField('countryIso', e.target.value)}
                          autoComplete="country"
                        >
                          {countryList.map((c) => (
                            <option key={c.iso} value={c.iso}>{c.name}</option>
                          ))}
                        </select>
                        <ChevronIcon size={16} className={styles.selectChevron} />
                      </div>
                    )}
                  </Field>

                  <Field
                    label="Telefono" type="tel" inputMode="tel" autoComplete="tel"
                    placeholder="+39 333 1234567" optional full
                    {...fieldProps('phone')}
                  />
                </div>

                {!resolvedCountryId && swCountries.length > 0 && (
                  <p className={styles.errorBanner}>
                    <AlertIcon size={16} />
                    <span>Non spediamo ancora in {selectedCountryName}. Scegli un altro paese per continuare.</span>
                  </p>
                )}

                {/* Metodo di spedizione */}
                {loadingMethods ? (
                  <div className={styles.loadingBlock}>
                    <SpinnerIcon size={18} className={styles.spinner} />
                    Caricamento delle opzioni di spedizione…
                  </div>
                ) : availableMethods.length > 1 ? (
                  <div className={styles.methodList} style={{ marginTop: 'var(--space-11)' }} role="radiogroup" aria-label="Metodo di spedizione">
                    {availableMethods.map((m) => (
                      <label
                        key={m.id}
                        className={`${styles.method} ${selectedShipping === m.id ? styles.methodSelected : ''}`}
                      >
                        <input
                          type="radio" name="shipping" value={m.id}
                          checked={selectedShipping === m.id}
                          onChange={() => setSelectedShipping(m.id)}
                        />
                        <span>
                          <span className={styles.methodName}>{m.translated?.name || m.name}</span>
                          {m.translated?.description && (
                            <span className={styles.methodDesc}>{m.translated.description}</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : availableMethods.length === 1 ? (
                  <div className={styles.methodStatic} style={{ marginTop: 'var(--space-11)' }}>
                    <TruckIcon size={19} className={styles.methodIcon} />
                    <div>
                      <p className={styles.methodName}>
                        {availableMethods[0].translated?.name || availableMethods[0].name}
                      </p>
                      {availableMethods[0].translated?.description && (
                        <p className={styles.methodDesc}>{availableMethods[0].translated.description}</p>
                      )}
                    </div>
                  </div>
                ) : null}

                <button type="submit" className={styles.btnPrimary} style={{ marginTop: 'var(--space-12)' }}>
                  Vai al pagamento<ArrowRightIcon size={17} />
                </button>

                {formError && (
                  <p className={styles.formError} role="alert">
                    <AlertIcon size={15} />{formError}
                  </p>
                )}
              </div>
            )}
          </section>
        </form>

          {/* ── 3. Pagamento ────────────────────────────────── */}
          <section className={styles.section} ref={paymentRef}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>03</span>
                Pagamento
              </h2>
            </div>

            {paymentOpen ? (
              <div className={styles.sectionBody}>
                <p className={styles.sectionHint}>
                  {freeOrder
                    ? 'Il totale è 0,00 €: non serve nessun pagamento.'
                    : 'Tutti i pagamenti sono cifrati e gestiti da Stripe.'}
                </p>

                <PaymentSection
                  stripePromise={stripePromise}
                  clientSecret={clientSecret}
                  loading={intentLoading}
                  error={intentError}
                  onRetry={() => setIntentError(null)}
                  freeOrder={freeOrder}
                  onFreeOrder={handleFreeOrder}
                  placing={placing}
                  totalPrice={totalPrice}
                  onSuccess={handleStripeSuccess}
                  onProcessingChange={setPlacing}
                  billingDetails={billingDetails}
                />

                {orderError && (
                  <p className={styles.errorBanner} role="alert">
                    <AlertIcon size={16} />
                    <span>{orderError}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className={styles.sectionHint}>
                Carta, Apple&nbsp;Pay, Google&nbsp;Pay e Link. Compila i dati qui sopra per proseguire.
              </p>
            )}
          </section>
        </div>

        <OrderSummary
          cart={cart}
          totalPrice={totalPrice}
          isB2B={isB2B}
          placing={placing}
          onPromoChange={handlePromoChange}
        />
      </div>
    </div>
  );
}
