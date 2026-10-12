import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

import { useSEO } from '../hooks/useSEO';
import { isValidPostcode, isValidPhone, postcodeExample } from '../lib/utils/address';
import { COMPANY } from '../data/company';
import Field from '../components/checkout/Field';
import PaymentSection from '../components/checkout/PaymentSection';
import {
  CheckIcon, AlertIcon, ArrowRightIcon, ArrowLeftIcon, SpinnerIcon, ChevronIcon,
  LockIcon, TruckIcon, MailIcon,
} from '../components/checkout/CheckoutIcons';
import styles from '../components/checkout/Checkout.module.css';
import ms from './SampleBoxCheckout.module.css';

/* Checkout multistep del box campioni B2B (/sample-box → qui). Riusa campi,
   bottoni, riepilogo e Payment Element del checkout principale, in inglese e
   senza carrello Shopware: il server crea un PaymentIntent con l'importo della
   spedizione per il paese scelto (vedi /api/sample-box/* in server.js). */

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const RETURN_PATH = '/sample-box/checkout';
/* Card sempre per prima, poi il metodo locale (Bancontact in Belgio, Satispay in Italia). */
const PAYMENT_ORDER = {
  BE: ['card', 'bancontact', 'paypal', 'klarna'],
  IT: ['card', 'satispay', 'paypal', 'klarna'],
};
const BOX_IMAGE = '/images/sample-box/thumb.webp';
/* I dati compilati sopravvivono a refresh e rientro da redirect (Bancontact…). */
const STORAGE_KEY = 'sampleBoxCheckout';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = {
  company: '', vat: '', firstName: '', lastName: '', email: '', phone: '',
  street: '', houseNumber: '', zipcode: '', city: '',
};

const STEPS = [
  { title: 'Your details', label: 'Details', fields: ['company', 'vat', 'firstName', 'lastName', 'email', 'phone'] },
  { title: 'Shipping address', label: 'Shipping', fields: ['street', 'houseNumber', 'zipcode', 'city'] },
  { title: 'Payment', label: 'Payment', fields: [] },
];

function validate(values, country) {
  const errors = {};
  if (!values.company.trim()) errors.company = 'Enter your company name';
  if (!values.firstName.trim()) errors.firstName = 'Enter your first name';
  if (!values.lastName.trim()) errors.lastName = 'Enter your last name';
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address';
  if (!values.phone.trim()) errors.phone = 'The courier needs a phone number';
  else if (!isValidPhone(values.phone)) errors.phone = 'Enter a valid phone number';
  if (!values.street.trim()) errors.street = 'Enter the street';
  if (!values.houseNumber.trim()) errors.houseNumber = 'Enter the number';
  if (!isValidPostcode(values.zipcode, country)) errors.zipcode = 'Enter a valid postcode';
  if (!values.city.trim()) errors.city = 'Enter the city';
  return errors;
}

const stepHasErrors = (i, errors) => STEPS[i].fields.some((f) => errors[f]);

function formatEur(amount) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function loadSaved() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

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

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

