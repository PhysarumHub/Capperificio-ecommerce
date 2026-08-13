import { useMemo } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import ExpressCheckout from './ExpressCheckout';
import StripePaymentForm from './StripePaymentForm';
import { buildAppearance, stripeFonts } from './stripeAppearance';
import { AlertIcon, SpinnerIcon, TagIcon } from './CheckoutIcons';
import { formatPrice } from '../../lib/utils/price';
import styles from './Checkout.module.css';

/**
 * Blocco pagamento: wallet + carta, oppure la conferma diretta quando il totale
 * è 0,00 € (codice sconto al 100%, che Stripe non può incassare).
 */
export default function PaymentSection({
  stripePromise, clientSecret, loading, error, onRetry,
  freeOrder, onFreeOrder, placing,
  totalPrice, onSuccess, onProcessingChange, billingDetails,
}) {
  // L'aspetto dipende dai token CSS, che non cambiano durante la sessione:
  // ricostruirlo a ogni render rimonterebbe gli Elements a ogni battuta.
  const appearance = useMemo(() => buildAppearance(), []);
  const fonts = useMemo(() => stripeFonts(), []);

  if (!stripePromise) {
    return (
      <p className={styles.errorBanner}>
        <AlertIcon size={16} />
        <span>
          Pagamento non configurato: manca <code>VITE_STRIPE_PUBLIC_KEY</code> nel file <code>.env</code>.
        </span>
      </p>
    );
  }

  // Anche prima che l'effetto parta il PaymentIntent non c'è ancora: senza
  // questo caso la sezione restava vuota per un istante appena aperta.
  if (loading || (!clientSecret && !freeOrder && !error)) {
    return (
      <div className={styles.loadingBlock}>
        <SpinnerIcon size={18} className={styles.spinner} />
        Preparazione del pagamento…
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <p className={styles.errorBanner} role="alert">
          <AlertIcon size={16} />
          <span>{error}</span>
        </p>
        <button type="button" className={styles.btnSecondary} onClick={onRetry} style={{ marginTop: 'var(--space-7)' }}>
          Riprova
        </button>
      </div>
    );
  }

  if (freeOrder) {
    return (
      <div>
        <div className={styles.methodStatic}>
          <TagIcon size={19} className={styles.methodIcon} />
          <div>
            <p className={styles.methodName}>Ordine gratuito</p>
            <p className={styles.methodDesc}>Il codice sconto copre l’intero importo.</p>
          </div>
        </div>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onFreeOrder}
          disabled={placing}
          style={{ marginTop: 'var(--space-9)' }}
        >
          {placing
            ? <><SpinnerIcon size={17} className={styles.spinner} />Elaborazione…</>
            : <>Completa l’ordine · {formatPrice(0)}</>}
        </button>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, locale: 'it', appearance, fonts }}
    >
      <ExpressCheckout onSuccess={onSuccess} onProcessingChange={onProcessingChange} />
      <StripePaymentForm
        onSuccess={onSuccess}
        totalPrice={totalPrice}
        disabled={placing}
        billingDetails={billingDetails}
      />
    </Elements>
  );
}
