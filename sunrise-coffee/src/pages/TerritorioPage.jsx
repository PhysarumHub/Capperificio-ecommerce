import { useSEO } from '../hooks/useSEO';
import AnimateIn from '../components/AnimateIn';
import styles from './TerritorioPage.module.css';

const TERRITORIO_JSON_LD = {
  '@type': 'WebPage',
  name: 'Il Nostro Territorio — Capperificio Caro',
  description: 'Il Salento, la terra del cappero. Un microclima unico, una tradizione centenaria.',
};

export default function TerritorioPage() {
  useSEO({
    title: 'Il Nostro Territorio',
    description: 'Il Salento, la terra del cappero. Un microclima unico fatto di sole, vento e pietra leccese che regala ai nostri capperi un sapore inconfondibile.',
    path: '/territorio',
    jsonLd: TERRITORIO_JSON_LD,
  });

  return (
    <main className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <img
          src="/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp"
          alt="Territorio Salento"
          className={styles.heroImg}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <AnimateIn animation="fadeUp">
            <p className={styles.eyebrow}>Il nostro territorio</p>
            <h1 className={styles.title}>Il Salento,<br />la terra del cappero</h1>
          </AnimateIn>
        </div>
      </section>

      {/* Corpo */}
      <section className={styles.body}>
        <AnimateIn animation="fadeUp">
          <div className={styles.intro}>
            <p>
              Racale, nel cuore del Salento. Una terra baciata dal sole per oltre trecento giorni l'anno,
              accarezzata dal vento che arriva dal mare, costruita su una pietra calcarea che trattiene
              il calore e lo rilascia lentamente alle radici delle piante.
            </p>
            <p>
              È in questo contesto unico che il cappero trova la sua casa ideale. La Capparis Spinosa
              cresce spontanea tra i muretti a secco, nelle crepe dei trulli e lungo le strade bianche.
              Ma è quando viene coltivata con cura — come facciamo noi da tre generazioni — che
              esprime il suo meglio.
            </p>
          </div>
        </AnimateIn>

        <AnimateIn animation="fadeUp" delay={80}>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>☀️</span>
              <h3>300+ giorni di sole</h3>
              <p>Il Salento è una delle zone più soleggiate d'Italia. Il sole è l'ingrediente segreto che concentra gli aromi nei nostri capperi.</p>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🌊</span>
              <h3>Brezza marina</h3>
              <p>Il vento salato che arriva dallo Ionio e dall'Adriatico dona ai capperi note minerali inconfondibili.</p>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🪨</span>
              <h3>Pietra leccese</h3>
              <p>Il suolo calcareo drena l'acqua in eccesso e accumula calore, creando le condizioni perfette per la pianta del cappero.</p>
            </div>
          </div>
        </AnimateIn>
      </section>
    </main>
  );
}
