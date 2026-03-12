import { Link } from 'react-router-dom';
import styles from './ProductCard.module.css';

export default function ProductCard({
  name,
  slug,
  price,
  oldPrice,
  image,
  badge,
  badgeColor,
  stars,
  variant = 'default',
  children,
}) {
  const href = `/product/${slug || name.toLowerCase().replace(/\s+/g, '-')}`;

  if (variant === 'merch') {
    return (
      <div className={styles.card}>
        <div className={`${styles.imgWrap} ${styles.imgSquare}`}>
          {image ? (
            <img src={image} alt={name} className={styles.productImg} />
          ) : children}
        </div>
        <div className={styles.merchFooter}>
          <span className={styles.merchName}>{name}</span>
          <span className={styles.merchPrice}>{price}</span>
        </div>
      </div>
    );
  }

  return (
    <Link to={href} className={styles.card}>
      <div className={styles.imgWrap}>
        {badge && (
          <span className={`${styles.badge} ${badgeColor === 'blue' ? styles.badgeBlue : ''}`}>
            {badge}
          </span>
        )}
        {image ? (
          <img src={image} alt={name} className={styles.productImg} />
        ) : (
          <div className={styles.imgPlaceholder} />
        )}
      </div>
      <div className={styles.info}>
        <div>
          <span className={styles.name}>{name}</span>
          {stars && (
            <div className={styles.stars}>
              {Array.from({ length: stars }, (_, i) => <span key={i}>★</span>)}
            </div>
          )}
        </div>
        <div className={styles.pricing}>
          <span className={styles.priceLabel}>
            From{oldPrice && <> <span className={styles.oldPrice}>{oldPrice}</span></>}
          </span>
          <span className={styles.price}>{price}</span>
        </div>
      </div>
    </Link>
  );
}
