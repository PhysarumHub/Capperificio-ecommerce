import { Link } from 'react-router-dom';
import styles from './Marquee.module.css';

export function BrandMarquee() {
  const items = Array.from({ length: 12 }, (_, i) => (
    <span key={i} className={i % 2 === 0 ? styles.dark : styles.red}>
      Capperi di Racale.
    </span>
  ));

  return (
    <div className={styles.marquee}>
      <div className={styles.track}>{items}</div>
    </div>
  );
}

const PRODUCT_NAMES = [
  'Lilliput', 'Lacrimella', 'Occhio di pernice', 'Capperone',
  'Cucunci', 'Foglie', 'Polvere', 'Cofanetto',
];

export function ProductsMarquee({ names = PRODUCT_NAMES }) {
  const items = [...names, ...names].map((name, i) => (
    <span key={i}>
      <Link to={`/product/${name.toLowerCase().replace(/\s+/g, '-')}`}>{name}</Link>
      <span className={styles.sep}>&rsaquo;</span>
    </span>
  ));

  return (
    <div className={styles.productsMarquee}>
      <div className={styles.productsTrack}>{items}</div>
    </div>
  );
}

export function RedMarquee({ text = 'Raccolti a mano — Racale, Puglia' }) {
  const items = Array.from({ length: 16 }, (_, i) => (
    <span key={i}>
      <span>{text}</span>
      <span className={styles.redSep}>&dagger;&dagger;&dagger;&dagger;&dagger;&dagger;</span>
    </span>
  ));

  return (
    <div className={styles.redMarquee}>
      <div className={styles.redTrack}>{items}</div>
    </div>
  );
}
