import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import styles from './EditorialPage.module.css';

const IMG = '/images/territorio';

const TERRITORIO_JSON_LD = {
  '@type': 'WebPage',
  name: 'Il territorio — Capperificio Caro',
  description: 'Racale, nel basso Salento: muretti a secco, terra rossa, ulivi secolari e il mare Ionio a pochi chilometri. La terra dove nasce il cappero di Racale.',
};

const BAND = ['Racale', 'Basso Salento', 'Muretti a secco', 'Terra rossa', 'Ulivi secolari', 'Mare Ionio'];

const ELEMENTS = [
  {
    eyebrow: '01 — La pietra',
    title: 'Dove non cresce altro, cresce lui',
    desc: 'Il cappero ama la pietra calda. Mette radici nei muretti a secco che dividono i campi del Salento e lì resiste al sole d’agosto, senza chiedere acqua. Le piante più vecchie sono nei muri da sempre.',
    img: `${IMG}/territorio-muretto-secco.webp`,
    alt: 'Pianta di cappero che cresce tra le pietre di un muretto a secco',
  },
  {
    eyebrow: '02 — La terra',
    title: 'Terra rossa, tra gli ulivi',
    desc: 'I nostri campi sono macchie di terra rossa tra gli ulivi secolari. Suolo povero d’acqua e ricco di minerali: il bocciolo cresce piccolo, compatto, pieno di sapore.',
    img: `${IMG}/territorio-terra-rossa.webp`,
    alt: 'I campi di terra rossa tra gli ulivi visti dal drone',
  },
  {
    eyebrow: '03 — Il sole',
    title: 'Estati lunghe e secche',
    desc: 'Il caldo del Salento fa fiorire la pianta ogni giorno, per settimane. È per questo che il cappero si raccoglie a mano e spesso: un bocciolo dimenticato domani è già un fiore.',
    img: `${IMG}/territorio-fiore-cappero.webp`,
    alt: 'Fiore di cappero aperto con i boccioli accanto',
  },
  {
    eyebrow: '04 — Il mare',
    title: 'Lo Ionio, a pochi chilometri',
    desc: 'Il vento porta il profumo del mare fino ai campi. Pietra, terra rossa, sole e sale: il sapore di un cappero dipende da dove cresce, e il nostro viene da qui.',
    img: `${IMG}/territorio-ionio.webp`,
    alt: 'Vasetto di capperi di Racale sugli scogli davanti al mare',
  },
];

const RACALE = [
  { eyebrow: 'Le luminarie', text: 'D’estate il paese si accende per la festa di San Sebastiano. Le strade diventano archi di luce.', img: `${IMG}/territorio-luminarie.webp`, alt: 'Le luminarie della festa di San Sebastiano a Racale' },
  { eyebrow: 'I vicoli', text: 'Case basse, pietra chiara, corti. Il centro storico dove la famiglia vive da generazioni.', img: `${IMG}/territorio-vicolo.webp`, alt: 'Un vasetto di capperi in un vicolo del centro storico di Racale' },
  { eyebrow: 'La piazza', text: 'La fontana in piazza, punto d’incontro del paese. Il laboratorio è a pochi minuti.', img: `${IMG}/territorio-piazza.webp`, alt: 'Un vasetto di capperi davanti alla fontana della piazza di Racale' },
  { eyebrow: 'La campagna', text: 'Pajare, muretti e ulivi. Dal campo al laboratorio passano poche ore e pochi chilometri.', img: `${IMG}/territorio-pajara.webp`, alt: 'Un vasetto di capperi su una pietra, con una pajara sullo sfondo' },
];

const FAMILY = [
  {
    eyebrow: '05 — Le radici',
    title: 'Intorno a quel tavolo',
    desc: 'Negli anni Ottanta le donne di famiglia sceglievano i capperi uno a uno, in casa, intorno al tavolo della cucina. Il sapere è passato così: guardando, non leggendo.',
    img: `${IMG}/territorio-archivio-tavolo.webp`,
    alt: 'Foto d’archivio: la famiglia intorno a un tavolo coperto di capperi',
  },
  {
    eyebrow: '06 — Oggi',
    title: 'Stessa pianta, altre mani',
    desc: 'Oggi in campo ci siamo noi, la terza generazione, con chi ci ha insegnato. Stessi campi, stesse piante, stesso occhio per il bocciolo giusto.',
    img: `${IMG}/territorio-famiglia.webp`,
    alt: 'La famiglia oggi nel campo con il raccolto della giornata',
  },
  {
    eyebrow: '07 — Il sapere',
    title: 'Il momento giusto si impara a vista',
    desc: 'Nessun manuale insegna quando un bocciolo è pronto. Lo si impara in campo, accanto a chi lo fa da una vita.',
    img: `${IMG}/territorio-sapere.webp`,
    alt: 'Una donna della famiglia mostra i capperi raccolti nel palmo delle mani',
    imgPosition: 'center 62%',
  },
];

