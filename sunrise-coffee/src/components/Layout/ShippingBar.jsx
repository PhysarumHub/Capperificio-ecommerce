import styles from './ShippingBar.module.css';
import { FREE_SHIPPING_THRESHOLD } from '../../lib/utils/shipping';

const MESSAGE = `Spedizione gratuita sopra €${FREE_SHIPPING_THRESHOLD}`;

export default function ShippingBar() {
  return (
    <div className={styles['shipping-bar']}>
      <div className={styles['shipping-bar__track']}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} aria-hidden={i > 0 ? 'true' : undefined}>{MESSAGE}</span>
        ))}
      </div>
    </div>
  );
}
