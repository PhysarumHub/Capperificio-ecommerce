import { useState } from 'react';
import { formatPrice } from '../../lib/utils/price';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function StripePaymentForm({ onSuccess, totalPrice, isMobile }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setLoading(false);
      return;
    }

    // Confirm payment — Stripe verifica la carta
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // evita redirect per carte normali
    });

    if (confirmError) {
      setError(confirmError.message);
      setLoading(false);
      return;
    }

    // Pagamento confermato → completa l'ordine su Shopware
    await onSuccess();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: 'tabs',
          fields: { billingDetails: { name: 'auto', email: 'auto' } },
        }}
      />

      {error && (
        <p style={{ color: 'var(--color-red)', fontSize: 13, marginTop: 12 }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        style={{
          width: '100%',
          marginTop: 20,
          padding: isMobile ? '16px 0' : '14px 0',
          background: loading ? '#ccc' : 'var(--color-red)',
          color: '#fff', border: 'none',
          borderRadius: 'var(--radius-pill)',
          fontSize: isMobile ? 16 : 15, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)', minHeight: 52,
        }}
      >
        {loading ? 'Elaborazione...' : `Paga ${typeof totalPrice === 'number' ? formatPrice(totalPrice) : ''}`}
      </button>
    </form>
  );
}
