import styles from './Hero.module.css';

export default function Hero({ image, alt = 'Hero' }) {
  const marqueeItems = Array.from({ length: 12 }, (_, i) => (
    <span key={i} className={i % 2 === 0 ? styles.dark : styles.white}>
      Produttori da 3 Generazioni.
    </span>
  ));

  return (
    <section className={styles.hero}>
      {image && <img src={image} alt={alt} className={styles.heroImg} />}
      <div className={styles.marquee}>
        <div className={styles.track}>{marqueeItems}</div>
      </div>
    </section>
  );
}
