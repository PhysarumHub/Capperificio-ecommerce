import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { useCartContext } from '../context/ShopwareContext';
import { gtmAddToCart } from '../lib/utils/gtm';
import {
  BOXES, BOX_PRODUCT_IDS, PRODUCTS, PRODUCT_BY_ID, STEPS, STEP_GROUPS, TOKENS_TOTAL,
} from '../data/natalBox';
import {
  summarize, itemState, addPick, removePick, stepStatus, sceneFor, tokens, plural,
} from '../components/XmasBox/boxLogic';
import BoxStage from '../components/XmasBox/BoxStage';
import BoxItemCard, { Coins } from '../components/XmasBox/BoxItemCard';
import TokenMeter from '../components/XmasBox/TokenMeter';
import styles from './NatalBoxPage.module.css';

/* /box-di-natale — configuratore delle box di Natale.
   URL:  ?box=racale            Box Racale (confezione regalo fissa, 3 o 2 vasetti)
         ?box=gettoni&step=1..4 Box a Gettoni (specialità → vino/olio → dolci → chiudi)
   La composizione resta in sessionStorage: un refresh non la perde.
   Al carrello va un prodotto-box Shopware per tipo; la composizione viaggia
   nel payload della riga (da leggere lato evasione ordine). */

const STORE_KEY = 'caro:box-natale';
const eur = (n) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

function loadSaved() {
  try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}

