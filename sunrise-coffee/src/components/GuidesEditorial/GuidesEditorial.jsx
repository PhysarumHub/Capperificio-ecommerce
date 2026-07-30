import { Link } from 'react-router-dom';
import useInView from '../../hooks/useInView';
import styles from './GuidesEditorial.module.css';
import anim from '../../styles/animations.module.css';

export default function GuidesEditorial({ image }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  return (
    <section ref={ref} className={styles.section}>
      <div className={`${styles.textCol} ${anim.slideLeft} ${inView ? anim.inView : ''}`}>
        <div className={styles.tag}><span className={styles.dot} /> In cucina</div>
        <h2 className={styles.heading}>Dall&rsquo;antipasto al condimento</h2>
        <p className={styles.body}>
          I capperi di Racale si prestano a mille usi in cucina. Scopri come
          valorizzarli in ricette tradizionali e abbinamenti creativi, dal mare alla carne.
        </p>
        <Link to="/" className={styles.btn}>Scopri le ricette &rarr;</Link>
      </div>
      <div
        className={`${styles.photo} ${anim.slideRight} ${inView ? anim.inView : ''}`}
        style={{ '--delay': '80ms' }}
      >
        {image && <img src={image} alt="Capperi in cucina" className={styles.photoImg} loading="lazy" decoding="async" />}
      </div>
    </section>
  );
}
