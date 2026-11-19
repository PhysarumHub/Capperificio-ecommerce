import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CALIBRI_INFO } from '../../data/calibriGuide';
import { Inline } from '../Assistenza/RichText';
import styles from './Guide.module.css';

/* ── Icone dei passi (stroke, ereditano il colore) ─────────────────── */
const ICONS = {
  jar: <><rect x="11" y="13" width="18" height="21" rx="3" /><rect x="10" y="7" width="20" height="6" rx="2" /><path d="M15 21h10M15 26h6" /></>,
  tap: <><path d="M8 10h14v5H8zM22 12h6a4 4 0 0 1 4 4v2" /><path d="M32 23c0 2-1.5 3.5-3 3.5S26 25 26 23s3-5 3-5 3 3 3 5Z" /><path d="M6 30h20l-2 4H8z" /></>,
  bowl: <><path d="M5 18h30c0 8-6.7 14-15 14S5 26 5 18Z" /><circle cx="20" cy="9" r="5" /><path d="M20 6.5V9l1.8 1.2" /></>,
  towel: <><path d="M8 12h24v18H8z" /><path d="M8 18h24M8 24h24" /><path d="M14 8v4M26 8v4" /></>,
  bud: <><path d="M20 34V20" /><path d="M20 20c-5 0-7-4-7-8 3 0 7 2 7 8Zm0 0c5 0 7-4 7-8-3 0-7 2-7 8Z" /><circle cx="20" cy="15" r="4" /></>,
  flower: <><circle cx="20" cy="18" r="3" /><path d="M20 15c-2-6 2-9 0-9s2 3 0 9M23 18c6-2 9 2 9 0s-3 2-9 0M20 21c2 6-2 9 0 9s-2-3 0-9M17 18c-6 2-9-2-9 0s3-2 9 0" /><path d="M20 21v13" /></>,
  fruit: <><path d="M20 6v6" /><path d="M20 12c-5 0-7 6-7 11s3 11 7 11 7-6 7-11-2-11-7-11Z" /><path d="M18 20h.01M22 24h.01M18 28h.01" /></>,
  pan: <><circle cx="17" cy="20" r="10" /><path d="M27 20h9" /><path d="M13 18c1-2 3-3 5-3" /></>,
  roll: <><rect x="8" y="14" width="24" height="12" rx="6" /><path d="M14 14v12M20 14v12M26 14v12" /></>,
  knife: <><path d="M8 30 28 10c3 3 3 7 0 10L14 30Z" /><path d="M8 30h6" /></>,
};

function StepIcon({ name }) {
  return (
    <svg className={styles.stepIcon} width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] || ICONS.jar}
    </svg>
  );
}

function Head({ kicker, title, text }) {
  return (
    <div className={styles.blockHead}>
      {kicker && <span className={styles.kicker}>{kicker}</span>}
      {title && <h2 className={styles.h2}>{title}</h2>}
      {text && <p className={styles.blockText}>{text}</p>}
    </div>
  );
}

/* ── Blocchi ───────────────────────────────────────────────────────── */

function Brief({ b }) {
  return (
    <div className={`${styles.ruled} ${styles.brief}`} style={{ '--cols': b.items.length }}>
      {b.items.map((it, i) => (
        <div key={it.big}>
          <span className={styles.kicker}>In breve · {String(i + 1).padStart(2, '0')}</span>
          <span className={styles.briefBig}>{it.big}</span>
          <span className={styles.briefSmall}>{it.small}</span>
        </div>
      ))}
    </div>
  );
}

