import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

import { useSEO } from '../hooks/useSEO';
import { isValidPostcode, isValidPhone, postcodeExample } from '../lib/utils/address';
import { COMPANY } from '../data/company';
import Field from '../components/checkout/Field';
import PaymentSection from '../components/checkout/PaymentSection';
import {
  CheckIcon, AlertIcon, PencilIcon, ArrowRightIcon, SpinnerIcon, ChevronIcon,
  LockIcon, TruckIcon, MailIcon,
} from '../components/checkout/CheckoutIcons';
import styles from '../components/checkout/Checkout.module.css';

/* Checkout del box campioni B2B (/sample-box → qui). Stessa struttura e stessi
   componenti di CheckoutPage, ma in inglese e senza carrello Shopware: il
   server crea un PaymentIntent con l'importo della spedizione per il paese
   scelto (vedi /api/sample-box/* in server.js). */

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const RETURN_PATH = '/sample-box/checkout';
const BOX_IMAGE = '/images/capperificio-caro-capperi-racale.webp';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = {
  company: '', vat: '', firstName: '', lastName: '', email: '', phone: '',
  street: '', houseNumber: '', zipcode: '', city: '',
};

const CONTACT_FIELDS = ['company', 'firstName', 'lastName', 'email', 'phone'];
const ADDRESS_FIELDS = ['street', 'houseNumber', 'zipcode', 'city'];

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

function formatEur(amount) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
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

