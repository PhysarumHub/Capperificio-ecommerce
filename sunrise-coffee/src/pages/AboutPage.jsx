import { useEffect, useRef } from 'react';
import { useSEO } from '../hooks/useSEO';
import styles from './AboutPage.module.css';

const ABOUT_JSON_LD = {
  '@type': 'AboutPage',
  name: 'La nostra storia — Capperificio Caro',
  description: '3 generazioni, una sola pianta. Dal Salento, una storia familiare che profuma di terra, mani e memoria.',
};

const PANELS = [
  {
    img: '/images/Storia/nonnoquintino__compress_LgHdrR8LAdAlu0GnlAIVw.webp',
    alt: 'Nonno Quintino, il fondatore',
    eyebrow: '01 — Le origini',
    title: 'Tutto è nato da qui',
    desc: 'Da un amore sincero, tra un campo da coltivare e una vita da immaginare. I nonni hanno seminato senza sapere che stavano piantando molto più di una pianta.',
    bg: '#FCF3DF',
  },
  {
    img: '/images/Storia/20240723_capperificiocaro_lavorazione___-9549_(1)_compress_7hymx2JVxcq4Cx0v_FHR_.webp',
    alt: 'Lavorazione artigianale dei capperi',
    eyebrow: '02 — La continuità',
    title: 'Chi ha tenuto viva la rotta',
    desc: 'Hanno scelto di restare. Di custodire il sapere, stagione dopo stagione, dando continuità ai gesti e dignità alla terra.',
    bg: '#FCF3DF',
  },
  {
    img: '/images/Storia/20250606_capperificiocaro_patate___-3049_compress_1OZpzXEiespbAFz-OBhR3.webp',
    alt: 'Capperi freschi dalla raccolta',
    eyebrow: '03 — Il presente',
    title: 'Una storia che continua a germogliare',
    desc: 'Lo facciamo come ci hanno insegnato: con pazienza, con rispetto, con le mani nella terra. Seminiamo ogni giorno la nostra parte.',
    bg: '#FCF3DF',
    imgPosition: 'center top',
  },
  {
    img: '/images/Storia/20250606_capperificiocaro_patate___-2837_compress_1IU7jJg8NG9JojDD8jWFk.webp',
    alt: 'Coltivazione del cappero nel Salento',
    eyebrow: '04 — La visione',
    title: 'Mani nuove, stessa terra',
    desc: 'Coltiviamo una nuova visione. Una relazione con la terra fatta di equilibrio, ascolto, lentezza. Ma soprattutto, coltiviamo valori.',
    bg: '#FCF3DF',
  },
  {
    img: '/images/Storia/20250606_capperificiocaro_patate___-2869_compress_Q7EqlK5YmHo7lC6Y-yDrt.webp',
    alt: 'Cura del campo secondo la tradizione',
    eyebrow: '05 — La tradizione',
    title: 'Come una volta, ma con occhi nuovi',
    desc: 'Filiera corta, lavorazioni minime, racconti lenti. Perché la terra non ha bisogno di rumore. Solo di rispetto.',
    bg: '#FCF3DF',
  },
  {
    img: '/images/Storia/20250419_capperificiocaro_drone___--13_compress_GBJ_CH9CsovkfeUJNhnp5.webp',
    alt: 'Vista aerea dei campi di capperi di Racale',
    eyebrow: '06 — Il futuro',
    title: 'Tutto ciò che facciamo è un atto di restituzione',
    desc: "Perché crediamo in un\u2019agricoltura che cura, in un cibo che racconta, in una terra che va rispettata. E in un futuro che ha bisogno di radici.",
    bg: '#FCF3DF',
  },
];

export default function AboutPage() {
  useSEO({
    title: 'La nostra storia — Tre generazioni di terra e capperi',
    description: 'Dal Salento, una storia familiare che profuma di terra, mani e memoria. Tre generazioni che coltivano capperi e valori con lentezza e rispetto.',
    path: '/storia',
    jsonLd: ABOUT_JSON_LD,
  });

  const containerRef = useRef(null);

  // Mobile: apply scroll-snap on <html> only while this page is mounted
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;
    const html = document.documentElement;
    html.style.scrollSnapType = 'y mandatory';
    html.style.overflowY = 'scroll';
    return () => {
      html.style.scrollSnapType = '';
      html.style.overflowY = '';
    };
  }, []);

  useEffect(() => {
    let ctx;
    let ScrollTrigger;
    let gsap;

    import('gsap').then(({ gsap: g }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger: ST }) => {
        gsap = g;
        ScrollTrigger = ST;
        gsap.registerPlugin(ScrollTrigger);

        const panels = containerRef.current.querySelectorAll('[data-panel]');

        // Each panel's text content fades in when the panel becomes active
        panels.forEach((panel, i) => {
          const content = panel.querySelector('[data-panel-content]');

          gsap.fromTo(
            content,
            { y: 48, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: panel,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            }
          );
        });

        ctx = ScrollTrigger;
      });
    });

    return () => {
      if (ctx) ctx.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className={styles.page}>

      {/* ── STICKY PANELS ── */}
      <div className={styles.stickyStack} ref={containerRef}>
        {PANELS.map((panel, i) => (
          <div
            key={i}
            className={styles.stickyPanel}
            data-panel
            style={{ '--panel-bg': panel.bg, '--panel-z': i + 1 }}
          >
            <div className={styles.panelImage}>
              <img
                src={panel.img}
                alt={panel.alt}
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
                style={panel.imgPosition ? { objectPosition: panel.imgPosition } : undefined}
              />
            </div>
            <div className={styles.panelCopy} data-panel-content>
              <span className={styles.panelEyebrow}>{panel.eyebrow}</span>
              <h2 className={styles.panelTitle}>{panel.title}</h2>
              <p className={styles.panelDesc}>{panel.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA SECTION ── */}
      <section className={styles.ctaSection} aria-labelledby="cta-heading">
        <div className={styles.ctaInner}>
          <h2 id="cta-heading" className={styles.ctaTitle}>Cammina con noi</h2>
          <p className={styles.ctaDesc}>
            Ogni pianta ha bisogno di chi la guarda crescere.<br />
            Segui il nostro percorso per vedere crescere la nostra realtà.
          </p>
          <a href="/" className={styles.ctaBtn}>
            Scopri i prodotti
          </a>
        </div>
      </section>

    </div>
  );
}
