import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import styles from './ProcessoPage.module.css';

const IMG = '/images/processo';

const PROCESSO_JSON_LD = {
  '@type': 'WebPage',
  name: 'Processo produttivo — Capperificio Caro',
  description: 'Un anno intorno a una pianta: dalla potatura di gennaio alla raccolta a mano di maggio e giugno, fino alla salatura e al vasetto. I capperi di Racale, mese per mese.',
};

const MONTHS = [
  'Gennaio — potatura', 'Febbraio — la terra', 'Aprile — il risveglio',
  'Maggio e giugno — la raccolta', 'Estate — il sale', 'Autunno — il vasetto',
];

/* Nel campo: righe 50/50 come la pagina Storia, immagine e testo alternati. */
const FIELD = [
  {
    eyebrow: '01 — Gennaio',
    title: 'La potatura',
    desc: 'A pianta ferma si tagliano i rami dell’anno prima, vicino al ceppo. Il cappero fiorisce sui rami nuovi: più la potatura d’inverno è fatta bene, più boccioli arriveranno in primavera.',
    img: `${IMG}/processo-cespuglio-muretto.webp`,
    alt: 'Un cespuglio di cappero sul muretto a secco',
  },
  {
    eyebrow: '02 — Gennaio · Febbraio',
    title: 'La prima lavorazione',
    desc: 'Si lavora la terra rossa tra le piante: si smuove il suolo, si tolgono le erbe, si prepara il campo a trattenere le piogge d’inverno. Lavori lenti, che nessuno vede ma che si sentono nel sapore.',
    img: `${IMG}/processo-lavorazione-terreno.webp`,
    alt: 'La motozappa lavora la terra rossa del campo',
  },
  {
    eyebrow: '03 — Aprile · Maggio',
    title: 'Il risveglio',
    desc: 'Con il caldo la pianta riparte. Spuntano i rami nuovi e, accanto a ogni foglia, i primi boccioli. Il cappero è proprio questo: un bocciolo da cogliere il giorno prima che diventi fiore.',
    img: `${IMG}/processo-boccioli.webp`,
    alt: 'Boccioli di cappero chiusi accanto a un fiore appena aperto',
  },
  {
    eyebrow: '04 — Maggio · Giugno',
    title: 'La raccolta, a mano',
    desc: 'Si passa e si ripassa sulle stesse piante, nelle ore fresche, cogliendo solo i boccioli chiusi e sodi. Le mani, un secchio, molta pazienza. A fine giornata il raccolto parte per il laboratorio.',
    img: `${IMG}/processo-raccolta.webp`,
    alt: 'Raccolta dei capperi a mano, con i guanti, nel secchio',
  },
];

/* In laboratorio: colonne con divisori, testo mono come "Dal campo alla tavola" in Home. */
const LAB = [
  { eyebrow: '05 — Pesatura', text: 'Il raccolto arriva a Racale poche ore dopo. Si pesa e si annota da quale campo viene.', img: `${IMG}/processo-pesatura.webp`, alt: 'Pesatura del raccolto in laboratorio' },
  { eyebrow: '06 — Cernita', text: 'Sui setacci, a mano, via foglie, steli e boccioli già aperti. Il passaggio più lento.', img: `${IMG}/processo-cernita.webp`, alt: 'Mani con i guanti selezionano i capperi sul setaccio' },
  { eyebrow: '07 — Calibratura', text: 'Il tamburo forato divide per diametro: Lilliput, Occhio di Pernice, Lacrimella, Capperone.', img: `${IMG}/processo-calibratura.webp`, alt: 'La calibratrice a tamburo divide i capperi per dimensione' },
  { eyebrow: '08 — Salatura', text: 'Capperi e sale marino, a strati. Si girano, si lasciano riposare, si rigirano.', img: `${IMG}/processo-salatura.webp`, alt: 'Sale marino versato sui capperi freschi' },
];

const AFTER = [
  {
    eyebrow: '09 — Estate',
    title: 'Il tempo del sale',
    desc: 'Il sale toglie piano l’acqua e l’amaro. Il verde si scurisce, il profumo si fa pieno. Non c’è un giorno fisso: il cappero è pronto quando è pronto.',
    img: `${IMG}/processo-maturazione.webp`,
    alt: 'Capperi maturati sotto sale con un cucchiaio di legno',
  },
  {
    eyebrow: '10 — Autunno',
    title: 'Nel vasetto',
    desc: 'Si invasa a mano, calibro per calibro, con il suo sale. Dal campo alla dispensa il cappero non lascia mai Racale.',
    img: `${IMG}/processo-vasetto.webp`,
    alt: 'Vasetto di capperi di Racale appoggiato sui capperi freschi',
  },
  {
    eyebrow: '11 — Dicembre',
    title: 'La pianta riposa',
    desc: 'Nel campo la pianta perde le foglie e si ferma. A gennaio si ricomincia, con la potatura, sulle stesse piante. Come fanno tre generazioni.',
    img: `${IMG}/processo-squadra.webp`,
    alt: 'La squadra del Capperificio in camice verde nel laboratorio',
  },
];

