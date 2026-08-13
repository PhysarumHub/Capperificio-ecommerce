import { useState } from 'react';
import { ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertIcon } from './CheckoutIcons';
import styles from './Checkout.module.css';

/**
 * Apple Pay / Google Pay / Link, sopra il modulo carta.
 *
 * Vive dentro lo stesso `<Elements>` del PaymentElement, quindi sul
 * PaymentIntent già creato: l'importo mostrato nel foglio del wallet è per
 * costruzione lo stesso che viene addebitato. È il motivo per cui questo blocco
 * compare solo dopo l'indirizzo — la spedizione (e quindi il totale) dipende dal
 * paese, e un wallet che mostra un totale diverso dall'addebito è peggio che non
 * averlo affatto.
 *
 * Se sul dispositivo non c'è nessun wallet disponibile, `onReady` non riporta
 * metodi e il blocco si toglie di mezzo senza lasciare spazi vuoti.
 */
export default function ExpressCheckout({ onSuccess, onProcessingChange }) {
  const stripe = useStripe();
  const elements = useElements();
  const [available, setAvailable] = useState(null);   // null = ancora da sapere
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setError(null);
    onProcessingChange?.(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) { setError(submitError.message); return; }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/checkout` },
        redirect: 'if_required',
      });
      if (confirmError) { setError(confirmError.message); return; }

      await onSuccess(paymentIntent?.id);
    } catch (err) {
      setError(err?.message || 'Pagamento non riuscito. Riprova.');
    } finally {
      onProcessingChange?.(false);
    }
  };

  if (available === false) return null;

  return (
    <div className={styles.express} hidden={available === null}>
      <p className={styles.expressLabel}>Pagamento rapido</p>

      <ExpressCheckoutElement
        options={{
          buttonHeight: 52,
          buttonTheme: { applePay: 'black', googlePay: 'black' },
          // Una colonna: a due, con un solo wallet disponibile, il bottone
          // restava largo metà pagina col testo tagliato.
          layout: { maxColumns: 1, overflow: 'never' },
        }}
        onReady={({ availablePaymentMethods }) => {
          setAvailable(Boolean(availablePaymentMethods && Object.keys(availablePaymentMethods).length));
        }}
        onConfirm={handleConfirm}
        onCancel={() => onProcessingChange?.(false)}
      />

      {error && (
        <p className={styles.errorBanner} role="alert">
          <AlertIcon size={16} />
          <span>{error}</span>
        </p>
      )}

      <div className={styles.divider}>oppure paga con carta</div>
    </div>
  );
}
