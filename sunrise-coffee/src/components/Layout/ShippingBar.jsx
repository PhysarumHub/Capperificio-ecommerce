import styles from './ShippingBar.module.css';

const MESSAGE = 'Spend $50.00 to get free shipping';

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
