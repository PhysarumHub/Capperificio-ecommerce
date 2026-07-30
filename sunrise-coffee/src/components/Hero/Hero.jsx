import styles from './Hero.module.css';

/**
 * @param {string} [heading] - Titolo della pagina (h1). Reso accessibile agli
 *   screen reader e ai crawler senza alterare la composizione visiva dell'hero:
 *   il testo visibile è affidato al marquee. Per mostrarlo in sovrimpressione
 *   sono già pronte le classi .overlay / .overlayTitle in Hero.module.css.
 */
export default function Hero({ image, alt = 'Hero', heading }) {
  const marqueeItems = Array.from({ length: 12 }, (_, i) => (
    <span key={i} className={styles.white}>
      Produttori di capperi. Da 3 generazioni.
    </span>
  ));

  return (
    <section className={styles.hero}>
      {heading && <h1 className="sr-only">{heading}</h1>}
      {image && (
        <img
          src={image}
          alt={alt}
          className={styles.heroImg}
          width="1280"
          height="897"
          fetchPriority="high"
          decoding="async"
        />
      )}
      <div className={styles.marquee}>
        <div className={styles.track}>{marqueeItems}</div>
      </div>
    </section>
  );
}
