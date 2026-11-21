import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { useCartContext } from '../context/ShopwareContext';
import { gtmAddToCart } from '../lib/utils/gtm';
import {
  BOXES, BOX_PRODUCT_IDS, PRODUCTS, PRODUCT_BY_ID, STEPS, STEP_GROUPS, SHIP_ASAP,
} from '../data/natalBox';
import {
  summarize, itemState, addPick, removePick, stepStatus, tokens, plural,
  cleanPicked,
} from '../components/XmasBox/boxLogic';
import BoxItemCard, { Coins } from '../components/XmasBox/BoxItemCard';
import TokenMeter from '../components/XmasBox/TokenMeter';
import NatalLanding from '../components/XmasBox/NatalLanding';
import GiftStep, { EMPTY_GIFT, GiftNote, validateGift } from '../components/XmasBox/GiftStep';
import ui from '../components/XmasBox/xmasUi.module.css';
import styles from './NatalBoxPage.module.css';

/* /box-di-natale — box di Natale da regalare.
   URL:  (nessun parametro)          apertura: le box, come funziona, spedizioni
         ?box=racale                 Box Racale (confezione regalo fissa, 3 o 2 vasetti)
         ?box=gettoni&step=1..4      Cassetta in Legno (vasetti → olio e vino → forno e legumi → chiudi)
         …&regalo=1                  passo "È un regalo?": spedizione, biglietto, destinatario
   Composizione e dati del regalo restano in sessionStorage: un refresh non li perde.
   Al carrello va un prodotto-box Shopware per tipo; composizione, settimana di
   spedizione e regalo viaggiano nel payload della riga (natalBox). */

const STORE_KEY = 'caro:box-natale';
const CASSETTA_PHOTO = '/images/box-natale/cassetta-legno-foto.webp';
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

