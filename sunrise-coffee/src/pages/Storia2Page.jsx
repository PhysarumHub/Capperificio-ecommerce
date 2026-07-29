import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useSEO } from '../hooks/useSEO';
import styles from './Storia2Page.module.css';

/* ─────────────────────────────────────────────────────────────
   Asset (già online) — porting 1:1 dalla landing Webflow
   ───────────────────────────────────────────────────────────── */
const IMG = 'https://moussamamadou.github.io/images/';
const VID = 'https://moussamamadou.github.io/videos/';

const HERO_IMG = `${IMG}pexels-cottonbro-8718352-1_11zon_11zon_11zon.jpg`;
const FOOTER_IMG = `${IMG}pexels-cottonbro-8718345_11zon_11zon.jpg`;

// costruisce le sorgenti a partire dalla "base" del file
const vid = (base) => ({
  mp4: `${VID}${base}-transcode.mp4`,
  webm: `${VID}${base}-transcode.webm`,
  poster: `${VID}${base}-poster-00001.jpg`,
});

const ITEMS = [
  {
    image: `${IMG}pexels-cottonbro-9430460_11zon.jpg`,
    color: styles['color-1'],
    title: ['NATURE', 'SOUL'],
    videos: [
      vid('9430543-uhd_4096_2160_25fps'),
      vid('9430549-uhd_4096_2160_25fps'),
      vid('9430538-uhd_4096_2160_25fps-1'),
    ],
    subtitles: ['Rock and Tree', 'Air and Sea', 'Land and Life', 'Leaf and Root', 'Sand and Sea'],
  },
  {
    image: `${IMG}pexels-cottonbro-9421335_11zon.jpg`,
    color: styles['color-2'],
    title: ['TOUCH', 'CHARM'],
    videos: [
      vid('9421504-uhd_4096_2160_25fps'),
      vid('9421502-uhd_4096_2160_25fps'),
      vid('9421500-uhd_4096_2160_25fps'),
    ],
    subtitles: ['Touch and Heal', 'Kind and True', 'Hand and Heart', 'Care and Light', 'Joy and Peace'],
  },
  {
    image: `${IMG}pexels-cottonbro-9489270_11zon.jpg`,
    color: styles['color-3'],
    title: ['Books', 'INK'],
    videos: [
      vid('9489597-uhd_4096_2160_25fps'),
      vid('9489600-uhd_4096_2160_25fps'),
      vid('9489599-uhd_4096_2160_25fps'),
    ],
    subtitles: ['Book and Life', 'Ink and Page', 'Read and Rise', 'Verse and Voice', 'Page and Mind'],
  },
];

/* piccolo helper JSX per una riga mascherata (title/subtitle) */
function Line({ children, className }) {
  return (
    <div className={styles['line-wrapper']}>
      <div className={`${styles.line} ${className || ''}`} data-line>
        {children}
      </div>
    </div>
  );
}

