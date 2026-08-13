import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatPrice } from '../../lib/utils/price';
import { LockIcon, AlertIcon, SpinnerIcon } from './CheckoutIcons';
import styles from './Checkout.module.css';

/**
 * Modulo carta/wallet: conferma il pagamento su Stripe, poi lascia al server la
 * creazione dell'ordine (`onSuccess`).
 */
export default function StripePaymentForm({ onSuccess, totalPrice, disabled, billingDetails }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || loading) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setLoading(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout`,
        // I dati di fatturazione arrivano dal form: senza questo Stripe li
        // richiederebbe di nuovo (nome, email, paese) subito dopo che l'utente
        // li ha appena scritti.
        payment_method_data: { billing_details: billingDetails },
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message);
      setLoading(false);
      return;
    }

    // Pagamento confermato → il server verifica il PaymentIntent e crea l'ordine
    try {
      await onSuccess(paymentIntent?.id);
    } catch (err) {
      setError(err?.message || 'Errore durante il completamento dell’ordine.');
    }
    setLoading(false);
  };

  const busy = loading || disabled;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PaymentElement
        options={{
          layout: 'tabs',
          // Nessun campo di fatturazione duplicato: li abbiamo già tutti dal
          // form e li passiamo alla conferma. Restano solo i dati della carta.
          fields: { billingDetails: 'never' },
        }}
      />

      {error && (
        <p className={styles.errorBanner} role="alert">
          <AlertIcon size={16} />
          <span>{error}</span>
        </p>
      )}

      <button
        type="submit"
        className={styles.btnPrimary}
        disabled={busy || !stripe}
        style={{ marginTop: 'var(--space-9)' }}
      >
        {busy ? (
          <><SpinnerIcon size={17} className={styles.spinner} />Elaborazione…</>
        ) : (
          <><LockIcon size={17} />
            Paga {typeof totalPrice === 'number' ? formatPrice(totalPrice) : ''}</>
        )}
      </button>
    </form>
  );
}
