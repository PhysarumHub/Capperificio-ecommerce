import { Link } from 'react-router-dom';
import {
  BOXES, PRODUCT_BY_ID, TOKENS_TOTAL, ORDER_DEADLINE, EGIFT_ENABLED,
  openShipWeeks, SHIP_STATUS_NOTE,
} from '../../data/natalBox';
import { Coins } from './BoxItemCard';
import ui from './xmasUi.module.css';
import styles from './NatalLanding.module.css';

/* Apertura di /box-di-natale: racconto, le tre box, come funzionano i gettoni,
   le settimane di spedizione prenotabili e i servizi per chi regala. */

const eur = (n) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export default function NatalLanding({ onTokens, onRacale }) {
  const weeks = openShipWeeks().filter((w) => w.id !== 'asap');
  const racaleFrom = Math.min(...BOXES.racale.sizes.map((s) => s.price));

  return (
    <div className={styles.landing}>
      <p className={styles.deadline}>
        <span><strong>Natale da Racale</strong> · ordina entro il <strong>{ORDER_DEADLINE.label}</strong> per riceverla prima della Vigilia</span>
        <span className={styles.deadlineSub}>Scegli tu il lunedì di spedizione</span>
      </p>

      {/* ── apertura ── */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={ui.kicker}>Natale · Racale, Salento</p>
          <h1 className={styles.heroTitle}>Il Salento,<br /><em>chiuso</em> in una scatola.</h1>
          <p className={styles.heroLead}>
            Capperi raccolti a mano a Racale, un vino o un olio del territorio e i dolci delle pasticcerie
            salentine. La componi tu, noi la chiudiamo con il nastro e la spediamo a chi vuoi tu.
          </p>
          <div className={styles.heroCtas}>
            <button type="button" className={ui.btnPrimary} onClick={onTokens}>Componi la tua box <span aria-hidden="true">→</span></button>
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
              src="/images/box-natale/box-poster.webp"
              alt="La Box a Gettoni chiusa con il nastro rosso, con il vino nel portabottiglia di cartone"
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
            <h2 className={styles.h2}>Tre modi di regalare <em>Racale</em></h2>
            <p className={styles.bandLead}>Tutte arrivano con il biglietto scritto a mano e senza prezzi nel pacco.</p>
          </div>

          <div className={styles.cards}>
            <article className={`${styles.card} ${styles.cardDark}`}>
              <span className={styles.cardKicker}>La più scelta · {BOXES.tokens.kicker.toLowerCase()}</span>
              <h3 className={styles.cardName}>{BOXES.tokens.name}</h3>
              <p className={styles.cardLead}>Dieci gettoni da spendere tra capperi e specialità, un vino o un olio, e i dolci di Natale.</p>
              <Coins n={TOKENS_TOTAL} className={styles.cardCoins} />
              <p className={styles.cardSmall}>9 prodotti in scatola + vino nel portabottiglia</p>
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
                {BOXES.racale.sizes[0].items.map((id) => (
                  <img key={id} src={PRODUCT_BY_ID[id].image} alt={PRODUCT_BY_ID[id].name} width="600" height="720" loading="lazy" decoding="async" />
                ))}
              </div>
              <p className={styles.cardSmall}>{BOXES.racale.sizes.map((s) => s.n).sort().join(' o ')} vasetti</p>
              <div className={styles.cardFoot}>
                <span className={styles.cardPrice}><small>da</small> {eur(racaleFrom)}</span>
                <button type="button" className={ui.btnOutline} onClick={onRacale}>Scegli il formato</button>
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
          <h2 className={styles.h2}>Dieci gettoni,<br /><em>tre scelte</em></h2>
          <p className={styles.bandLead}>Ogni prodotto vale uno o due gettoni. Quando li hai spesi tutti, la scatola è piena e la chiudiamo noi.</p>
        </div>
        <ol className={styles.howSteps}>
          <li>
            <span className={styles.howNum}>1</span>
            <h3>Almeno tre specialità</h3>
            <p>Capperi al sale o all’aceto, cucunci, germogli, polvere e foglie.</p>
            <p className={styles.howCost}><Coins n={1} /> 1 l’una</p>
          </li>
          <li>
            <span className={styles.howNum}>2</span>
            <h3>Un vino o un olio</h3>
            <p>Il vino viaggia nel suo portabottiglia accanto alla scatola, l’olio sta dentro.</p>
            <p className={styles.howCost}><Coins n={1} /> 1 vino · <Coins n={2} /> 2 olio</p>
          </li>
          <li>
            <span className={styles.howNum}>3</span>
            <h3>I dolci di Natale</h3>
            <p>Mostaccioli, fichi mandorlati, cotognata, purceddhruzzi.</p>
            <p className={styles.howCost}><Coins n={1} /> 1 l’uno</p>
          </li>
        </ol>
      </section>

      {/* ── calendario spedizioni ── */}
      <section className={styles.dark}>
        <div className={`${styles.wrap} ${styles.ship}`}>
          <div className={styles.shipIntro}>
            <p className={`${ui.kicker} ${styles.kickerGold}`}>Prenota la spedizione</p>
            <h2 className={styles.h2}>Scegli tu<br /><em>quando parte</em></h2>
            <p className={styles.bandLead}>
              Le prepariamo a mano, quindi ogni settimana ne chiudiamo un numero limitato.
              Prenota ora: paghi oggi, la spediamo il lunedì che scegli.
            </p>
          </div>
          <ul className={styles.weeks}>
            {weeks.map((w) => (
              <li key={w.id} className={styles.week} data-status={w.status}>
                <span className={styles.weekDay}>{w.day}</span>
                <span className={styles.weekDate}>{w.date}</span>
                <span className={styles.weekNote}>{SHIP_STATUS_NOTE[w.status]}</span>
              </li>
            ))}
            <li className={`${styles.week} ${styles.weekLast}`}>
              <span className={styles.weekDay}>Dopo il {ORDER_DEADLINE.label}</span>
              <span className={styles.weekDate}><em>Regala i gettoni</em></span>
              <span className={styles.weekNote}>{EGIFT_ENABLED ? 'Arrivano per email' : 'In arrivo'}</span>
            </li>
          </ul>
        </div>
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