export default function Storia2Page() {
  useSEO({
    title: 'Storia',
    description: 'Just scroll it — un racconto animato allo scroll.',
    path: '/storia2',
  });

  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // 1. Lenis smooth scroll
    const lenis = new Lenis({ autoRaf: true, wheelMultiplier: 0.7 });

    // 2. GSAP + ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);

    // 3. selezione scoped alla root (CSS Modules → solo data-*)
    const workSection = root.querySelector('[data-work="section"]');
    const workItems = root.querySelectorAll('[data-work="item"]');

    // 4. GHOST container: gli item sono position:fixed, i ghost creano lo scroll
    const ghostContainer = document.createElement('div');
    ghostContainer.setAttribute('data-work', 'ghost-container');
    workSection.appendChild(ghostContainer);

    const ghostItems = [];
    workItems.forEach(() => {
      const g = document.createElement('div');
      g.style.width = '100%';
      g.style.height = '300vh';
      ghostContainer.appendChild(g);
      ghostItems.push(g);
    });

    const ctx = gsap.context(() => {
      workItems.forEach((item, index) => {
        // 5. set iniziale
        gsap.set(item, { position: 'fixed', top: 0, clipPath: 'inset(100% 0 0% 0)' });

        const lines = item.querySelectorAll('[data-line]');
        const img = item.querySelector('[data-work="image"]');
        const videos = item.querySelectorAll('[data-work="video"]');
        const overlay = item.querySelectorAll('[data-work="item-overlay"]');
        const ghost = ghostItems[index];

        gsap.set(img, { scale: 1.4, yPercent: 10 });

        // Reveal
        const stReveal = { trigger: ghost, scrub: true, start: 'top bottom', end: 'top top' };
        gsap.to(item, { clipPath: 'inset(0% 0 0% 0)', ease: 'none', scrollTrigger: stReveal });
        gsap.to(img, { yPercent: 10, scale: 1.2, ease: 'none', scrollTrigger: stReveal });

        // Testo (title + subtitle lines)
        gsap.from(lines, {
          yPercent: 125,
          rotate: 2.5,
          ease: 'power2.inOut',
          duration: 1.25,
          stagger: 0.05,
          scrollTrigger: {
            trigger: ghost,
            start: 'top center',
            toggleActions: 'play reverse restart reverse',
          },
        });

        // Blur immagine di sfondo
        gsap.to(img, {
          filter: 'blur(10px)',
          opacity: 0.3,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: ghost, scrub: true, start: 'top top', end: '35% top' },
        });

        // Video slide-in (alternato)
        gsap.from(videos, {
          x: index % 2 === 0 ? '100vw' : '-100vw',
          ease: 'none',
          scrollTrigger: {
            trigger: ghost,
            scrub: true,
            start: 'top top',
            end: '65% top',
            onLeave: () => gsap.set(overlay, { display: 'flex', opacity: 0 }),
          },
        });

        // Final: overlay + push away
        const stFinal = {
          trigger: ghost,
          start: '80% bottom',
          toggleActions: 'play reverse play reverse',
        };
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, display: 'flex', scrollTrigger: stFinal });
        gsap.to(videos, { yPercent: 15, scrollTrigger: stFinal });
        gsap.to(item, { filter: 'blur(1px)', scale: 1.05, scrollTrigger: stFinal });
      });
    }, root);

    // 7. refresh
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      ctx.revert();
      lenis.destroy();
      ghostContainer.remove();
    };
  }, []);

  return (
    <main ref={containerRef} className={styles.page}>
      {/* 1. NAV */}
      <nav className={styles.nav}>
        <a className={styles['nav-link']} href="/">MOUSSA</a>
        <a className={styles['nav-link']} href="#contact">CONTACT</a>
        <div className={styles['nav-line']} />
      </nav>

      {/* 2. HERO */}
      <section className={styles.hero_section}>
        <img className={styles['hero_bg-image']} src={HERO_IMG} alt="" />
        <h1 className={styles.hero_text}>
          Just<br />
          <span className={styles['color-0']}>scroll </span>it.
        </h1>
      </section>

      {/* 3. WORK SECTION */}
      <section className={styles.work_section} data-work="section">
        {ITEMS.map((item, i) => (
          <div className={styles.work_item} data-work="item" key={i}>
            {/* img di sfondo */}
            <img className={styles['work_bg-image']} src={item.image} alt="" data-work="image" />

            {/* wrapper video */}
            <div className={styles['work_item-wrapper']}>
              {item.videos.map((v, j) => (
                <div className={styles['work_video-wrapper']} data-work="video" key={j}>
                  <div className={styles['work_video-container']}>
                    <div className={styles['work_video']}>
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster={v.poster}
                      >
                        <source src={v.webm} type="video/webm" />
                        <source src={v.mp4} type="video/mp4" />
                      </video>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* testo */}
            <div className={styles.work_text}>
              <h2 className={styles['work_text-title']}>
                <Line>{item.title[0]}</Line>
                <Line className={item.color}>{item.title[1]}</Line>
              </h2>
              <div className={styles['work-text-subtitle']}>
                {item.subtitles.map((s, k) => (
                  <Line key={k}>{s}</Line>
                ))}
              </div>
            </div>

            {/* overlay nero */}
            <div className={styles['work_item-overlay']} data-work="item-overlay" />
          </div>
        ))}
      </section>

      {/* 4. FOOTER */}
      <section className={styles.footer_section}>
        <img className={styles['footer_bg-image']} src={FOOTER_IMG} alt="" />
        <h2 className={styles.footer_text}>
          YOU<br />
          <span className={styles['color-0']}>scrollED </span>it.
        </h2>
      </section>
    </main>
  );
}
