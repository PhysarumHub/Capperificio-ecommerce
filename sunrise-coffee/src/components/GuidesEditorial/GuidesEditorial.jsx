import { Link } from 'react-router-dom';
import styles from './GuidesEditorial.module.css';

export default function GuidesEditorial({ image }) {
  return (
    <section className={styles.section}>
      <div className={styles.textCol}>
        <div className={styles.tag}><span className={styles.dot} /> Guides</div>
        <h2 className={styles.heading}>Pouring the perfect cup</h2>
        <p className={styles.body}>
          Every brew method has its own feel, and part of the fun is figuring out what works
          for you. Start with these guides, make small adjustments, and follow your taste from there.
        </p>
        <Link to="/" className={styles.btn}>Read Now &rarr;</Link>
      </div>
      <div className={styles.photo}>
        {image && <img src={image} alt="Pouring the perfect cup" className={styles.photoImg} />}
      </div>
    </section>
  );
}