function Row({ row, flip }) {
  return (
    <section className={`${styles.row} ${flip ? styles.flip : ''}`}>
      <div className={styles.rowImage}>
        <img
          src={row.img}
          alt={row.alt}
          loading="lazy"
          decoding="async"
          style={row.imgPosition ? { objectPosition: row.imgPosition } : undefined}
        />
      </div>
      <div className={styles.rowCopy}>
        <span className={styles.eyebrow}>{row.eyebrow}</span>
        <h2 className={styles.rowTitle}>{row.title}</h2>
        <p className={styles.rowDesc}>{row.desc}</p>
      </div>
    </section>
  );
}

export default function TerritorioPage() {
  useSEO({
    title: 'Il territorio — Racale, tra la pietra e il mare',
    description: 'Racale, nel basso Salento: muretti a secco, terra rossa, ulivi secolari e il mare Ionio a pochi chilometri. Il territorio dove nasce il cappero del Capperificio Caro.',
    path: '/territorio',
    image: `${IMG}/territorio-racale-mare.webp`,
    jsonLd: TERRITORIO_JSON_LD,
  });

  const band = [...BAND, ...BAND, ...BAND];

  return (
    <div className={styles.page}>

      {/* ── APERTURA ── */}
      <section className={styles.row}>
        <div className={styles.rowCopy}>
          <span className={styles.eyebrow}>Il territorio</span>
          <h1 className={styles.heroTitle}>Tra la pietra e il mare</h1>
          <p className={styles.rowDesc}>
            Racale, nel basso Salento. Muretti a secco, terra rossa e ulivi secolari, con lo Ionio
            a pochi chilometri. Qui il cappero cresce da solo, e noi lo raccogliamo da tre generazioni.
          </p>
        </div>
        <div className={`${styles.rowImage} ${styles.heroImage}`}>
          <img src={`${IMG}/territorio-racale-mare.webp`} alt="I campi di Racale tra gli ulivi visti dall’alto, con il mare all’orizzonte" fetchpriority="high" decoding="async" />
        </div>
      </section>

      {/* ── FASCIA ── */}
      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {band.map((m, i) => (
            <span key={i}>{m}<span className={styles.marqueeSep}>✳</span></span>
          ))}
        </div>
      </div>

      {/* ── MANIFESTO ── */}
      <section className={styles.manifesto}>
        <span className={styles.kicker}>• Il cappero di Racale</span>
        <p className={styles.manifestoText}>
          Qui il cappero non si è piantato. È nato insieme al paese, nelle crepe dei muri e ai bordi
          dei campi. Non l’abbiamo addomesticato: ci siamo adattati noi ai suoi tempi.
        </p>
      </section>

      {/* ── GLI ELEMENTI ── */}
      {ELEMENTS.map((row, i) => <Row key={row.title} row={row} flip={i % 2 === 1} />)}

      {/* ── RACALE ── */}
      <section className={styles.lab} aria-labelledby="racale-heading">
        <div className={styles.labHead}>
          <span className={styles.kicker}>• Il nostro paese</span>
          <h2 id="racale-heading" className={styles.labTitle}>Racale</h2>
        </div>
        <div className={styles.labGrid}>
          {RACALE.map((c) => (
            <div key={c.eyebrow} className={styles.labCell}>
              <span className={styles.eyebrow}>{c.eyebrow}</span>
              <img src={c.img} alt={c.alt} loading="lazy" decoding="async" />
              <p className={styles.mono}>{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LA FAMIGLIA ── */}
      <div className={styles.after}>
        {FAMILY.map((row, i) => <Row key={row.title} row={row} flip={i % 2 === 1} />)}
      </div>

      {/* ── CTA ── */}
      <section className={styles.cta} aria-labelledby="cta-heading">
        <h2 id="cta-heading" className={styles.ctaTitle}>Il territorio, in un vasetto</h2>
        <p className={styles.ctaDesc}>Scopri come lavoriamo durante l’anno, o assaggia direttamente il risultato.</p>
        <div className={styles.ctaBtns}>
          <Link to="/collections/all" className={styles.ctaBtn}>Scopri i prodotti →</Link>
          <Link to="/processo-produttivo" className={`${styles.ctaBtn} ${styles.ctaBtnGhost}`}>Il processo produttivo</Link>
        </div>
      </section>

    </div>
  );
}