function newLineId() {
  const raw = (crypto.randomUUID?.() ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`).replace(/-/g, '');
  return raw.slice(0, 32).padEnd(32, '0');
}

function ArrowLeft() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>;
}

const FAQ = [
  ['Cosa sono i gettoni?', `La Box a Gettoni ne ha ${TOKENS_TOTAL}. Ogni prodotto vale uno o due gettoni: quando li hai spesi tutti, la scatola è completa e la chiudiamo noi con il nastro.`],
  ['Devo per forza scegliere il vino o l’olio?', 'Sì, uno dei due fa parte della box. Il vino (1 gettone) arriva nel suo portabottiglia accanto alla scatola; l’olio (2 gettoni) prende un posto dentro.'],
  ['Perché almeno tre specialità del Capperificio?', 'La fila davanti della scatola è riservata ai nostri vasetti: è il cuore della box. Oltre le tre puoi aggiungerne quante vuoi, finché hai gettoni.'],
  ['Da dove arrivano gli altri prodotti?', 'Da aziende agricole, frantoi, cantine e pasticcerie del Salento che conosciamo di persona. Mettiamo tutto insieme e spediamo da Racale.'],
];

export default function NatalBoxPage() {
  const { addItem } = useCartContext();
  const [params, setParams] = useSearchParams();
  const saved = useMemo(loadSaved, []);
  const [picked, setPicked] = useState(saved.picked || {});
  const [giftSize, setGiftSize] = useState(saved.giftSize === 2 ? 2 : 3);
  const [giftNonce, setGiftNonce] = useState(0);
  const [added, setAdded] = useState(null);       // { type, preview } dopo l'aggiunta
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);       // { text, undo }
  const [openFaq, setOpenFaq] = useState(0);
  const panelRef = useRef(null);
  const configRef = useRef(null);
  const toastTimer = useRef(null);

  useSEO({
    title: 'Box di Natale — il Salento a casa tua',
    description: 'Regala il Salento: la Box Racale con le specialità del Capperificio Caro o la Box a Gettoni da comporre con capperi di Racale, vino o olio e dolci delle pasticcerie salentine.',
    path: '/box-di-natale',
    image: '/images/box-natale/box-poster.webp',
    // Nascosta finché prezzi, produttori e dolci non sono confermati:
    // raggiungibile solo col link, fuori da menu e sitemap.
    noindex: true,
  });

  useEffect(() => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ picked, giftSize })); } catch { /* storage non disponibile */ }
  }, [picked, giftSize]);

  /* ── stato derivato ───────────────────────────────────── */
  const sum = useMemo(() => summarize(picked), [picked]);
  const status = useMemo(() => stepStatus(sum), [sum]);
  const box = params.get('box');
  const view = added ? 'done' : box === 'racale' ? 'racale' : box === 'gettoni' ? 'tokens' : 'intro';
  // uno step non ancora raggiungibile (link vecchio, refresh) ripiega sull'ultimo valido
  const askedStep = Math.min(4, Math.max(1, Number(params.get('step')) || 1)) - 1;
  let step = askedStep;
  while (step > 0 && !status[step].reach) step -= 1;

  const size = BOXES.racale.sizes.find((s) => s.n === giftSize);
  const scene = useMemo(
    () => sceneFor({ view, step, picked, giftItems: size.items, added: added?.type }),
    [view, step, picked, size, added],
  );

  /* ── navigazione ──────────────────────────────────────── */
  // lo scroll parte dopo il render della nuova vista (su mobile cambia
  // l'altezza della scena, quindi la posizione va letta a layout aggiornato)
  const scrollReq = useRef(false);
  const scrollToPanel = () => { scrollReq.current = true; };
  useEffect(() => {
    if (!scrollReq.current) return;
    scrollReq.current = false;
    // intro e conferma: si riparte dalla scena (su mobile è in cima e non sticky)
    const el = view === 'done' || view === 'intro' ? configRef.current : panelRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      const top = el.getBoundingClientRect().top + window.scrollY - margin;
      if (Math.abs(window.scrollY - top) > 4) window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  }, [view, step, added]);
  const go = useCallback((next, { replace = false } = {}) => {
    setAdded(null);
    setError('');
    setParams(next, { replace });
    scrollToPanel();
  }, [setParams]);
  const goStep = (i) => go({ box: 'gettoni', step: String(i + 1) });
  const openRacale = () => { setGiftNonce((n) => n + 1); go({ box: 'racale' }); };
  const openTokens = () => go({ box: 'gettoni', step: '1' });
  const backToIntro = () => go({});

  /* ── composizione ─────────────────────────────────────── */
  const add = (p) => setPicked((cur) => addPick(cur, p));
  const remove = (id) => setPicked((cur) => removePick(cur, id));

  const showToast = (text, undo) => {
    clearTimeout(toastTimer.current);
    setToast({ text, undo });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // tocco su un prodotto nella scena 3D = lo tolgo (con annulla)
  const pickFromStage = view === 'tokens' && step < 3 ? (id) => {
    const p = PRODUCT_BY_ID[id];
    if (!p) return;
    const before = picked;
    setPicked(removePick(before, id));
    showToast(`Tolto: ${p.name}`, () => setPicked(before));
  } : undefined;

  const changeSize = (n) => {
    if (n === giftSize) return;
    setGiftSize(n);
    setGiftNonce((x) => x + 1);
  };

  /* ── carrello ─────────────────────────────────────────── */
  async function addBoxToCart(type) {
    const isRacale = type === 'racale';
    const productKey = isRacale ? size.productKey : BOXES.tokens.productKey;
    const productId = BOX_PRODUCT_IDS[productKey];
    const price = isRacale ? size.price : BOXES.tokens.price;
    const items = isRacale
      ? size.items.map((id) => ({ id, name: PRODUCT_BY_ID[id].name, detail: PRODUCT_BY_ID[id].detail, qty: 1 }))
      : sum.chosen.map(({ p, qty }) => ({ id: p.id, name: p.name, detail: p.detail, qty, tokens: qty * p.cost }));
    const name = isRacale ? `${BOXES.racale.name} · ${size.label}` : BOXES.tokens.name;

    setError('');
    if (!productId) {
      // Prodotto-box non ancora creato in Shopware: in locale mostro comunque il
      // percorso completo, in produzione lo dico chiaramente.
      if (import.meta.env.DEV) { setAdded({ type, preview: true }); scrollToPanel(); return; }
      setError('La box non è ancora acquistabile online. Scrivici e la prepariamo per te.');
      return;
    }
    setBusy(true);
    try {
      await addItem(productId, 1, {
        id: newLineId(),
        payload: { natalBox: { type, name, size: isRacale ? size.n : undefined, items } },
      });
      gtmAddToCart({ id: productId, name, price }, 1);
      setAdded({ type, preview: false });
      scrollToPanel();
    } catch {
      setError('Non siamo riusciti ad aggiungere la box al carrello. Riprova tra un attimo.');
    } finally {
      setBusy(false);
    }
  }

  const startOver = () => { setPicked({}); setAdded(null); go({ box: 'gettoni', step: '1' }); };
  const openCart = () => window.dispatchEvent(new Event('caro:open-cart'));

  /* ── barra azioni (sticky in basso) ───────────────────── */
  let bar = null;
  if (view === 'racale') {
    bar = {
      info: <><span className={styles.barTitle}>{BOXES.racale.name}</span><span className={styles.barSub}>{size.label} · {eur(size.price)}</span></>,
      label: busy ? 'Aggiungo…' : `Aggiungi al carrello · ${eur(size.price)}`,
      onClick: () => addBoxToCart('racale'),
      disabled: busy,
    };
  } else if (view === 'tokens') {
    const helper = step === 0
      ? sum.missing > 0 ? `Mancano ${plural(sum.missing, 'specialità', 'specialità')} del Capperificio` : 'Specialità a posto: ora il vino o l’olio'
      : step === 1
        ? sum.vo ? (sum.vo.id === 't-vino' ? 'Vino nel portabottiglia: 9 posti in scatola' : 'Olio in scatola: 8 posti per il resto') : 'Il vino lascia 9 posti, l’olio 8'
        : step === 2
          ? sum.complete ? 'Gettoni finiti: la scatola è piena' : `Ti ${sum.left === 1 ? 'resta' : 'restano'} ${tokens(sum.left)} per i dolci`
          : `${BOXES.tokens.name} · ${eur(BOXES.tokens.price)}`;
    let label; let onClick; let disabled = false;
    if (step === 0) {
      if (sum.missing > 0) { label = `Scegli ancora ${plural(sum.missing, 'specialità', 'specialità')}`; disabled = true; }
      else { label = 'Avanti · vino o olio'; onClick = () => goStep(1); }
    } else if (step === 1) {
      if (!sum.vo) { label = 'Scegli vino o olio'; disabled = true; }
      else if (sum.complete) { label = 'Chiudi la scatola'; onClick = () => goStep(3); }
      else { label = 'Avanti · i dolci'; onClick = () => goStep(2); }
    } else if (step === 2) {
      if (!sum.complete) { label = `Scegli ancora ${plural(sum.left, 'dolce', 'dolci')}`; disabled = true; }
      else { label = 'Chiudi la scatola'; onClick = () => goStep(3); }
    } else {
      label = busy ? 'Aggiungo…' : `Aggiungi al carrello · ${eur(BOXES.tokens.price)}`;
      onClick = () => addBoxToCart('tokens');
      disabled = busy;
    }
    bar = {
      info: <><span className={styles.barCount}><strong>{sum.used}</strong>/{TOKENS_TOTAL} gettoni</span><span className={styles.barSub}>{helper}</span></>,
      label, onClick, disabled, arrow: step < 3,
    };
  }

  const stageLabel = view === 'tokens'
    ? `Anteprima 3D della tua scatola: ${sum.items ? sum.chosen.map(({ p, qty }) => `${qty} ${p.name}`).join(', ') : 'ancora vuota'}.`
    : view === 'racale'
      ? `Anteprima 3D della ${BOXES.racale.name} da ${size.label}.`
      : 'Anteprima 3D di una Box a Gettoni chiusa con il nastro, con il vino nel portabottiglia.';

  /* ═════════════════════════ render ═════════════════════════ */
  return (
    <>
      <nav className={styles.breadcrumb} aria-label="Percorso">
        <Link to="/">Capperificio Caro</Link><span className={styles.sep}>/</span>
        <span>Natale</span><span className={styles.sep}>/</span>
        <span aria-current="page">Box di Natale</span>
      </nav>

      <section className={styles.config} data-view={view} ref={configRef}>
        {/* ── scena 3D ── */}
        <div className={styles.stageCol}>
          <BoxStage scene={scene} giftNonce={giftNonce} onPick={pickFromStage} label={stageLabel}>
            <div className={styles.stageTop}>
              <span className={styles.stageTag}>
                {view === 'racale' || added?.type === 'racale' ? BOXES.racale.name : view === 'intro' ? 'Natale da Racale' : BOXES.tokens.name}
              </span>
              {(view === 'tokens' || added?.type === 'tokens') && (
                <span className={styles.stageMeter}><TokenMeter used={sum.used} compact /></span>
              )}
            </div>
            {view === 'tokens' && step < 3 && (
              <p className={styles.stageHint} data-busy={sum.items > 0}>
                {sum.items ? 'Tocca un prodotto nella scatola per toglierlo' : 'Trascina per ruotare la scatola'}
              </p>
            )}
          </BoxStage>
        </div>

        {/* ── pannello ── */}
        <div className={styles.panel} ref={panelRef}>
          <div className={styles.panelInner} key={view === 'tokens' ? `t${step}` : view}>

            {view === 'intro' && (
              <>
                <p className={styles.kicker}>Natale · Racale, Salento</p>
                <h1 className={styles.title}>Il Salento, <em>a casa tua</em></h1>
                <p className={styles.lead}>
                  I capperi che raccogliamo a mano a Racale, insieme al vino, all’olio e ai dolci delle aziende
                  vicine a noi. Scegli la box già pronta o componila gettone dopo gettone.
                </p>

                <div className={styles.choices}>
                  <button type="button" className={styles.choice} onClick={openTokens}>
                    <span className={styles.choiceKicker}>{BOXES.tokens.kicker}</span>
                    <span className={styles.choiceName}>{BOXES.tokens.name}</span>
                    <span className={styles.choiceLead}>{BOXES.tokens.lead}</span>
                    <ul className={styles.choiceList}>
                      <li><Coins n={1} /> 3+ specialità del Capperificio</li>
                      <li><Coins n={1} /> vino <span aria-hidden="true">·</span> <Coins n={2} /> olio</li>
                      <li><Coins n={1} /> dolci delle pasticcerie salentine</li>
                    </ul>
                    <span className={styles.choiceFoot}>
                      <span className={styles.choicePrice}>{eur(BOXES.tokens.price)}</span>
                      <span className={styles.choiceCta}>Componi <span aria-hidden="true">→</span></span>
                    </span>
                  </button>

                  <button type="button" className={styles.choice} onClick={openRacale}>
                    <span className={styles.choiceKicker}>{BOXES.racale.kicker}</span>
                    <span className={styles.choiceName}>{BOXES.racale.name}</span>
                    <span className={styles.choiceLead}>{BOXES.racale.lead}</span>
                    <ul className={styles.choiceList}>
                      <li>Germogli, polvere di cappero e Lilliput</li>
                      <li>Anche nel formato da 2 vasetti</li>
                    </ul>
                    <span className={styles.choiceFoot}>
                      <span className={styles.choicePrice}>da {eur(Math.min(...BOXES.racale.sizes.map((s) => s.price)))}</span>
                      <span className={styles.choiceCta}>Scopri <span aria-hidden="true">→</span></span>
                    </span>
                  </button>
                </div>

                <ul className={styles.trust}>
                  <li>Raccolti e selezionati a mano a Racale</li>
                  <li>Produttori del territorio, scelti di persona</li>
                  <li>Pagamento sicuro</li>
                </ul>
              </>
            )}

            {view === 'racale' && (
              <>
                <button type="button" className={styles.back} onClick={backToIntro}><ArrowLeft /> Tutte le box</button>
                <p className={styles.kicker}>{BOXES.racale.kicker}</p>
                <h1 className={styles.title}>{BOXES.racale.name}</h1>
                <p className={styles.lead}>{BOXES.racale.lead}</p>

                <div className={styles.sizes} role="radiogroup" aria-label="Formato">
                  {BOXES.racale.sizes.map((s) => (
                    <button
                      key={s.n}
                      type="button"
                      role="radio"
                      aria-checked={s.n === giftSize}
                      className={`${styles.size} ${s.n === giftSize ? styles.sizeOn : ''}`}
                      onClick={() => changeSize(s.n)}
                    >
                      <span>{s.label}</span>
                      <span className={styles.sizePrice}>{eur(s.price)}</span>
                    </button>
                  ))}
                </div>

                <h2 className={styles.sectionTitle}>Nella confezione</h2>
                <ul className={styles.contents}>
                  {size.items.map((id) => {
                    const p = PRODUCT_BY_ID[id];
                    return (
                      <li key={id} className={styles.contentRow}>
                        <img src={p.image} alt="" width="120" height="144" loading="lazy" decoding="async" />
                        <div>
                          <span className={styles.contentName}>{p.name}</span>
                          <span className={styles.contentDetail}>{p.detail}</span>
                          <span className={styles.contentNote}>{p.note}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className={styles.small}>Confezione in tela verde con finestre e fiocco di raso, pronta da mettere sotto l’albero.</p>
                {error && <p className={styles.error} role="alert">{error}</p>}
              </>
            )}

            {view === 'tokens' && (
              <>
                <button type="button" className={styles.back} onClick={backToIntro}><ArrowLeft /> Tutte le box</button>

                <ol className={styles.stepper} aria-label="Passaggi">
                  {STEPS.map((s, i) => {
                    const st = status[i];
                    const cls = [styles.stepItem, i === step && styles.stepOn, st.done && styles.stepDone].filter(Boolean).join(' ');
                    return (
                      <li key={s.key} className={cls}>
                        <button type="button" disabled={!st.reach} onClick={() => goStep(i)} aria-current={i === step ? 'step' : undefined}>
                          <span className={styles.stepBar} />
                          <span className={styles.stepLabel}><span className={styles.stepNum}>{i + 1}</span> {s.short}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>

                <p className={styles.kicker}>Passo {step + 1} di 4</p>
                <h1 className={styles.titleSm}>{STEPS[step].title}</h1>
                <p className={styles.lead}>{STEPS[step].lead}</p>
                <div className={styles.meterRow}><TokenMeter used={sum.used} /></div>

                {step < 3 && STEP_GROUPS[STEPS[step].key].map((g, gi) => (
                  <div key={gi} className={styles.group}>
                    {g.title && (
                      <div className={styles.groupHead}>
                        <h2 className={styles.sectionTitle}>{g.title}</h2>
                        <span>{g.sub}</span>
                      </div>
                    )}
                    <div className={styles.grid} role={step === 1 ? 'radiogroup' : undefined} aria-label={step === 1 ? 'Vino o olio' : undefined}>
                      {PRODUCTS.filter(g.filter).map((p) => (
                        <BoxItemCard
                          key={p.id}
                          product={p}
                          state={itemState(p, picked, sum)}
                          variant={p.sect === 'vo' ? 'radio' : 'qty'}
                          onAdd={() => add(p)}
                          onRemove={() => remove(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {step === 3 && (
                  <div className={styles.review}>
                    {[
                      ['Specialità del Capperificio', 0, (p) => p.sect === 'capperi' || p.sect === 'caro'],
                      ['Vino o olio', 1, (p) => p.sect === 'vo'],
                      ['Dolci', 2, (p) => p.sect === 'dolci'],
                    ].map(([title, si, f]) => {
                      const rows = sum.chosen.filter(({ p }) => f(p));
                      return (
                        <div key={title} className={styles.reviewGroup}>
                          <div className={styles.reviewHead}>
                            <h2 className={styles.sectionTitle}>{title}</h2>
                            <button type="button" className={styles.edit} onClick={() => goStep(si)}>Modifica</button>
                          </div>
                          {rows.length === 0 && <p className={styles.small}>Nessuno: hai usato i gettoni per il resto.</p>}
                          <ul className={styles.contents}>
                            {rows.map(({ p, qty }) => (
                              <li key={p.id} className={styles.contentRow}>
                                <img src={p.image} alt="" width="120" height="144" loading="lazy" decoding="async" />
                                <div>
                                  <span className={styles.contentName}>{qty > 1 ? `${qty} × ` : ''}{p.name}</span>
                                  <span className={styles.contentDetail}>{p.detail}</span>
                                  {p.producer && <span className={styles.contentNote}>{p.producer}</span>}
                                </div>
                                <span className={styles.contentTokens}><Coins n={Math.min(2, p.cost)} /> {qty * p.cost}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                    <div className={styles.totalRow}>
                      <span>{sum.vo?.id === 't-vino' ? `${sum.items - 1} prodotti in scatola + vino nel portabottiglia` : `${sum.items} prodotti in scatola, olio compreso`}</span>
                      <strong>{eur(BOXES.tokens.price)}</strong>
                    </div>
                    {error && <p className={styles.error} role="alert">{error}</p>}
                  </div>
                )}
              </>
            )}

            {view === 'done' && (
              <div className={styles.done}>
                <span className={styles.doneSeal} aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </span>
                <p className={styles.kicker}>{added.type === 'racale' ? `${BOXES.racale.name} · ${size.label}` : BOXES.tokens.name}</p>
                <h1 className={styles.title} role="status">
                  {added.preview ? <>Box pronta <em>(anteprima)</em></> : <>È nel tuo <em>carrello</em></>}
                </h1>
                <p className={styles.lead}>
                  {added.type === 'racale'
                    ? 'La confezione è chiusa con il fiocco. La prepariamo a mano a Racale e la spediamo pronta da regalare.'
                    : 'Abbiamo chiuso la scatola con il nastro. La prepariamo a mano a Racale insieme ai produttori del territorio.'}
                </p>
                {added.preview && (
                  <p className={styles.previewNote}>
                    Modalità anteprima: manca l’ID del prodotto-box Shopware
                    ({added.type === 'racale' ? (size.n === 2 ? 'VITE_XMAS_BOX_FIXED2_ID' : 'VITE_XMAS_BOX_FIXED_ID') : 'VITE_XMAS_BOX_TOKENS_ID'}),
                    quindi il carrello non è stato toccato.
                  </p>
                )}
                <div className={styles.doneActions}>
                  {!added.preview && <button type="button" className={styles.btnPrimary} onClick={openCart}>Vai al carrello</button>}
                  <button type="button" className={added.preview ? styles.btnPrimary : styles.btnOutline} onClick={startOver}>Componi un’altra box</button>
                  <Link to="/collections/all" className={styles.textLink}>Continua con gli acquisti</Link>
                </div>
              </div>
            )}
          </div>

          {bar && (
            <div className={styles.bar}>
              <div className={styles.barInfo}>{bar.info}</div>
              <button type="button" className={styles.barBtn} onClick={bar.onClick} disabled={bar.disabled} aria-disabled={bar.disabled}>
                {bar.label}{bar.arrow && !bar.disabled && <span aria-hidden="true"> →</span>}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── racconto e domande ── */}
      <section className={styles.story}>
        <figure className={styles.storyImg}>
          <img src="/images/territorio/capperificio-caro-raccolta.webp" alt="Raccolta dei capperi a mano nei campi di Racale" width="900" height="1100" loading="lazy" decoding="async" />
        </figure>
        <div className={styles.storyText}>
          <p className={styles.kicker}>Da Racale, con le mani</p>
          <h2 className={styles.storyTitle}>Un pezzo di Salento <em>sotto l’albero</em></h2>
          <p>
            Ogni cappero è raccolto all’alba, selezionato per calibro e messo sotto sale come si fa in famiglia
            da generazioni. Accanto ai nostri vasetti mettiamo quello che i vicini fanno meglio: il vino, l’olio,
            i dolci delle feste.
          </p>
          <div className={styles.faq}>
            {FAQ.map(([q, a], i) => (
              <div key={q} className={styles.faqItem}>
                <button type="button" className={styles.faqQ} aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  <span>{q}</span>
                  <span className={`${styles.faqIcon} ${openFaq === i ? styles.faqIconOpen : ''}`} aria-hidden="true">+</span>
                </button>
                {openFaq === i && <p className={styles.faqA}>{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastOn : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            <span>{toast.text}</span>
            <button type="button" onClick={() => { toast.undo(); setToast(null); }}>Annulla</button>
          </>
        )}
      </div>
    </>
  );
}
