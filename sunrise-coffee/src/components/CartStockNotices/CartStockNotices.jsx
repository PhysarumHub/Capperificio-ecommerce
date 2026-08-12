import { getCartStockIssues } from '../../lib/utils/availability';
import styles from './CartStockNotices.module.css';

/**
 * Mostra gli avvisi di stock che Shopware restituisce nel carrello.
 *
 * La Store API risponde 200 anche quando riduce la quantità o rimuove del tutto
 * una riga perché il prodotto è esaurito: senza questo blocco l'utente vede solo
 * il carrello cambiare da solo. Usato in drawer, pagina carrello e checkout così
 * il messaggio è identico ovunque.
 */
export default function CartStockNotices({ cart, className = '' }) {
  const issues = getCartStockIssues(cart);
  if (!issues.length) return null;

  return (
    <ul className={`${styles.notices} ${className}`.trim()} role="status" aria-live="polite">
      {issues.map((issue) => (
        <li key={issue.id} className={styles.notice}>{issue.message}</li>
      ))}
    </ul>
  );
}
