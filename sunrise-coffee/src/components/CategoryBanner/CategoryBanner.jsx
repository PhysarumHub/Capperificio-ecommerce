import { Link } from 'react-router-dom';
import useInView from '../../hooks/useInView';
import styles from './CategoryBanner.module.css';
import anim from '../../styles/animations.module.css';

export default function CategoryBanners({ filterImage, espressoImage }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  return (
    <div ref={ref} className={styles.grid}>
      <Link
        to="/collections/filter"
        className={`${styles.card} ${styles.topLeft} ${anim.clipReveal} ${inView ? anim.inView : ''}`}
      >
        <div className={`${styles.bg} ${anim.imgZoom}`}>
          {filterImage
            ? <img src={filterImage} alt="Shop Filter" className={styles.bgImg} />
            : <div className={styles.bgPlaceholder} />
          }
        </div>
        <span className={styles.text}>Shop Filter</span>
      </Link>

      <Link
        to="/collections/espresso"
        className={`${styles.card} ${styles.bottomRight} ${anim.clipReveal} ${inView ? anim.inView : ''}`}
        style={{ '--delay': '150ms' }}
      >
        <div className={`${styles.bg} ${anim.imgZoom}`}>
          {espressoImage
            ? <img src={espressoImage} alt="Shop Espresso" className={styles.bgImg} />
            : <div className={styles.bgPlaceholder} />
          }
        </div>
        <span className={styles.text}>Shop Espresso</span>
      </Link>
    </div>
  );
}