export default function NatalBoxPage() {
  const { addItem } = useCartContext();
  const [params, setParams] = useSearchParams();
  const saved = useMemo(loadSaved, []);
  const [picked, setPicked] = useState(() => cleanPicked(saved.picked));
  const [giftSize, setGiftSize] = useState(saved.giftSize === 2 ? 2 : 3);
  const [gift, setGift] = useState(() => {
    const g = { ...EMPTY_GIFT, ...saved.gift, recipient: { ...EMPTY_GIFT.recipient, ...saved.gift?.recipient } };
    return g;
  });
  const [giftErrors, setGiftErrors] = useState({});
  const [added, setAdded] = useState(null);       // { type, preview, ship, to } dopo l'aggiunta
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);       // { text, undo }
  const panelRef = useRef(null);
  const configRef = useRef(null);
  const toastTimer = useRef(null);

  useSEO({
    title: 'Box di Natale — il Salento a casa tua',
    description: 'Regala il Salento: la Cassetta in Legno da comporre con 11 gettoni tra capperi di Racale, olio, vino, forno e legumi salentini, o la Box Racale pronta da regalare. Aggiungi il biglietto scritto a mano.',
    path: '/box-di-natale',
    image: '/images/box-natale/box-natale-og.jpg',
  });

  useEffect(() => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ picked, giftSize, gift })); } catch { /* storage non disponibile */ }
  }, [picked, giftSize, gift]);

  /* ── stato derivato ───────────────────────────────────── */
  const sum = useMemo(() => summarize(picked), [picked]);
  const status = useMemo(() => stepStatus(sum), [sum]);
  const box = params.get('box');
  const wantsGift = params.get('regalo') === '1';
  const giftFor = box === 'racale' ? 'racale' : 'tokens';
  const giftReady = box === 'racale' || (box === 'gettoni' && sum.complete);
  const view = added ? 'done'
    : box === 'racale' ? (wantsGift ? 'gift' : 'racale')
      : box === 'gettoni' ? (wantsGift && giftReady ? 'gift' : 'tokens')
        : 'intro';
  // uno step non ancora raggiungibile (link vecchio, refresh) ripiega sull'ultimo valido
  const askedStep = Math.min(4, Math.max(1, Number(params.get('step')) || 1)) - 1;
  let step = askedStep;
  while (step > 0 && !status[step].reach) step -= 1;

  // nessuna scelta della data: parte appena pronta
  const week = SHIP_ASAP;
  const size = BOXES.racale.sizes.find((x) => x.n === giftSize);

  /* ── navigazione ──────────────────────────────────────── */
  // lo scroll parte dopo il render della nuova vista (su mobile cambia
  // l'altezza della scena, quindi la posizione va letta a layout aggiornato)
  const scrollReq = useRef(false);
  const scrollToPanel = () => { scrollReq.current = true; };
  useEffect(() => {
    if (!scrollReq.current) return;
    scrollReq.current = false;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (view === 'intro') { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
    // conferma: si riparte dalla scena (su mobile è in cima e non sticky)
    const el = view === 'done' ? configRef.current : panelRef.current;
    if (!el) return;
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
  const openRacale = () => go({ box: 'racale' });
  const openTokens = () => go({ box: 'gettoni', step: '1' });
  const backToIntro = () => go({});
  const openGift = () => {
    setGiftErrors({});
    go(giftFor === 'racale' ? { box: 'racale', regalo: '1' } : { box: 'gettoni', step: '4', regalo: '1' });
  };
  const leaveGift = () => (giftFor === 'racale' ? go({ box: 'racale' }) : goStep(3));

  /* ── composizione ─────────────────────────────────────── */
  const add = (p) => setPicked((cur) => addPick(cur, p));
  const remove = (id) => setPicked((cur) => removePick(cur, id));

  const showToast = (text, undo) => {
    clearTimeout(toastTimer.current);
    setToast({ text, undo });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);


  const changeSize = (n) => {
    if (n === giftSize) return;
    setGiftSize(n);
  };

  const changeGift = (next) => {
    setGift(next);
    // gli errori si aggiornano mentre si corregge, non compaiono prima del primo invio
    if (Object.keys(giftErrors).length) setGiftErrors(validateGift(next));
  };

  /* ── carrello ─────────────────────────────────────────── */
  async function addBoxToCart() {
    const type = giftFor;
    const isRacale = type === 'racale';
    const errs = validateGift(gift);
    setGiftErrors(errs);
    if (Object.keys(errs).length) {
      setError('Controlla i campi evidenziati.');
      return;
    }
    const productId = BOX_PRODUCT_IDS[isRacale ? size.productKey : BOXES.tokens.productKey];
    const price = isRacale ? size.price : BOXES.tokens.price;
    const line = (p, qty, extra) => ({ id: p.id, name: p.name, detail: [p.detail, p.producer].filter(Boolean).join(' · '), qty, ...extra });
    const items = isRacale
      ? size.items.map((id) => line(PRODUCT_BY_ID[id], 1))
      : sum.chosen.map(({ p, qty }) => line(p, qty, { tokens: qty * p.cost }));
    const name = isRacale ? `${BOXES.racale.name} · ${size.label}` : BOXES.tokens.name;
    const isGift = gift.mode === 'recipient';
    const r = gift.recipient;
    const giftPayload = isGift ? {
      to: gift.to.trim(),
      sign: gift.sign.trim(),
      message: gift.message.trim(),
      hidePrices: gift.hidePrices,
      recipient: {
        name: r.name.trim(), street: r.street.trim(), zip: r.zip.trim(), city: r.city.trim(),
        phone: r.phone.trim() || undefined,
        email: gift.notify ? r.email.trim() : undefined,
      },
      notify: gift.notify,
    } : undefined;
    const done = { type, ship: week.label, to: isGift ? (gift.to.trim() || r.name.trim()) : '' };

    setError('');
    if (!productId) {
      // Prodotto-box non ancora creato in Shopware: in locale mostro comunque il
      // percorso completo, in produzione lo dico chiaramente.
      if (import.meta.env.DEV) { setAdded({ ...done, preview: true }); scrollToPanel(); return; }
      setError('La box non è ancora acquistabile online. Scrivici e la prepariamo per te.');
      return;
    }
    setBusy(true);
    try {
      await addItem(productId, 1, {
        id: newLineId(),
        payload: {
          natalBox: {
            type, name, size: isRacale ? size.n : undefined, items,
            ship: { id: week.id, label: week.label },
            gift: giftPayload,
          },
        },
      });
      gtmAddToCart({ id: productId, name, price }, 1);
      setAdded({ ...done, preview: false });
      scrollToPanel();
    } catch {
      setError('Non siamo riusciti ad aggiungere la box al carrello. Riprova tra un attimo.');
    } finally {
      setBusy(false);
    }
  }

  const startOver = () => {
    setAdded(null);
    if (added?.type === 'racale') { openRacale(); return; }
    setPicked({}); go({ box: 'gettoni', step: '1' });
  };
  const openCart = () => window.dispatchEvent(new Event('caro:open-cart'));

  /* ── apertura ─────────────────────────────────────────── */
  if (view === 'intro') {
    return (
      <>
        <nav className={styles.breadcrumb} aria-label="Percorso">
          <Link to="/">Capperificio Caro</Link><span className={styles.sep}>/</span>
          <span aria-current="page">Box di Natale</span>
        </nav>
        <NatalLanding onTokens={openTokens} onRacale={openRacale} />
      </>
    );
  }

  /* ── barra azioni (sticky in basso) ───────────────────── */
  const boxPrice = giftFor === 'racale' ? size.price : BOXES.tokens.price;
  let bar = null;
  if (view === 'racale') {
    bar = {
      info: <><span className={styles.barTitle}>{BOXES.racale.name}</span><span className={styles.barSub}>{size.label} · {eur(size.price)}</span></>,
      label: <>Continua<span className={styles.hideSm}> · è un regalo?</span></>,
      onClick: openGift,
      arrow: true,
    };
  } else if (view === 'tokens') {
    const leftText = `Ti ${sum.left === 1 ? 'resta' : 'restano'} ${tokens(sum.left)}`;
    const helper = step === 3
      ? 'Biglietto, spedizione e destinatario nel prossimo passo'
      : sum.missing > 0
        ? `Mancano ${plural(sum.missing, 'vasetto', 'vasetti')} del Capperificio`
        : sum.complete ? 'Gettoni finiti: la cassetta è piena' : leftText;
    let label; let onClick; let disabled = false;
    if (step === 0 && sum.missing > 0) { label = `Scegli ancora ${plural(sum.missing, 'vasetto', 'vasetti')}`; disabled = true; }
    else if (step < 3 && sum.complete) { label = 'Chiudi la cassetta'; onClick = () => goStep(3); }
    else if (step === 0) { label = 'Avanti · olio e vino'; onClick = () => goStep(1); }
    else if (step === 1) { label = 'Avanti · forno e legumi'; onClick = () => goStep(2); }
    else if (step === 2) { label = `Usa ancora ${tokens(sum.left)}`; disabled = true; }
    else {
      label = <>Continua<span className={styles.hideSm}> · è un regalo?</span></>;
      onClick = openGift;
    }
    bar = {
      info: <span className={styles.barHelper}>{helper}</span>,
      label, onClick, disabled, arrow: true,
      back: step > 0 ? () => goStep(step - 1) : null,
    };
  } else if (view === 'gift') {
    const isGift = gift.mode === 'recipient';
    const toName = gift.to.trim() || gift.recipient.name.trim() || 'chi la riceve';
    bar = {
      info: (
        <>
          <span className={styles.barTitle}>{giftFor === 'racale' ? `${BOXES.racale.name} · ${size.label}` : BOXES.tokens.name}</span>
          <span className={styles.barSub}>
            {isGift ? `Spedita a ${toName}` : 'Spedita a te'}
          </span>
        </>
      ),
      label: busy ? 'Aggiungo…' : <>Aggiungi<span className={styles.hideSm}> al carrello</span> · {eur(boxPrice)}</>,
      onClick: addBoxToCart,
      disabled: busy,
      back: leaveGift,
    };
  }


  // Foto al posto della scena 3D: una per formato della Box Racale, una per la Cassetta
  const isRacaleView = giftFor === 'racale' && (view === 'racale' || view === 'gift' || added?.type === 'racale');
  const stagePhoto = isRacaleView
    ? { src: size.photo, alt: `La Box Racale da ${size.label}: confezione in lino verde a finestre con i vasetti del Capperificio Caro, sotto l’albero di Natale` }
    : { src: CASSETTA_PHOTO, alt: 'La Cassetta in Legno del Capperificio Caro con capperi di Racale, vino, dolci e biscotti, sotto l’albero di Natale' };
  const showMeter = view === 'tokens' || (view === 'gift' && giftFor === 'tokens');
  const boxTitle = view === 'racale' || (view === 'gift' && giftFor === 'racale') || added?.type === 'racale'
    ? BOXES.racale.name : BOXES.tokens.name;
  // ultima parola in corsivo: "Box <em>Racale</em>", "Cassetta in <em>Legno</em>"
  const cut = boxTitle.lastIndexOf(' ');
  const boxA = boxTitle.slice(0, cut);
  const boxB = boxTitle.slice(cut + 1);

  /* ═════════════════════════ render ═════════════════════════ */
  return (
    <>
      <nav className={styles.breadcrumb} aria-label="Percorso">
        <Link to="/">Capperificio Caro</Link><span className={styles.sep}>/</span>
        <Link to="/box-di-natale">Box di Natale</Link><span className={styles.sep}>/</span>
        <span aria-current="page">{boxTitle}</span>
      </nav>

      {/* ── testata del percorso ── */}
      <div className={styles.topbar}>
        <button type="button" className={styles.back} onClick={view === 'gift' ? leaveGift : backToIntro}>
          <ArrowLeft /> {view === 'gift' ? 'Torna alla box' : 'Tutte le box'}
        </button>
        <span className={styles.topTitle}>{cut > 0 ? <>{boxA} <em>{boxB}</em></> : boxTitle}</span>
        {view === 'tokens' ? (
          <ol className={styles.stepper} aria-label="Passaggi">
            {STEPS.map((s, i) => {
              const st = status[i];
              const state = i === step ? 'now' : st.done ? 'done' : 'todo';
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    className={styles.step}
                    data-state={state}
                    disabled={!st.reach}
                    onClick={() => goStep(i)}
                    aria-current={i === step ? 'step' : undefined}
                  >
                    <span className={styles.stepNum}>{i + 1}</span>{s.short}
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <span className={styles.topNote}>
            {view === 'gift' ? 'Ultimo passo prima del carrello' : view === 'done' ? 'Nel carrello' : 'Pronta da regalare'}
          </span>
        )}
      </div>

      <section className={styles.config} data-view={view} ref={configRef}>
        {/* ── la scatola ── */}
        <div className={styles.stageCol}>
          <div className={styles.kraft}>
            <div className={`${styles.stageBox} ${styles.stageBoxPhoto}`}>
              <img
                key={stagePhoto.src}
                className={styles.stagePhoto}
                src={stagePhoto.src}
                alt={stagePhoto.alt}
                width="1200" height="896" decoding="async"
              />
              {view === 'gift' && gift.mode === 'recipient' && (
                <div className={styles.stageNote}><GiftNote gift={gift} /></div>
              )}
            </div>
            {showMeter && <div className={styles.meter}><TokenMeter used={sum.used} /></div>}
            {view === 'gift' && (
              <p className={styles.kraftNote}>Ricopiamo il tuo messaggio a penna sul nostro cartoncino e lo leghiamo al nastro.</p>
            )}
          </div>
        </div>

        {/* ── pannello ── */}
        <div className={styles.panel} ref={panelRef}>
          <div className={styles.panelInner} key={view === 'tokens' ? `t${step}` : view}>

            {view === 'racale' && (
              <>
                <p className={ui.kicker}>{BOXES.racale.kicker}</p>
                <h1 className={styles.title}>{BOXES.racale.name}</h1>
                <p className={styles.lead}>{BOXES.racale.lead}</p>

                <div className={styles.sizes} role="radiogroup" aria-label="Formato">
                  {BOXES.racale.sizes.map((x) => (
                    <button
                      key={x.n}
                      type="button"
                      role="radio"
                      aria-checked={x.n === giftSize}
                      className={`${styles.size} ${x.n === giftSize ? styles.sizeOn : ''}`}
                      onClick={() => changeSize(x.n)}
                    >
                      <span className={styles.sizeRadio} aria-hidden="true" />
                      <span className={styles.sizeLabel}>{x.label}</span>
                      <span className={styles.sizeItems}>{x.items.map((id) => PRODUCT_BY_ID[id].name).join(' · ')}</span>
                      <span className={styles.sizePrice}>{eur(x.price)}</span>
                    </button>
                  ))}
                </div>

                <h2 className={styles.groupTitle}>Nella confezione</h2>
                <ul className={styles.contents}>
                  {size.items.map((id) => {
                    const p = PRODUCT_BY_ID[id];
                    return (
                      <li key={id} className={styles.contentRow}>
                        {p.image && <span className={styles.contentThumb}><img src={p.image} alt="" width="600" height="720" loading="lazy" decoding="async" /></span>}
                        <div>
                          <span className={styles.contentName}>{p.name}</span>
                          <span className={styles.contentDetail}>{p.detail} · {p.note}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className={styles.small}>Confezione in tela verde con finestre e fiocco di raso, pronta da mettere sotto l’albero.</p>
              </>
            )}

            {view === 'tokens' && (
              <>
                <p className={ui.kicker}>Passo {step + 1} di 4</p>
                <h1 className={styles.title}>{STEPS[step].title}</h1>
                <p className={styles.lead}>{STEPS[step].lead}</p>

                {step < 3 && STEP_GROUPS[STEPS[step].key].map((g, gi) => (
                  <div key={gi} className={styles.group}>
                    {g.title && (
                      <div className={styles.groupHead}>
                        <h2 className={styles.groupTitle}>{g.title}</h2>
                        <span>{g.sub}</span>
                      </div>
                    )}
                    <ul className={styles.list} aria-label={g.title || undefined}>
                      {PRODUCTS.filter(g.filter).map((p) => (
                        <BoxItemCard
                          key={p.id}
                          product={p}
                          state={itemState(p, picked, sum)}
                          onAdd={() => add(p)}
                          onRemove={() => remove(p.id)}
                        />
                      ))}
                    </ul>
                  </div>
                ))}

                {step === 3 && (
                  <div className={styles.review}>
                    {[
                      ['Dal Capperificio', 0, (p) => p.sect === 'capperi' || p.sect === 'caro'],
                      ['Olio e vino', 1, (p) => p.sect === 'olio' || p.sect === 'vino'],
                      ['Forno e legumi', 2, (p) => p.sect === 'forno' || p.sect === 'legumi'],
                    ].map(([title, si, f]) => {
                      const rows = sum.chosen.filter(({ p }) => f(p));
                      return (
                        <div key={title} className={styles.reviewGroup}>
                          <div className={styles.groupHead}>
                            <h2 className={styles.groupTitle}>{title}</h2>
                            <button type="button" className={styles.edit} onClick={() => goStep(si)}>Modifica</button>
                          </div>
                          {rows.length === 0 && <p className={styles.small}>Nessuno: hai usato i gettoni per il resto.</p>}
                          <ul className={styles.contents}>
                            {rows.map(({ p, qty }) => (
                              <li key={p.id} className={styles.contentRow}>
                                {p.image && <span className={styles.contentThumb}><img src={p.image} alt="" width="600" height="720" loading="lazy" decoding="async" /></span>}
                                <div>
                                  <span className={styles.contentName}>{qty > 1 ? `${qty} × ` : ''}{p.name}</span>
                                  <span className={styles.contentDetail}>{p.detail}{p.producer ? ` · ${p.producer}` : ''}</span>
                                </div>
                                <span className={styles.contentTokens}><Coins n={Math.min(2, p.cost)} /> {tokens(qty * p.cost)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                    <div className={styles.totalRow}>
                      <span>{plural(sum.items, 'prodotto', 'prodotti')} nella cassetta</span>
                      <strong>{eur(BOXES.tokens.price)}</strong>
                    </div>
                  </div>
                )}
              </>
            )}

            {view === 'gift' && (
              <>
                <p className={ui.kicker}>Ultimo passo</p>
                <h1 className={styles.title}>È un <em>regalo?</em></h1>
                {gift.mode === 'recipient' && <div className={styles.noteInline}><GiftNote gift={gift} /></div>}
                <GiftStep gift={gift} onChange={changeGift} errors={giftErrors} />
              </>
            )}

            {error && <p className={styles.error} role="alert">{error}</p>}

            {view === 'done' && (
              <div className={styles.done}>
                <span className={styles.doneSeal} aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </span>
                <p className={ui.kicker}>{added.type === 'racale' ? `${BOXES.racale.name} · ${size.label}` : BOXES.tokens.name}</p>
                <h1 className={styles.title} role="status">
                  {added.preview ? <>Box pronta <em>(anteprima)</em></> : <>È nel tuo <em>carrello</em></>}
                </h1>
                <p className={styles.lead}>
                  {added.to ? `La spediamo a ${added.to}` : 'La spediamo'} {added.ship === 'appena pronta' ? 'appena pronta' : added.ship}
                  {added.to ? ', con il biglietto scritto a mano.' : ', chiusa con il nastro.'}
                  {' '}La prepariamo a mano a Racale.
                </p>
                {added.preview && (
                  <p className={styles.previewNote}>
                    Modalità anteprima: manca l’ID del prodotto-box Shopware
                    ({added.type === 'racale' ? (size.n === 2 ? 'VITE_XMAS_BOX_FIXED2_ID' : 'VITE_XMAS_BOX_FIXED_ID') : 'VITE_XMAS_BOX_TOKENS_ID'}),
                    quindi il carrello non è stato toccato.
                  </p>
                )}
                <div className={styles.doneActions}>
                  {!added.preview && <button type="button" className={ui.btnPrimary} onClick={openCart}>Vai al carrello</button>}
                  <button type="button" className={added.preview ? ui.btnPrimary : ui.btnOutline} onClick={startOver}>Componi un’altra box</button>
                  <Link to="/collections/all" className={styles.textLink}>Continua con gli acquisti</Link>
                </div>
              </div>
            )}
          </div>

          {bar && (
            <div className={styles.bar}>
              {bar.back && (
                <button type="button" className={styles.barBack} onClick={bar.back} aria-label="Passo precedente"><ArrowLeft /></button>
              )}
              <div className={styles.barInfo}>{bar.info}</div>
              <button type="button" className={`${ui.btnPrimary} ${styles.barBtn}`} onClick={bar.onClick} disabled={bar.disabled} aria-disabled={bar.disabled}>
                {bar.label}{bar.arrow && !bar.disabled && <span aria-hidden="true"> →</span>}
              </button>
            </div>
          )}
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
