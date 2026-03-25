import { Link } from 'react-router-dom';
import styles from './GuidesEditorial.module.css';

export default function GuidesEditorial({ image }) {
  return (
    <section className={styles.section}>
      <div className={styles.textCol}>
        <div className={styles.tag}><span className={styles.dot} /> In cucina</div>
        <h2 className={styles.heading}>Dall'antipasto al condimento</h2>
        <p className={styles.body}>
          I capperi di Racale si prestano a mille usi in cucina. Scopri come
          valorizzarli in ricette tradizionali e abbinamenti creativi, dal mare alla carne.
        </p>
        <Link to="/" className={styles.btn}>Scopri le ricette &rarr;</Link>
      </div>
      <div className={styles.photo}>
        {image && <img src={image} alt="Pouring the perfect cup" className={styles.photoImg} />}
      </div>
    </section>
  );
}
