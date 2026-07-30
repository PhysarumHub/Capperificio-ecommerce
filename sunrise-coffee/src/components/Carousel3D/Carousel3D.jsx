import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';

import { scenes } from '../../lib/carousel3d/data';
import styles from './Carousel3D.module.css';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

/** Evenly spaces `count` cells around a circle of the given radius. */
function cellTransforms(count, radius) {
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => `rotateY(${i * step}deg) translateZ(${radius}px)`);
}

/** Resolves once every URL has loaded (or failed — we never block on a 404). */
function preloadImages(urls) {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = src;
        })
    )
  );
}

export default function Carousel3D() {
  const [isLoading, setIsLoading] = useState(true);

  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const titleRefs = useRef([]);
  const carouselRefs = useRef([]);

  useEffect(() => {
    let destroyed = false;

    const allImages = scenes.flatMap((scene) => scene.cards);

    preloadImages(allImages).then(() => {
      if (destroyed) return;
      setIsLoading(false);
      ScrollTrigger.refresh();
    });

    const ctx = gsap.context(() => {
      const smoother = ScrollSmoother.create({
        wrapper: wrapperRef.current,
        content: contentRef.current,
        smooth: 1.2,
        smoothTouch: 0.1,
      });

      const isMobile = window.innerWidth < 768;

      carouselRefs.current.forEach((carousel, i) => {
        if (!carousel) return;

        const scene = carousel.closest(`.${styles.scene}`);
        const cells = carousel.querySelectorAll(`.${styles.cell}`);
        const cards = carousel.querySelectorAll(`.${styles.card}`);
        // Il filtro va sulle facce, non su `.card`: un `filter` crea un contesto
        // di stacking che appiattisce il 3D e disattiverebbe backface-visibility.
        const faces = carousel.querySelectorAll(`.${styles.cardFace}`);

        // Lay the cells out around the cylinder.
        const radius = isMobile ? scenes[i].radiusMobile : scenes[i].radius;
        const transforms = cellTransforms(cells.length, radius);
        cells.forEach((cell, j) => {
          cell.style.transform = transforms[j];
        });

        // Scroll-scrubbed rotation, tilt and dimming.
        gsap
          .timeline({
            defaults: { ease: 'sine.inOut' },
            scrollTrigger: {
              trigger: scene,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          })
          .fromTo(carousel, { rotationY: 0 }, { rotationY: -180 }, 0)
          .fromTo(carousel, { rotationZ: 3, rotationX: 3 }, { rotationZ: -3, rotationX: -3 }, 0)
          .fromTo(faces, { filter: 'brightness(250%)' }, { filter: 'brightness(80%)', ease: 'power3' }, 0)
          .fromTo(cards, { rotationZ: 10 }, { rotationZ: -10, ease: 'none' }, 0);
      });

      // Titles animate in character by character.
      titleRefs.current.forEach((span, i) => {
        if (!span) return;

        const split = SplitText.create(span, { type: 'chars', charsClass: styles.char });

        gsap.fromTo(
          split.chars,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.02,
            ease: 'none',
            stagger: { each: 0.04, from: 'start' },
            scrollTrigger: {
              trigger: carouselRefs.current[i]?.closest(`.${styles.scene}`),
              start: 'top center',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      return () => smoother.kill();
    }, wrapperRef);

    return () => {
      destroyed = true;
      ctx.revert();
    };
  }, []);

  return (
    <div className={styles.page}>
      {isLoading && <div className={styles.loading}>Caricamento</div>}

      <div ref={wrapperRef} className={styles.smoothWrapper}>
        <div ref={contentRef} className={styles.smoothContent}>
          <div className={styles.intro}>
            <span className={styles.introKicker}>Capperificio Caro</span>
            <h1 className={styles.introTitle}>La raccolta, calibro per calibro</h1>
            <span className={styles.introHint}>Scorri</span>
          </div>

          {scenes.map((scene, i) => (
            <section key={scene.id} className={styles.scene}>
              <h2 className={styles.sceneTitle}>
                <span
                  ref={(el) => {
                    titleRefs.current[i] = el;
                  }}
                >
                  {scene.title}
                </span>
              </h2>

              <div
                className={styles.carousel}
                ref={(el) => {
                  carouselRefs.current[i] = el;
                }}
              >
                {scene.cards.map((img, j) => (
                  <div key={j} className={styles.cell}>
                    <div className={styles.card} style={{ '--img': `url(${img})` }}>
                      <div className={styles.cardFace} />
                      <div className={`${styles.cardFace} ${styles.cardFaceBack}`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className={styles.outro}>
            <h2 className={styles.outroTitle}>Racale, Salento — dove tutto ha inizio</h2>
            <Link to="/" className={styles.backLink}>
              Torna al sito
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
