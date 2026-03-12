import styles from './AboutSection.module.css';

export default function AboutSection() {
  return (
    <div className={styles.section}>
      <div className={styles.label}><span className={styles.dot} /> About Us</div>
      <p className={styles.quote}>
        Sunrise Coffee Co started with a simple idea: great mornings begin with great coffee.
        We believe coffee should be fresh, approachable, and something you actually look
        forward to drinking&mdash;every single day.
      </p>
    </div>
  );
}