export default function SampleBoxCheckoutPage() {
  useSEO({ title: 'Sample Box Checkout', path: RETURN_PATH, noindex: true });

  const [searchParams] = useSearchParams();
  const [options, setOptions] = useState([]);
  const [country, setCountry] = useState(() => searchParams.get('country') || 'BE');

  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const [paymentOpen, setPaymentOpen] = useState(false);
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
  const paymentRef = useRef(null);

  useEffect(() => {
    fetch('/api/sample-box')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setOptions(d.options || []))
      .catch(() => setOptions([]));
  }, []);

  const selected = options.find((o) => o.country === country);
  const errors = validate(values, country);
  const errorFor = (key) => ((submitted || touched[key]) ? errors[key] : undefined);

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
      setIntentError(e.message);
    } finally {
      setIntentLoading(false);
    }
  };

  const openPayment = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError('');
    if (!selected) { setFormError('Please choose a destination country.'); return; }
    if (Object.keys(errors).length) {
      setFormError('Please check the highlighted fields.');
      return;
    }
    setPaymentOpen(true);
    requestAnimationFrame(() => paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    await createIntent();
  };

  // Tornare a modificare i dati invalida il PaymentIntent: indirizzo e paese
  // (quindi importo) potrebbero cambiare.
  const reopenForm = () => {
    setPaymentOpen(false);
    setClientSecret(null);
    setIntentError(null);
    setOrderError(null);
  };

  const handleStripeSuccess = async (paymentIntentId) => {
    setOrderError(null);
    setPlacing(true);
    try {
      if (!paymentIntentId) throw new Error('Payment not identified. Please try again.');
      const data = await postJson('/api/sample-box/confirm', { paymentIntentId });
      if (data.processing) setProcessing(true);
      else setReference(data.reference || '—');
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
          setOrderError('Payment not completed. Please fill in your details and try again.');
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
        We are preparing your sample box with all six specialities. You will receive the
        payment receipt and, once shipped, the tracking details by email.
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
    orCard: 'or pay by card',
    paymentFailed: 'Payment failed. Please try again.',
    orderError: 'Something went wrong while confirming your payment.',
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.headline}>Request your sample box</h1>
      <p className={styles.subhead}>
        The samples are complimentary — you only pay for shipping.{' '}
        <Link to="/sample-box" className={styles.btnLink}>Back to the box details</Link>
      </p>

      <div className={styles.grid}>
        <div className={styles.formColumn}>
        <form onSubmit={openPayment} noValidate>

          {/* ── 1. Company & contact ─────────────────────── */}
          <section className={`${styles.section} ${styles.sectionFirst}`}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>01</span>
                Company &amp; contact
              </h2>
              {paymentOpen && (
                <button type="button" className={styles.editBtn} onClick={reopenForm}>
                  <PencilIcon size={14} />Edit
                </button>
              )}
            </div>

            {paymentOpen ? (
              <div className={styles.recap}>
                <div className={styles.recapLine}>
                  <strong>{values.company}</strong>{values.vat && <> · VAT {values.vat}</>}<br />
                  {values.firstName} {values.lastName} · {values.email}<br />
                  {values.phone}
                </div>
              </div>
            ) : (
              <div className={styles.sectionBody}>
                <p className={styles.sectionHint}>We will use these details for the receipt and the shipment tracking.</p>
                <div className={styles.fieldGrid}>
                  <Field label="Company name" autoComplete="organization" {...fieldProps('company')} />
                  <Field label="VAT number (optional)" placeholder="BE0123456789" {...fieldProps('vat')} />
                  <Field label="First name" autoComplete="given-name" {...fieldProps('firstName')} />
                  <Field label="Last name" autoComplete="family-name" {...fieldProps('lastName')} />
                  <Field
                    label="Email" type="email" inputMode="email" autoComplete="email"
                    placeholder="name@company.com" {...fieldProps('email')}
                  />
                  <Field
                    label="Phone" type="tel" inputMode="tel" autoComplete="tel"
                    placeholder="+32 470 12 34 56" {...fieldProps('phone')}
                  />
                </div>
              </div>
            )}
          </section>

          {/* ── 2. Shipping ──────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>02</span>
                Shipping
              </h2>
              {paymentOpen && (
                <button type="button" className={styles.editBtn} onClick={reopenForm}>
                  <PencilIcon size={14} />Edit
                </button>
              )}
            </div>

            {paymentOpen ? (
              <div className={styles.recap}>
                <div className={styles.recapLine}>
                  <strong>{values.street} {values.houseNumber}</strong><br />
                  {values.zipcode} {values.city} · {countryName}
                </div>
              </div>
            ) : (
              <div className={styles.sectionBody}>
                <p className={styles.sectionHint}>Where should we deliver the box?</p>
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
                    <Field label="Street" autoComplete="address-line1" {...fieldProps('street')} />
                    <Field label="Number" autoComplete="address-line2" {...fieldProps('houseNumber')} />
                  </div>
                  <Field
                    label="Postcode" autoComplete="postal-code"
                    placeholder={postcodeExample(country)} {...fieldProps('zipcode')}
                  />
                  <Field label="City" autoComplete="address-level2" {...fieldProps('city')} />
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

                <button type="submit" className={styles.btnPrimary} style={{ marginTop: 'var(--space-12)' }}>
                  Continue to payment<ArrowRightIcon size={17} />
                </button>

                {formError && (
                  <p className={styles.formError} role="alert">
                    <AlertIcon size={15} />{formError}
                  </p>
                )}
                {!paymentOpen && orderError && (
                  <p className={styles.errorBanner} role="alert">
                    <AlertIcon size={16} />
                    <span>{orderError}</span>
                  </p>
                )}
              </div>
            )}
          </section>
        </form>

          {/* ── 3. Payment ───────────────────────────────── */}
          <section className={styles.section} ref={paymentRef}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>03</span>
                Payment
              </h2>
            </div>

            {paymentOpen ? (
              <div className={styles.sectionBody}>
                <p className={styles.sectionHint}>All payments are encrypted and handled by Stripe.</p>

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
                Card, Apple&nbsp;Pay, Google&nbsp;Pay and more. Fill in your details above to continue.
              </p>
            )}
          </section>
        </div>

        {/* ── Riepilogo ─────────────────────────────────────── */}
        <aside className={styles.summary} aria-label="Order summary">
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
                <span>{selected ? formatEur(selected.amount) : '—'}</span>
              </div>
            </div>

            <div className={styles.rule} />

            <div className={styles.grandTotal}>
              <span className={styles.grandTotalLabel}>Total</span>
              <span className={styles.grandTotalValue}>{selected ? formatEur(selected.amount) : '—'}</span>
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
        </aside>
      </div>
    </div>
  );
}
