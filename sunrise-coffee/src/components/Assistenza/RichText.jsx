import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { COMPANY } from '../../data/company';
import { HELP_FACTS } from '../../data/assistenza';
import styles from './Assistenza.module.css';

const VARS = {
  email: COMPANY.email,
  emailOrdini: COMPANY.emailOrders,
  emailB2B: COMPANY.emailB2B,
  whatsapp: COMPANY.whatsapp,
  soglia: `€ ${HELP_FACTS.freeShippingFrom}`,
  prep: HELP_FACTS.prepDays,
  deliveryIT: HELP_FACTS.deliveryIT,
  deliveryEU: HELP_FACTS.deliveryEU,
};

const EMAILS = new Set([COMPANY.email, COMPANY.emailOrders, COMPANY.emailB2B]);

/** Sostituisce i segnaposto {nome} con i dati aziendali. */
export function fillVars(text) {
  return text.replace(/\{(\w+)\}/g, (m, k) => VARS[k] ?? m);
}

/** Versione testuale (senza markup) — per meta description e JSON-LD. */
export function plainText(text) {
  return fillVars(text).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[(.+?)\]\((.+?)\)/g, '$1');
}

export function blocksToPlain(body) {
  return body.map((b) => {
    if (typeof b === 'string') return plainText(b);
    if (b.ul || b.ol) return (b.ul || b.ol).map(plainText).join(' ');
    if (b.note) return plainText(b.note);
    return '';
  }).join(' ');
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TOKEN = new RegExp(
  `(\\*\\*.+?\\*\\*|\\[.+?\\]\\(.+?\\)|${[...EMAILS, COMPANY.whatsapp].map(esc).join('|')})`,
  'g',
);

/** Testo con **grassetto**, [link](/percorso), email e WhatsApp cliccabili. */
export function Inline({ text }) {
  const parts = fillVars(text).split(TOKEN);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[(.+?)\]\((.+?)\)$/);
    if (link) {
      const [, label, href] = link;
      return href.startsWith('/')
        ? <Link key={i} to={href}>{label}</Link>
        : <a key={i} href={href} target="_blank" rel="noopener noreferrer">{label}</a>;
    }
    if (EMAILS.has(part)) return <a key={i} href={`mailto:${part}`}>{part}</a>;
    if (part === COMPANY.whatsapp) {
      return <a key={i} href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer">{part}</a>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Corpo di una risposta: paragrafi, elenchi, passaggi, note. */
export default function RichText({ body }) {
  return (
    <div className={styles.rich}>
      {body.map((b, i) => {
        if (typeof b === 'string') return <p key={i}><Inline text={b} /></p>;
        if (b.ul) return <ul key={i}>{b.ul.map((t, j) => <li key={j}><Inline text={t} /></li>)}</ul>;
        if (b.ol) return <ol key={i} className={styles.steps}>{b.ol.map((t, j) => <li key={j}><Inline text={t} /></li>)}</ol>;
        if (b.note) return <p key={i} className={styles.note}><Inline text={b.note} /></p>;
        return null;
      })}
    </div>
  );
}
