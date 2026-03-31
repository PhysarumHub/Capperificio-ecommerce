import useInView from '../../hooks/useInView';
import styles from './AboutSection.module.css';
import anim from '../../styles/animations.module.css';

export default function AboutSection() {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`${styles.section} ${anim.fadeUp} ${inView ? anim.inView : ''}`}>
      <div className={styles.content}>
        <div className={styles.label}><span className={styles.dot} /> Chi siamo</div>
        <p className={styles.quote}>
          Tre generazioni di sapere artigianale tra le distese di Racale, in Puglia.
          Coltiviamo e selezioniamo capperi con cura, rispettando la terra e i ritmi
          della natura&mdash;perché il gusto autentico non si improvvisa.
        </p>
      </div>
    </div>
  );
}
