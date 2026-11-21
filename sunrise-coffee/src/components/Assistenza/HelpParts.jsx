import { Link, NavLink } from 'react-router-dom';
import { COMPANY } from '../../data/company';
import styles from './Assistenza.module.css';

const TABS = [
  { to: '/assistenza', label: 'Centro assistenza', end: true },
  { to: '/assistenza/dove-e-il-mio-ordine', label: 'Dov’è il mio ordine' },
  { to: '/assistenza/primo-ordine', label: 'Il primo ordine' },
  { to: '/spedizioni-e-resi', label: 'Spedizioni e resi' },
  { to: '/contatti', label: 'Scrivici' },
];

/** Riga di schede comune a tutte le pagine dell’assistenza. */
export function HelpTabs() {
  return (
    <nav className={styles.tabs} aria-label="Sezioni assistenza">
      {TABS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Briciole visibili: [{ name, path }], l’ultima è la pagina corrente. */
export function HelpBreadcrumb({ items }) {
  return (
    <nav aria-label="Percorso" className={styles.crumbs}>
      <ol>
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

/** Testata delle pagine assistenza: kicker, titolo corsivo, intro. */
export function HelpHero({ kicker, title, intro, crumbs, children }) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        {crumbs && <HelpBreadcrumb items={crumbs} />}
        <span className={styles.kicker}><span className={styles.dot} />{kicker}</span>
        <h1 className={styles.title}>{title}</h1>
        {intro && <p className={styles.intro}>{intro}</p>}
        {children}
      </div>
    </header>
  );
}

/** Banda verde finale “Non hai trovato la risposta?”. */
export function HelpCta({ title = 'Non hai trovato la risposta?' }) {
  return (
    <section className={styles.ctaBand}>
      <div className={styles.ctaInner}>
        <p className={styles.ctaTitle}>{title}</p>
        <p className={styles.ctaText}>
          Ti risponde chi i capperi li raccoglie, da Racale. Se ci scrivi per un ordine, indica
          il numero d’ordine: facciamo prima.
        </p>
        <div className={styles.ctaActions}>
          <a href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
            WhatsApp · {COMPANY.whatsapp}
          </a>
          <a href={`mailto:${COMPANY.email}`} className={styles.ctaBtnGhost}>{COMPANY.email}</a>
        </div>
      </div>
    </section>
  );
}

export function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
