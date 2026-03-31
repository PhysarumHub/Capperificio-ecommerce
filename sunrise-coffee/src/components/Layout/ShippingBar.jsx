import styles from './ShippingBar.module.css';

const MESSAGE = 'Spedizione gratuita sopra €50';

export default function ShippingBar() {
  return (
    <div className={styles['shipping-bar']}>
      <div className={styles['shipping-bar__track']}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{MESSAGE}</span>
        ))}
      </div>
    </div>
  );
}
