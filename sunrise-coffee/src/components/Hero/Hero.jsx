import { useLayoutEffect, useRef, useState } from 'react';
import { takeBootHeroImg } from '../../lib/bootShell';
import styles from './Hero.module.css';

/**
 * @param {string} [heading] - Titolo della pagina (h1). Reso accessibile agli
 *   screen reader e ai crawler senza alterare la composizione visiva dell'hero:
 *   il testo visibile è affidato al marquee. Per mostrarlo in sovrimpressione
 *   sono già pronte le classi .overlay / .overlayTitle in Hero.module.css.
 */
export default function Hero({ image, srcSet, sizes = '100vw', alt = 'Hero', heading }) {
  const marqueeItems = Array.from({ length: 12 }, (_, i) => (
    <span key={i} className={styles.white}>
      Produttori di capperi. Da 3 generazioni.
    </span>
  ));

  // Al primo render della home riusa l'<img> già dipinta dallo shell statico.
  const [bootImg] = useState(() => (image ? takeBootHeroImg() : null));
  const slotRef = useRef(null);

  useLayoutEffect(() => {
    if (!bootImg || !slotRef.current) return;
    bootImg.className = styles.heroImg;
    bootImg.alt = alt;
    bootImg.removeAttribute('aria-hidden');
    slotRef.current.appendChild(bootImg);
  }, [bootImg, alt]);

  return (
    <section className={styles.hero}>
      {heading && <h1 className="sr-only">{heading}</h1>}
      {/* Contenitore vuoto per React: dentro ci va il nodo dello shell. */}
      {bootImg && <span ref={slotRef} style={{ display: 'contents' }} />}
      {image && !bootImg && (
        <img
          src={image}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
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
