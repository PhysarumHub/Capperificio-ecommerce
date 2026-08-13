import { useId } from 'react';
import { AlertIcon } from './CheckoutIcons';
import styles from './Checkout.module.css';

/**
 * Campo di form del checkout: label, input ed errore.
 *
 * L'errore è legato all'input con `aria-describedby` e la label con un `htmlFor`
 * reale: prima le label non erano associate ad alcun campo, quindi uno screen
 * reader annunciava solo "casella di testo" e il click sulla label non dava
 * il fuoco all'input.
 */
export default function Field({
  label, error, optional, full, className = '',
  as = 'input', children, ...inputProps
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={`${styles.field} ${full ? styles.fieldFull : ''} ${className}`.trim()}>
      <label htmlFor={id} className={`${styles.fieldLabel} ${error ? styles.fieldLabelError : ''}`}>
        {label}
        {optional && <span className={styles.optional}>(facoltativo)</span>}
      </label>

      {as === 'custom' ? (
        children({ id, describedBy: error ? errorId : undefined })
      ) : (
        <input
          id={id}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
      )}

      {error && (
        <p id={errorId} className={styles.fieldError}>
          <AlertIcon size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
