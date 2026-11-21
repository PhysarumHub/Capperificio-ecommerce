import { Link } from 'react-router-dom';
import {
  BOXES, PRODUCT_BY_ID, TOKENS_TOTAL, ORDER_DEADLINE, EGIFT_ENABLED,
} from '../../data/natalBox';
import { Coins } from './BoxItemCard';
import ui from './xmasUi.module.css';
import styles from './NatalLanding.module.css';

/* Apertura di /box-di-natale: racconto, le box, come funzionano i gettoni
   e i servizi per chi regala. */

const eur = (n) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export default function NatalLanding({ onTokens, onRacale }) {
  const sampleJars = ['sale-lilliput', 'sale-occhio', 'powder'];

  return (
    <div className={styles.landing}>
      <p className={styles.deadline}>
        <span><strong>Natale da Racale</strong> · ordina entro il <strong>{ORDER_DEADLINE.label}</strong> per riceverla prima della Vigilia</span>
      </p>

      {/* ── apertura ── */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={ui.kicker}>Natale · Racale, Salento</p>
          <h1 className={styles.heroTitle}>Il Salento,<br /><em>chiuso</em> in una scatola.</h1>
          <p className={styles.heroLead}>
            Capperi raccolti a mano a Racale, olio e vino del territorio, il forno di Pane è Fantasie e i legumi
            di Terra Nera. La componi tu, noi la chiudiamo con il nastro e la spediamo a chi vuoi tu.
          </p>
          <div className={styles.heroCtas}>
            <button type="button" className={ui.btnPrimary} onClick={onTokens}>Componi la tua cassetta <span aria-hidden="true">→</span></button>
            <button type="button" className={ui.btnOutline} onClick={onRacale}>Box pronta da regalare</button>
          </div>
          <ul className={styles.heroTrust}>
            <li>Preparata a mano a Racale</li>
            <li>Biglietto scritto a mano</li>
            <li>Spedita direttamente a chi la riceve</li>
          </ul>
        </div>

        <div className={styles.heroArt}>
          <div className={styles.heroKraft}>
            <img
              src="/images/box-natale/box-poster-cassetta.webp"
              alt="La Cassetta in Legno piena: vasetti di capperi, olio, vino e sacchetti di forno e legumi, chiusa con il nastro rosso"
              width="1200" height="900" fetchPriority="high" decoding="async"
            />
          </div>
          <figure className={styles.heroNote} aria-label="Esempio di biglietto">
            <span className={styles.noteLabel}>Biglietto</span>
            <p className={styles.noteText}>Per Giulia, un po’ di Salento sotto l’albero. Buon Natale!</p>
            <p className={styles.noteSign}>— Marco</p>
          </figure>
          <span className={styles.heroSeal} aria-hidden="true">
            <span className={styles.sealNum}>{TOKENS_TOTAL}</span>
            <span className={styles.sealLbl}>gettoni</span>
          </span>
        </div>
      </section>

      {/* ── le tre box ── */}
      <section className={styles.band}>
        <div className={styles.wrap}>
          <div className={styles.bandHead}>
            <h2 className={styles.h2}>Due box, <em>un regalo da Racale</em></h2>
            <p className={styles.bandLead}>Tutte arrivano con il biglietto scritto a mano e senza prezzi nel pacco.</p>
          </div>

          <div className={styles.cards}>
            <article className={`${styles.card} ${styles.cardDark}`}>
              <span className={styles.cardKicker}>La più scelta · {BOXES.tokens.kicker.toLowerCase()}</span>
              <h3 className={styles.cardName}>{BOXES.tokens.name}</h3>
              <p className={styles.cardLead}>{BOXES.tokens.lead}</p>
              <Coins n={TOKENS_TOTAL} className={styles.cardCoins} />
              <p className={styles.cardSmall}>Almeno 3 vasetti del Capperificio, il resto lo scegli tu</p>
              <div className={styles.cardFoot}>
                <span className={styles.cardPrice}>{eur(BOXES.tokens.price)}</span>
                <button type="button" className={ui.btnLight} onClick={onTokens}>Componi <span aria-hidden="true">→</span></button>
              </div>
            </article>

            <article className={styles.card}>
              <span className={styles.cardKicker}>{BOXES.racale.kicker}</span>
              <h3 className={styles.cardName}>{BOXES.racale.name}</h3>
              <p className={styles.cardLead}>{BOXES.racale.lead}</p>
              <div className={styles.cardJars}>
                {sampleJars.map((id) => (
                  <img key={id} src={PRODUCT_BY_ID[id].image} alt={PRODUCT_BY_ID[id].name} width="600" height="720" loading="lazy" decoding="async" />
                ))}
              </div>
              <p className={styles.cardSmall}>Olio EVO BIO 500 ml · vino 1 L rosso, rosato o bianco · 3 vasetti a scelta</p>
              <div className={styles.cardFoot}>
                <span className={styles.cardPrice}>{eur(BOXES.racale.price)}</span>
                <button type="button" className={ui.btnOutline} onClick={onRacale}>Scegli i vasetti</button>
              </div>
            </article>

            <article className={`${styles.card} ${styles.cardKraft}`} id="regala-i-gettoni">
              <span className={styles.cardKicker}>Anche all’ultimo minuto</span>
              <h3 className={styles.cardName}>Regala i gettoni</h3>
              <p className={styles.cardLead}>Tu paghi, chi la riceve sceglie cosa metterci. Arriva per email con il tuo messaggio, anche la mattina di Natale.</p>
              <div className={styles.egift}>
                <Coins n={3} />
                <p>«Marco ti ha regalato <strong>{TOKENS_TOTAL} gettoni</strong> del Capperificio Caro»</p>
              </div>
              <div className={styles.cardFoot}>
                {EGIFT_ENABLED ? (
                  <>
                    <span className={styles.cardPrice}>{eur(BOXES.tokens.price)}</span>
                    <button type="button" className={ui.btnPrimary}>Regala</button>
                  </>
                ) : (
                  <>
                    <span className={styles.soon}>In arrivo</span>
                    <Link to="/contatti" className={ui.btnOutline}>Scrivici</Link>
                  </>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── come funziona ── */}
      <section className={`${styles.wrap} ${styles.how}`}>
        <div className={styles.howIntro}>
          <p className={ui.kicker}>Come funziona</p>
          <h2 className={styles.h2}>Undici gettoni,<br /><em>tre scelte</em></h2>
          <p className={styles.bandLead}>Ogni prodotto vale un gettone, l’olio due. Quando li hai spesi tutti, la cassetta è piena e la chiudiamo noi.</p>
        </div>
        <ol className={styles.howSteps}>
          <li>
            <span className={styles.howNum}>1</span>
            <h3>Almeno tre vasetti</h3>
            <p>Capperi al sale o all’aceto, cucunci, germogli, polvere e foglie.</p>
            <p className={styles.howCost}><Coins n={1} /> 1 l’uno</p>
          </li>
          <li>
            <span className={styles.howNum}>2</span>
            <h3>Olio e vino</h3>
            <p>Olio EVO biologico di OP ACLI Racale e vino da un litro della Cantina Torre Ospina: rosso, rosato o bianco.</p>
            <p className={styles.howCost}><Coins n={1} /> 1 vino · <Coins n={2} /> 2 olio</p>
          </li>
          <li>
            <span className={styles.howNum}>3</span>
            <h3>Forno e legumi</h3>
            <p>Purciddhuzzi, mustazzere, cantucci, tarallini e friselle di Pane è Fantasie. Pisello nano, lenticchie e cicerchia di Terra Nera.</p>
            <p className={styles.howCost}><Coins n={1} /> 1 l’uno</p>
          </li>
        </ol>
      </section>

      {/* ── per chi regala ── */}
      <section className={`${styles.wrap} ${styles.perks}`}>
        <h2 className={styles.h2}>Pensata per <em>chi regala</em></h2>
        <div className={styles.perkGrid}>
          <div>
            <h3>Spedita a chi la riceve</h3>
            <p>Inserisci il suo indirizzo: la consegniamo direttamente, tu ricevi il tracking.</p>
          </div>
          <div>
            <h3>Biglietto scritto a mano</h3>
            <p>Scrivi il messaggio, lo ricopiamo a penna sul nostro cartoncino.</p>
          </div>
          <div>
            <h3>Nessun prezzo nel pacco</h3>
            <p>Ricevuta e fattura arrivano solo a te, per email.</p>
          </div>
          <div>
            <h3>Regali aziendali</h3>
            <p>Da 10 box in su: destinatari da file, biglietto con il vostro logo. <Link to="/b2b">Chiedi un preventivo</Link></p>
          </div>
        </div>
      </section>
    </div>
  );
}
