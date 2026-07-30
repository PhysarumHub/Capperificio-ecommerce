import { Link } from 'react-router-dom';
import useInView from '../../hooks/useInView';
import styles from './CategoryBanner.module.css';
import anim from '../../styles/animations.module.css';

export default function CategoryBanners({ filterImage, espressoImage }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  return (
    <div ref={ref} className={styles.grid}>
      {/* Prima card — Il Nostro Territorio */}
      <Link
        to="/territorio"
        className={`${styles.card} ${styles.topLeft} ${anim.clipReveal} ${inView ? anim.inView : ''}`}
      >
        <div className={`${styles.bg} ${anim.imgZoom}`}>
          {filterImage
            ? <img src={filterImage} alt="Il Nostro Territorio" className={styles.bgImg} loading="lazy" decoding="async" />
            : <div className={styles.bgPlaceholder} />
          }
          <div className={styles.gradient} />
        </div>
        <span className={styles.text}>Il Nostro<br />Territorio</span>
        <span className={styles.arrow}>↗</span>
      </Link>

      {/* Seconda card — Processo Produttivo */}
      <Link
        to="/processo-produttivo"
        className={`${styles.card} ${styles.bottomRight} ${anim.clipReveal} ${inView ? anim.inView : ''}`}
        style={{ '--delay': '150ms' }}
      >
        <div className={`${styles.bg} ${anim.imgZoom}`}>
          {espressoImage
            ? <img src={espressoImage} alt="Processo Produttivo" className={styles.bgImg} loading="lazy" decoding="async" />
            : <div className={styles.bgPlaceholder} />
          }
          <div className={styles.gradient} />
        </div>
        <span className={styles.text}>Processo<br />Produttivo</span>
        <span className={styles.arrow}>↗</span>
      </Link>
    </div>
  );
}