function Row({ row, flip, first }) {
  return (
    <section className={`${styles.row} ${flip ? styles.flip : ''}`}>
      <div className={styles.rowImage}>
        <img src={row.img} alt={row.alt} loading={first ? 'eager' : 'lazy'} decoding="async" />
      </div>
      <div className={styles.rowCopy}>
        <span className={styles.eyebrow}>{row.eyebrow}</span>
        <h2 className={styles.rowTitle}>{row.title}</h2>
        <p className={styles.rowDesc}>{row.desc}</p>
      </div>
    </section>
  );
}

export default function ProcessoPage() {
  useSEO({
    title: 'Processo produttivo — Un anno intorno al cappero di Racale',
    description: 'Dalla potatura di gennaio alla raccolta a mano di maggio e giugno, fino alla salatura con sale marino e al vasetto. Come nascono i capperi del Capperificio Caro.',
    path: '/processo-produttivo',
    image: `${IMG}/processo-campi-racale.webp`,
    jsonLd: PROCESSO_JSON_LD,
  });

  const marquee = [...MONTHS, ...MONTHS, ...MONTHS];

  return (
    <div className={styles.page}>

      {/* ── APERTURA ── */}
      <section className={styles.row}>
        <div className={styles.rowCopy}>
          <span className={styles.eyebrow}>Processo produttivo</span>
          <h1 className={styles.heroTitle}>Un anno intorno a una pianta</h1>
          <p className={styles.rowDesc}>
            Dalla potatura di gennaio alla raccolta di maggio e giugno, fino al vasetto.
            Dodici mesi di lavoro, quasi tutti a mano, per un cappero che arriva sulla tua tavola.
          </p>
        </div>
        <div className={`${styles.rowImage} ${styles.heroImage}`}>
          <img src={`${IMG}/processo-campi-racale.webp`} alt="I campi del Capperificio a Racale visti dall’alto, con il mare sullo sfondo" fetchpriority="high" decoding="async" />
        </div>
      </section>

      {/* ── FASCIA MESI ── */}
      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {marquee.map((m, i) => (
            <span key={i}>{m}<span className={styles.marqueeSep}>✳</span></span>
          ))}
        </div>
      </div>

      {/* ── MANIFESTO ── */}
      <section className={styles.manifesto}>
        <span className={styles.kicker}>• Prima della raccolta</span>
        <p className={styles.manifestoText}>
          La raccolta è l’ultima cosa che si fa, non la prima. Prima ci sono mesi di campo:
          potare, lavorare la terra, aspettare che la pianta si risvegli.
        </p>
      </section>

      {/* ── NEL CAMPO ── */}
      {FIELD.map((row, i) => <Row key={row.title} row={row} flip={i % 2 === 1} first={i === 0} />)}

      {/* ── IN LABORATORIO ── */}
      <section className={styles.lab} aria-labelledby="lab-heading">
        <div className={styles.labHead}>
          <span className={styles.kicker}>• Lo stesso giorno, in laboratorio</span>
          <h2 id="lab-heading" className={styles.labTitle}>Dal sacco al sale</h2>
        </div>
        <div className={styles.labGrid}>
          {LAB.map((c) => (
            <div key={c.eyebrow} className={styles.labCell}>
              <span className={styles.eyebrow}>{c.eyebrow}</span>
              <img src={c.img} alt={c.alt} loading="lazy" decoding="async" />
              <p className={styles.mono}>{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DOPO ── */}
      <div className={styles.after}>
        {AFTER.map((row, i) => <Row key={row.title} row={row} flip={i % 2 === 0} />)}
      </div>

      {/* ── CTA ── */}
      <section className={styles.cta} aria-labelledby="cta-heading">
        <h2 id="cta-heading" className={styles.ctaTitle}>Assaggia un anno di lavoro</h2>
        <p className={styles.ctaDesc}>Lilliput, Occhio di Pernice, Lacrimella e Capperone: ogni calibro ha il suo carattere.</p>
        <Link to="/collections/all" className={styles.ctaBtn}>Scopri i prodotti →</Link>
      </section>

    </div>
  );
}