function Steps({ b }) {
  return (
    <>
      <Head kicker={b.kicker} title={b.title} />
      <ol className={styles.ruled} style={{ '--cols': b.steps.length }}>
        {b.steps.map((s, i) => (
          <li key={s.title}>
            <StepIcon name={s.icon} />
            <span className={styles.kicker}>Passo {String(i + 1).padStart(2, '0')}</span>
            <span className={styles.stepTitle}>{s.title}</span>
            <span className={styles.stepText}>{s.text}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

// Diametro medio di ogni calibro → px, in scala tra loro
const CAL_PX = { lilliput: 30, 'occhio di pernice': 48, lacrimella: 60, capperone: 81 };
const CAL_MODE = {
  soak: { bars: [22, 45, 68, 92], levels: ['Ammollo breve', 'Ammollo medio', 'Ammollo medio-lungo', 'Ammollo lungo'] },
  flavor: { bars: [95, 75, 58, 45], levels: ['Aroma concentrato · a crudo', 'Equilibrato · tutti i giorni', 'Carnoso · in cottura', 'Intenso · sughi lunghi'] },
};

function Calibri({ b }) {
  const mode = CAL_MODE[b.mode] || CAL_MODE.soak;
  return (
    <div className={styles.panel}>
      <div className={styles.block} style={{ gap: 28 }}>
        <Head kicker={b.kicker} title={b.title} text={b.text} />
        <div className={`${styles.ruled} ${styles.calGrid}`} style={{ '--cols': 4 }}>
          {CALIBRI_INFO.map((c, i) => (
            <div key={c.key}>
              <div className={styles.calStage}>
                <div className={styles.calDot} style={{ '--d': `${CAL_PX[c.key]}px` }} />
              </div>
              <span className={styles.calName}>{c.name}</span>
              <span className={`${styles.mono} ${styles.calMeta}`}>{c.diameter}</span>
              <div className={styles.bar} role="img" aria-label={mode.levels[i]}>
                <div style={{ width: `${mode.bars[i]}%` }} />
              </div>
              <span className={styles.calLevel}>{mode.levels[i]}</span>
            </div>
          ))}
        </div>
        {b.note && <p className={styles.mono} style={{ margin: 0 }}>{b.note}</p>}
      </div>
    </div>
  );
}

function Split({ b }) {
  return (
    <div className={styles.split}>
      <div className={styles.splitText}>
        <Head kicker={b.kicker} title={b.title} />
        <div className={styles.rich} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {b.paras.map((p) => <p key={p.slice(0, 24)}><Inline text={p} /></p>)}
        </div>
        {b.link && <Link to={b.link.to} className={styles.moreLink}>{b.link.label} →</Link>}
      </div>
      <div className={styles.photos}>
        {b.images.map((img) => (
          <figure key={img.src}>
            <img src={img.src} alt={img.alt} loading="lazy" decoding="async" width="600" height="800" />
            <figcaption className={styles.mono}>{img.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function Compare({ b }) {
  return (
    <>
      <Head kicker={b.kicker} title={b.title} />
      <div className={styles.compare}>
        {b.cols.map((col) => (
          <div key={col.title} className={styles.compareCol}>
            <div className={styles.compareTop}>
              <img src={col.image} alt="" loading="lazy" width="88" height="104" />
              <span className={styles.compareTitle}>{col.title}</span>
            </div>
            <dl className={styles.compareRows}>
              {col.rows.map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}

function Fact({ b }) {
  return (
    <aside className={styles.fact}>
      <span className={styles.factBig}>{b.big}</span>
      <div className={styles.factBody}>
        <span className={styles.label}>Lo sapevi?</span>
        <p className={styles.factText}>{b.text}</p>
      </div>
    </aside>
  );
}

function Cards({ b }) {
  const yes = b.tone === 'yes';
  return (
    <>
      <Head kicker={b.kicker} title={b.title} />
      <div className={styles.cards}>
        {b.cards.map((c) => (
          <div key={c.title} className={`${styles.card} ${yes ? styles.cardYes : ''}`}>
            <span className={styles.cardMark} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                {yes ? <path d="M5 12.5 10 17 19 7" /> : <path d="M6 6l12 12M18 6 6 18" />}
              </svg>
            </span>
            <span className={styles.cardTitle}>{c.title}</span>
            <p className={styles.cardText}><Inline text={c.text} /></p>
          </div>
        ))}
      </div>
    </>
  );
}

function Faq({ b }) {
  const [open, setOpen] = useState(0);
  return (
    <>
      <Head kicker={b.kicker} title={b.title} />
      <div className={styles.faq}>
        {b.items.map((it, i) => {
          const isOpen = open === i;
          const id = `${b.id}-${i}`;
          return (
            <div key={it.q} className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}>
              <h3 style={{ margin: 0 }}>
                <button
                  type="button"
                  className={styles.faqBtn}
                  aria-expanded={isOpen}
                  aria-controls={`${id}-p`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span>{it.q}</span>
                  <span className={styles.faqIcon} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </span>
                </button>
              </h3>
              <div className={styles.faqPanel} id={`${id}-p`} role="region">
                <div><p><Inline text={it.a} /></p></div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

const RENDER = { brief: Brief, steps: Steps, calibri: Calibri, split: Split, compare: Compare, fact: Fact, cards: Cards, faq: Faq };

/** Un blocco della guida, con il suo id per l'indice. */
export default function GuideBlock({ block }) {
  const Comp = RENDER[block.type];
  if (!Comp) return null;
  return (
    <section id={block.id} className={styles.block} data-toc={block.toc ? '' : undefined}>
      <Comp b={block} />
    </section>
  );
}