/* Riepilogo: sticky a destra su desktop, richiudibile in cima su mobile. */
function Summary({ selected }) {
  const [open, setOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = (e) => setIsCompact(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const total = selected ? formatEur(selected.amount) : '—';

  return (
    <aside className={styles.summary} aria-label="Order summary">
      <button
        type="button"
        className={styles.summaryToggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.summaryToggleLabel}>
          <ChevronIcon size={16} up={open} />
          {open ? 'Hide summary' : 'Show summary'}
        </span>
        <span className={styles.summaryToggleTotal}>{total}</span>
      </button>

      {(!isCompact || open) && (
        <div className={styles.summaryBody}>
          <h2 className={styles.summaryTitle}>Your sample box</h2>

          <ul className={styles.items}>
            <li className={styles.item}>
              <div className={styles.itemThumb}>
                <img className={styles.itemImg} src={BOX_IMAGE} alt="" width={60} height={60} />
                <span className={styles.itemQty}>1</span>
              </div>
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>Trade Sample Box</p>
                <p className={styles.itemVariant}>6 specialities · Capperificio Caro</p>
              </div>
              <span className={styles.itemPrice}>{formatEur(0)}</span>
            </li>
          </ul>

          <div className={styles.rule} />

          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Samples</span>
              <span className={styles.totalAccent}>Complimentary</span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Shipping{selected ? ` to ${selected.label}` : ''}</span>
              <span>{total}</span>
            </div>
          </div>

          <div className={styles.rule} />

          <div className={styles.grandTotal}>
            <span className={styles.grandTotalLabel}>Total</span>
            <span className={styles.grandTotalValue}>{total}</span>
          </div>

          <div className={styles.trust}>
            <p className={styles.trustItem}>
              <LockIcon size={16} />
              <span>Encrypted payment handled by <strong>Stripe</strong>. Card details never reach our servers.</span>
            </p>
            <p className={styles.trustItem}>
              <TruckIcon size={16} />
              <span><strong>Tracked</strong> shipping: you will receive the tracking code by email.</span>
            </p>
            <p className={styles.trustItem}>
              <MailIcon size={16} />
              <span>Questions? <a href={`mailto:${COMPANY.emailB2B}`}>{COMPANY.emailB2B}</a></span>
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

export default function SampleBoxCheckoutPage() {
  useSEO({ title: 'Sample Box Checkout', path: RETURN_PATH, noindex: true });

  const [searchParams] = useSearchParams();
  const saved = useRef(loadSaved()).current;

  const [options, setOptions] = useState([]);
  const [country, setCountry] = useState(() => searchParams.get('country') || saved.country || 'BE');
  const [values, setValues] = useState(() => ({ ...EMPTY, ...(saved.values || {}) }));
  const [touched, setTouched] = useState({});
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState({});   // step → ha provato ad andare avanti

  const [clientSecret, setClientSecret] = useState(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [reference, setReference] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [verifyingRedirect, setVerifyingRedirect] = useState(
    () => new URLSearchParams(window.location.search).has('payment_intent_client_secret'),
  );

  const topRef = useRef(null);
  const titleRef = useRef(null);
  const prevStep = useRef(0);

  useEffect(() => {
    fetch('/api/sample-box')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setOptions(d.options || []))
      .catch(() => setOptions([]));
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ values, country })); } catch { /* storage pieno/negato */ }
  }, [values, country]);

  // Cambio step: il fuoco va al titolo (lo screen reader annuncia lo step).
  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    // Scorre solo se lo stepper è uscito dallo schermo (tipico su mobile, dove
    // il pulsante sta in fondo a un modulo lungo).
    const top = topRef.current;
    const offset = 80;   // header fisso
    if (top && top.getBoundingClientRect().top < offset) {
      const y = top.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
    titleRef.current?.focus({ preventScroll: true });
  }, [step]);

  const selected = options.find((o) => o.country === country);
  const errors = validate(values, country);
  const errorFor = (key) => {
    const owner = STEPS.findIndex((s) => s.fields.includes(key));
    return (attempted[owner] || touched[key]) ? errors[key] : undefined;
  };

  const fieldProps = (key) => ({
    value: values[key],
    onChange: (e) => setValues((v) => ({ ...v, [key]: e.target.value })),
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
    error: errorFor(key),
  });

  const createIntent = async () => {
    setIntentLoading(true);
    setIntentError(null);
    try {
      const { clientSecret: secret } = await postJson('/api/sample-box/create-intent', {
        country,
        contact: {
          company: values.company, vat: values.vat, firstName: values.firstName,
          lastName: values.lastName, email: values.email, phone: values.phone,
        },
        address: {
          line1: `${values.street.trim()} ${values.houseNumber.trim()}`,
          postalCode: values.zipcode, city: values.city,
        },
      });
      setClientSecret(secret);
    } catch (e) {
      setIntentError(`${e.message}. If the problem persists, write to ${COMPANY.emailB2B}.`);
    } finally {
      setIntentLoading(false);
    }
  };

  // Lasciare il pagamento invalida il PaymentIntent: dati e paese (quindi
  // importo) potrebbero cambiare. Rientrando se ne crea uno nuovo.
  const goTo = (target) => {
    if (target === step) return;
    if (step === 2) { setClientSecret(null); setIntentError(null); }
    setOrderError(null);
    setStep(target);
    if (target === 2) createIntent();
  };

  const next = (e) => {
    e?.preventDefault();
    setAttempted((a) => ({ ...a, [step]: true }));
    if (stepHasErrors(step, errors)) {
      const first = STEPS[step].fields.find((f) => errors[f]);
      document.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    if (step === 1 && !selected) return;
    goTo(step + 1);
  };

  // Uno step già visitato si può riaprire; in avanti solo se i precedenti sono validi.
  const canOpen = (i) => i < step || STEPS.slice(0, i).every((_, j) => !stepHasErrors(j, errors));

  const handleStripeSuccess = async (paymentIntentId) => {
    setOrderError(null);
    setPlacing(true);
    try {
      if (!paymentIntentId) throw new Error('Payment not identified. Please try again.');
      const data = await postJson('/api/sample-box/confirm', { paymentIntentId });
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      if (data.processing) setProcessing(true);
      else setReference(data.reference || '—');
      window.scrollTo({ top: 0 });
    } catch (e) {
      // Errore di rete dopo l'incasso: il webhook avvisa comunque il merchant.
      if (e instanceof TypeError) { setProcessing(true); return; }
      setOrderError(e.message);
      throw e;
    } finally {
      setPlacing(false);
    }
  };

  // Rientro da un metodo con redirect (es. Bancontact): Stripe torna qui con il
  // client secret in query string e il componente riparte da zero.
  const redirectHandled = useRef(false);
  useEffect(() => {
    const secret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');
    if (!secret || !stripePromise || redirectHandled.current) {
      if (!secret || !stripePromise) setVerifyingRedirect(false);
      return;
    }
    redirectHandled.current = true;
    window.history.replaceState(null, '', window.location.pathname);

    (async () => {
      try {
        const stripe = await stripePromise;
        const { paymentIntent } = await stripe.retrievePaymentIntent(secret);
        if (paymentIntent?.status === 'succeeded') {
          try { await handleStripeSuccess(paymentIntent.id); } catch { /* orderError già impostato */ }
        } else if (paymentIntent?.status === 'processing') {
          setProcessing(true);
        } else {
          setStep(1);
          setOrderError('Payment not completed. Please check your details and try again.');
        }
      } catch (e) {
        setOrderError(e.message || 'Unable to verify the payment. Please try again.');
      } finally {
        setVerifyingRedirect(false);
      }
    })();
  }, []);

  // ── Stati terminali ─────────────────────────────────────────────────
  if (verifyingRedirect) return (
    <div className={styles.loadingBlock} style={{ padding: 'var(--space-15) var(--space-9)' }}>
      <SpinnerIcon size={20} className={styles.spinner} />
      Verifying your payment…
    </div>
  );

  if (processing) return (
    <ResultScreen
      icon={<SpinnerIcon size={26} className={styles.spinner} />}
      title="Payment processing"
      action={<Link to="/sample-box" className={styles.resultLink}>Back to the sample box</Link>}
    >
      <p className={styles.resultText}>
        We are confirming your payment. As soon as it is complete we will prepare your box
        and send you the tracking details by email.
      </p>
    </ResultScreen>
  );

  if (reference) return (
    <ResultScreen
      icon={<CheckIcon size={26} />}
      title="Thank you — payment received"
      action={<Link to="/sample-box" className={styles.resultLink}>Back to the sample box</Link>}
    >
      {reference !== '—' && (
        <p className={styles.resultOrder}>Reference <strong>#{reference}</strong></p>
      )}
      <p className={styles.resultText}>
        We are preparing your sample box with all six specialities. A confirmation is on its
        way to your inbox, and we will email you the tracking number as soon as the box ships.
      </p>
    </ResultScreen>
  );

  const countryName = selected?.label || country;
  const billingDetails = {
    name: `${values.firstName} ${values.lastName}`.trim(),
    email: values.email,
    phone: values.phone,
    address: {
      line1: `${values.street} ${values.houseNumber}`.trim(),
      line2: '',
      postal_code: values.zipcode,
      city: values.city,
      state: '',
      country,
    },
  };

  const paymentCopy = {
    preparing: 'Preparing your payment…',
    retry: 'Try again',
    processing: 'Processing…',
    pay: selected ? `Pay ${formatEur(selected.amount)}` : 'Pay',
    express: 'Express checkout',
    orCard: 'or choose a payment method',
    paymentFailed: 'Payment failed. Please try again.',
    orderError: 'Something went wrong while confirming your payment.',
  };

  const backButton = (
    <button type="button" className={ms.backBtn} onClick={() => goTo(step - 1)}>
      <ArrowLeftIcon size={16} />Back
    </button>
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.headline}>Request your sample box</h1>
      <p className={styles.subhead}>
        The samples are complimentary — you only pay for shipping.{' '}
        <Link to="/sample-box" className={styles.btnLink}>Box details</Link>
      </p>

      <div className={styles.grid}>
        <div className={styles.formColumn} ref={topRef}>
          {/* ── Stepper ── */}
          <ol className={ms.stepper} aria-label="Checkout steps">
            {STEPS.map((s, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li
                  key={s.label}
                  className={`${ms.step} ${done ? ms.stepDone : ''} ${current ? ms.stepCurrent : ''}`}
                  aria-current={current ? 'step' : undefined}
                >
                  <button
                    type="button"
                    className={ms.stepBtn}
                    onClick={() => goTo(i)}
                    disabled={current || !canOpen(i)}
                  >
                    <span className={ms.stepDot}>{done ? <CheckIcon size={16} /> : i + 1}</span>
                    <span className={ms.stepLabel}>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* ── Step 1: dati azienda ── */}
          {step === 0 && (
            <form key="s0" className={ms.panel} onSubmit={next} noValidate>
              <h2 className={ms.panelTitle} ref={titleRef} tabIndex={-1}>Your details</h2>
              <p className={ms.panelHint}>We will use them for the payment receipt and the shipment tracking.</p>
              <div className={styles.fieldGrid}>
                <Field label="Company name" name="company" autoComplete="organization" {...fieldProps('company')} />
                <Field label="VAT number (optional)" name="vat" placeholder="BE0123456789" {...fieldProps('vat')} />
                <Field label="First name" name="firstName" autoComplete="given-name" {...fieldProps('firstName')} />
                <Field label="Last name" name="lastName" autoComplete="family-name" {...fieldProps('lastName')} />
                <Field
                  label="Email" name="email" type="email" inputMode="email" autoComplete="email"
                  placeholder="name@company.com" {...fieldProps('email')}
                />
                <Field
                  label="Phone" name="phone" type="tel" inputMode="tel" autoComplete="tel"
                  placeholder="+32 470 12 34 56" {...fieldProps('phone')}
                />
              </div>
              <div className={ms.nav}>
                <button type="submit" className={styles.btnPrimary}>
                  Continue<ArrowRightIcon size={17} />
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: spedizione ── */}
          {step === 1 && (
            <form key="s1" className={ms.panel} onSubmit={next} noValidate>
              <h2 className={ms.panelTitle} ref={titleRef} tabIndex={-1}>Shipping address</h2>
              <p className={ms.panelHint}>Where should we deliver the box?</p>
              <div className={styles.fieldGrid}>
                <Field label="Country" as="custom" error={null} full>
                  {({ id }) => (
                    <div className={styles.selectWrap}>
                      <select
                        id={id}
                        className={styles.select}
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        autoComplete="country"
                      >
                        {options.map((o) => (
                          <option key={o.country} value={o.country}>
                            {o.label} — {formatEur(o.amount)} shipping
                          </option>
                        ))}
                      </select>
                      <ChevronIcon size={16} className={styles.selectChevron} />
                    </div>
                  )}
                </Field>

                <div className={styles.streetRow}>
                  <Field label="Street" name="street" autoComplete="address-line1" {...fieldProps('street')} />
                  <Field label="No." name="houseNumber" autoComplete="address-line2" {...fieldProps('houseNumber')} />
                </div>
                <Field
                  label="Postcode" name="zipcode" autoComplete="postal-code"
                  placeholder={postcodeExample(country)} {...fieldProps('zipcode')}
                />
                <Field label="City" name="city" autoComplete="address-level2" {...fieldProps('city')} />
              </div>

              {selected && (
                <div className={styles.methodStatic} style={{ marginTop: 'var(--space-11)' }}>
                  <TruckIcon size={19} className={styles.methodIcon} />
                  <div>
                    <p className={styles.methodName}>Tracked courier · {formatEur(selected.amount)}</p>
                    <p className={styles.methodDesc}>Shipped from Racale (Italy) to {selected.label}.</p>
                  </div>
                </div>
              )}

              {orderError && (
                <p className={styles.errorBanner} role="alert">
                  <AlertIcon size={16} />
                  <span>{orderError}</span>
                </p>
              )}

              <div className={ms.nav}>
                {backButton}
                <button type="submit" className={styles.btnPrimary} disabled={!selected}>
                  <span className={ms.labelLong}>Continue to payment</span>
                  <span className={ms.labelShort}>Payment</span>
                  <ArrowRightIcon size={17} />
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: pagamento ── */}
          {step === 2 && (
            <div key="s2" className={ms.panel}>
              <h2 className={ms.panelTitle} ref={titleRef} tabIndex={-1}>Payment</h2>
              <p className={ms.panelHint}>Check your details, then pay the shipping. All payments are encrypted and handled by Stripe.</p>

              <div className={ms.recapCard}>
                <div className={ms.recapRow}>
                  <div>
                    <span className={ms.recapLabel}>Contact</span>
                    <strong>{values.company}</strong>{values.vat && <> · VAT {values.vat}</>}<br />
                    {values.firstName} {values.lastName} · {values.email}<br />
                    {values.phone}
                  </div>
                  <button type="button" className={styles.btnLink} onClick={() => goTo(0)}>Edit</button>
                </div>
                <div className={ms.recapRow}>
                  <div>
                    <span className={ms.recapLabel}>Ship to</span>
                    {values.street} {values.houseNumber}<br />
                    {values.zipcode} {values.city} · {countryName}
                  </div>
                  <button type="button" className={styles.btnLink} onClick={() => goTo(1)}>Edit</button>
                </div>
              </div>

              <PaymentSection
                stripePromise={stripePromise}
                clientSecret={clientSecret}
                loading={intentLoading}
                error={intentError}
                onRetry={createIntent}
                placing={placing}
                totalPrice={selected?.amount}
                onSuccess={handleStripeSuccess}
                onProcessingChange={setPlacing}
                billingDetails={billingDetails}
                locale="en"
                returnPath={RETURN_PATH}
                copy={paymentCopy}
                paymentMethodOrder={PAYMENT_ORDER[country]}
              />

              {orderError && (
                <p className={styles.errorBanner} role="alert">
                  <AlertIcon size={16} />
                  <span>{orderError}</span>
                </p>
              )}

              <div className={ms.nav}>
                {backButton}
                <span className={ms.secure}><LockIcon size={14} />Secure payment by Stripe</span>
              </div>
            </div>
          )}
        </div>

        <Summary selected={selected} />
      </div>
    </div>
  );
}
