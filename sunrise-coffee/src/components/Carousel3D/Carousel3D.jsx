import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';

import { useSEO } from '../../hooks/useSEO';
import { scenes } from '../../lib/carousel3d/data';
import styles from './Carousel3D.module.css';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

const PROCESSO_JSON_LD = {
  '@type': 'WebPage',
  name: 'Processo Produttivo — Capperificio Caro',
  description: 'Dalla raccolta a mano alla salatura artigianale: il processo produttivo dei capperi di Racale.',
};

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
  useSEO({
    title: 'Processo Produttivo',
    description: 'Dalla raccolta a mano alla salatura artigianale: scopri come nascono i capperi del Capperificio Caro di Racale.',
    path: '/territorio',
    jsonLd: PROCESSO_JSON_LD,
  });

  const [isLoading, setIsLoading] = useState(true);

  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const titleRefs = useRef([]);
  const descRefs = useRef([]);
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

      // Title types in char by char, then the description picks up right at
      // its tail — one continuous timeline/ScrollTrigger, not two clocks
      // racing each other (that's what read as "unsynced").
      const CHAR_DURATION = 0.02;
      const CHAR_STAGGER = 0.04;

      titleRefs.current.forEach((span, i) => {
        if (!span) return;

        const descEl = descRefs.current[i];
        const split = SplitText.create(span, { type: 'chars', charsClass: styles.char });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: carouselRefs.current[i]?.closest(`.${styles.scene}`),
            start: 'top center',
            toggleActions: 'play none none reverse',
          },
        });

        tl.fromTo(
          split.chars,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: CHAR_DURATION, ease: 'none', stagger: { each: CHAR_STAGGER, from: 'start' } },
          0
        );

        if (descEl) {
          const titleRevealEnd = (split.chars.length - 1) * CHAR_STAGGER + CHAR_DURATION;
          tl.fromTo(
            descEl,
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' },
            Math.max(titleRevealEnd - 0.15, 0)
          );
        }
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

              {scene.description && (
                <p
                  className={styles.sceneDesc}
                  ref={(el) => {
                    descRefs.current[i] = el;
                  }}
                >
                  {scene.description}
                </p>
              )}

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
        </div>
      </div>
    </div>
  );
}
