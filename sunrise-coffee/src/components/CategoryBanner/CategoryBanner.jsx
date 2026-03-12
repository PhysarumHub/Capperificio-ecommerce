import { Link } from 'react-router-dom';
import styles from './CategoryBanner.module.css';

export default function CategoryBanners({ filterImage, espressoImage }) {
  return (
    <div className={styles.grid}>
      <Link to="/collections/filter" className={`${styles.card} ${styles.topLeft}`}>
        <div className={styles.bg}>
          {filterImage ? (
            <img src={filterImage} alt="Shop Filter" className={styles.bgImg} />
          ) : (
            <div className={styles.bgPlaceholder} />
          )}
        </div>
        <span className={styles.text}>Shop Filter</span>
      </Link>
      <Link to="/collections/espresso" className={`${styles.card} ${styles.bottomRight}`}>
        <div className={styles.bg}>
          {espressoImage ? (
            <img src={espressoImage} alt="Shop Espresso" className={styles.bgImg} />
          ) : (
            <div className={styles.bgPlaceholder} />
          )}
        </div>
        <span className={styles.text}>Shop Espresso</span>
      </Link>
    </div>
  );
}
