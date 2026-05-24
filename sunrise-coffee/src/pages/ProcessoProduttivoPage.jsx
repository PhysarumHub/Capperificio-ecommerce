import { useSEO } from '../hooks/useSEO';
import AnimateIn from '../components/AnimateIn';
import styles from './ProcessoProduttivoPage.module.css';

const PROCESSO_JSON_LD = {
  '@type': 'WebPage',
  name: 'Processo Produttivo — Capperificio Caro',
  description: 'Dalla raccolta a mano alla salatura artigianale: il processo produttivo dei capperi di Racale.',
};

const STEPS = [
  {
    num: '01',
    title: 'Raccolta a mano',
    desc: 'Ogni cappero viene raccolto individualmente al mattino presto, quando il bocciolo è ancora chiuso al punto giusto. Non esistono macchine che possano fare questo lavoro: serve occhio, esperienza e pazienza.',
    img: '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp',
  },
  {
    num: '02',
    title: 'Selezione e calibratura',
    desc: 'Dopo la raccolta i capperi vengono selezionati per dimensione. Ogni calibro ha le sue caratteristiche: i più piccoli sono più pregiati e profumati, i più grandi hanno una polpa più consistente.',
    img: '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp',
  },
  {
    num: '03',
    title: 'Salatura artigianale',
    desc: 'Il metodo tradizionale prevede la salatura a secco con sale marino grosso. I capperi vengono alternati con strati di sale e lasciati riposare per settimane, durante le quali perdono l\'amarezza e sviluppano il loro aroma caratteristico.',
    img: '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp',
  },
  {
    num: '04',
    title: 'Confezionamento',
    desc: 'Solo quando il processo è completo i capperi vengono confezionati a mano. Ogni vasetto è un pezzo unico, pensato per portare sulla tua tavola tutto il sapore del Salento.',
    img: '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp',
  },
];

export default function ProcessoProduttivoPage() {
  useSEO({
    title: 'Processo Produttivo',
    description: 'Dalla raccolta a mano alla salatura artigianale: scopri come nascono i capperi del Capperificio Caro di Racale.',
    path: '/processo-produttivo',
    jsonLd: PROCESSO_JSON_LD,
  });

  return (
    <main className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <img
          src="/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp"
          alt="Processo produttivo capperi"
          className={styles.heroImg}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <AnimateIn animation="fadeUp">
            <p className={styles.eyebrow}>Dal campo alla tavola</p>
            <h1 className={styles.title}>Il Processo<br />Produttivo</h1>
          </AnimateIn>
        </div>
      </section>

      {/* Intro */}
      <section className={styles.intro}>
        <AnimateIn animation="fadeUp">
          <p>
            Non esistono scorciatoie quando si parla di qualità artigianale. Ogni fase del nostro processo
            produttivo è pensata per preservare le caratteristiche naturali del cappero e tradurle in
            un prodotto autentico, che sa di Salento.
          </p>
        </AnimateIn>
      </section>

      {/* Steps */}
      <section className={styles.steps}>
        {STEPS.map((step, i) => (
          <AnimateIn animation="fadeUp" delay={i * 60} key={step.num}>
            <div className={`${styles.step} ${i % 2 === 1 ? styles.stepReverse : ''}`}>
              <div className={styles.stepImg}>
                <img src={step.img} alt={step.title} />
              </div>
              <div className={styles.stepContent}>
                <span className={styles.stepNum}>{step.num}</span>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            </div>
          </AnimateIn>
        ))}
      </section>
    </main>
  );
}
