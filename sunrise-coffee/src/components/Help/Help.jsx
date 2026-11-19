import { useState } from 'react';
import { Link } from 'react-router-dom';
import { COMPANY } from '../../data/company';
import { HELP_CATEGORIES, getArticlesInCategory, helpCategoryPath } from '../../data/assistenza';
import { Inline } from '../Assistenza/RichText';
import s from './Help.module.css';

/* Foto dei vasetti: SOLO l'ultima versione (etichetta verde scuro con logo CARO).
   Scontornate su bianco: vanno su fondo bianco (pannello .jars o .jarCard). */
const J = '/images/box-natale';
export const JARS = {
  lilliput:   { src: `${J}/sale-lilliput.webp`,   alt: 'Vasetto di Capperi di Racale al sale marino, calibro Lilliput, 75 g' },
  occhio:     { src: `${J}/sale-occhio.webp`,     alt: 'Vasetto di Capperi di Racale al sale marino, 150 g' },
  lacrimella: { src: `${J}/sale-lacrimella.webp`, alt: 'Vasetto di Capperi di Racale al sale marino, 250 g' },
  capperone:  { src: `${J}/sale-capperone.webp`,  alt: 'Vasetto di Capperone di Racale al sale marino, 250 g' },
  aceto:      { src: `${J}/aceto.webp`,           alt: 'Vasetto di Capperi di Racale in aceto di vino, 250 g' },
  foglie:     { src: `${J}/leaves.webp`,          alt: 'Vasetto di Foglie di cappero al sale marino, 50 g' },
  polvere:    { src: `${J}/powder.webp`,          alt: 'Vasetto di Polvere di cappero di Racale, 50 g' },
};

export const pad = (n) => String(n).padStart(2, '0');

export function Crumbs({ items }) {
  return (
    <nav aria-label="Percorso" className={s.crumbs}>
      <ol>
        <li><Link to="/">Home</Link></li>
        {items.map((it, i) => (
          <li key={it.path}>
            {i < items.length - 1
              ? <Link to={it.path}>{it.name}</Link>
              : <span aria-current="page">{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Tre (o due) vasetti affiancati su fondo bianco. */
export function JarsPanel({ jars = ['lilliput', 'occhio', 'aceto'], className = '' }) {
  return (
    <div className={`${s.jars} ${className}`}>
      {jars.map((k, i) => (
        <img key={k} src={JARS[k].src} alt={i === 1 ? JARS[k].alt : ''} loading="lazy" width="600" height="600" />
      ))}
    </div>
  );
}

/** Indice argomenti (colonna sinistra). */
export function TopicsNav({ current, anchors = false }) {
  return (
    <ol className={s.nav}>
      {HELP_CATEGORIES.map((c, i) => {
        const on = c.slug === current;
        const to = anchors ? `#${c.slug}` : helpCategoryPath(c);
        const inner = (
          <>
            <span>{pad(i + 1)}</span>
            {on && !anchors ? `→ ${c.title}` : c.title}
            {anchors && <span className={s.navCount}>{getArticlesInCategory(c.slug).length}</span>}
          </>
        );
        return (
          <li key={c.slug}>
            {anchors
              ? <a href={to}>{inner}</a>
              : <Link to={to} aria-current={on ? 'page' : undefined}>{inner}</Link>}
          </li>
        );
      })}
    </ol>
  );
}

/** Card verde "Non trovi la risposta?" (colonna destra). */
export function SideHelp({ title = 'Scrivici: risponde la famiglia, da Racale.', email = COMPANY.email }) {
  return (
    <div className={s.greenCard}>
      <span className={s.kicker}>Non trovi la risposta?</span>
      <span className={s.greenTitle}>{title}</span>
      <a href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer" className={s.btnLight}>WhatsApp →</a>
      <a href={`mailto:${email}`}>{email}</a>
    </div>
  );
}

/** Corpo di una risposta nello stile A: passaggi in griglia, note in verde. */
export function HelpRich({ body }) {
  return (
    <div className={s.rich}>
      {body.map((b, i) => {
        if (typeof b === 'string') return <p key={i}><Inline text={b} /></p>;
        if (b.ul) return <ul key={i}>{b.ul.map((t, j) => <li key={j}><Inline text={t} /></li>)}</ul>;
        if (b.ol) return <ol key={i} className={s.steps}>{b.ol.map((t, j) => <li key={j}><span><Inline text={t} /></span></li>)}</ol>;
        if (b.note) return <p key={i} className={s.note}><Inline text={b.note} /></p>;
        return null;
      })}
    </div>
  );
}

/**
 * Accordion: items = [{ id, q, sub?, body (node) }].
 * multi = più voci aperte insieme; numbered = numero monospace a sinistra.
 */
export function Accordion({ items, initial = null, multi = false, numbered = false }) {
  const [open, setOpen] = useState(() => (multi ? new Set(initial ? [initial] : []) : initial));
  const isOpen = (id) => (multi ? open.has(id) : open === id);
  const toggle = (id) => {
    if (multi) {
      const next = new Set(open);
      next.has(id) ? next.delete(id) : next.add(id);
      setOpen(next);
    } else {
      setOpen(open === id ? null : id);
    }
  };
  return (
    <div className={s.acc}>
      {items.map((it, i) => {
        const on = isOpen(it.id);
        return (
          <div key={it.id} id={it.anchor} className={s.accItem}>
            <button
              type="button"
              className={s.accBtn}
              onClick={() => toggle(it.id)}
              aria-expanded={on}
              aria-controls={`acc-${it.id}`}
            >
              {numbered && <span className={s.accNum}>{pad(i + 1)}</span>}
              <span className={s.accText}>
                <span className={s.accQ}>{it.q}</span>
                {it.sub && <span className={s.monoMuted}>{it.sub}</span>}
              </span>
              <span className={s.accIcon} aria-hidden="true">{on ? '−' : '+'}</span>
            </button>
            {on && (
              <div id={`acc-${it.id}`} className={`${s.accPanel} ${numbered ? s.accPanelIndented : ''}`}>
                {it.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Band({ words }) {
  const row = [...words, ...words];
  return (
    <div className={s.band} aria-hidden="true">
      {row.map((w, i) => <span key={i}>{w}{i < row.length - 1 ? '  ✦' : ''}</span>)}
    </div>
  );
}

/** 50/50: vasetti + "Parla con noi". */
export function ContactSplit({ kicker = '• PARLA CON NOI', title, text, jars }) {
  return (
    <section className={`${s.split} ${s.border}`}>
      <div className={s.splitMedia}><JarsPanel jars={jars} /></div>
      <div className={s.splitText}>
        <span className={s.mono}>{kicker}</span>
        <h2 className={s.h2}>{title}</h2>
        {text && <p className={s.lead}>{text}</p>}
        <div className={s.ruleGrid} style={{ '--cols': 2, borderBottom: 'none' }}>
          <a href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer" className={s.ruleCell}>
            <span className={s.mono}>WHATSAPP</span>
            <span className={s.cellTitle}>{COMPANY.whatsapp}</span>
            <span className={s.monoMuted}>di solito rispondiamo in giornata</span>
          </a>
          <a href={`mailto:${COMPANY.email}`} className={s.ruleCell}>
            <span className={s.mono}>EMAIL</span>
            <span className={s.cellTitle}>{COMPANY.email}</span>
            <span className={s.monoMuted}>per ordini: {COMPANY.emailOrders}</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default s;
