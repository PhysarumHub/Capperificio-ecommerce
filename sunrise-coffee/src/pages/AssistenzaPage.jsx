import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import {
  HELP_ARTICLES, HELP_CATEGORIES, HELP_CHIPS, HELP_TOP, HELP_FACTS,
  getArticlesInCategory, getHelpArticle, helpArticlePath, helpCategoryPath,
} from '../data/assistenza';
import { blocksToPlain, plainText } from '../components/Assistenza/RichText';
import { HelpCta, HelpHero, HelpTabs, Chevron } from '../components/Assistenza/HelpParts';
import styles from '../components/Assistenza/Assistenza.module.css';

const ENTRIES = [
  {
    to: '/assistenza/dove-e-il-mio-ordine',
    title: 'Dov’è il mio ordine?',
    text: 'Con numero d’ordine ed email vedi a che punto è e il codice di tracciamento.',
  },
  {
    to: '/assistenza/qualcosa-non-va',
    title: 'Qualcosa non va',
    text: 'Pacco rotto, prodotto sbagliato, pagamento bloccato: due domande e ti diciamo cosa fare.',
  },
  {
    to: '/assistenza/primo-ordine',
    title: 'È il tuo primo ordine?',
    text: 'Cosa succede dopo il pagamento, passo per passo, fino alla tua dispensa.',
  },
];

const GUARANTEES = [
  { num: `€ ${HELP_FACTS.freeShippingFrom}`, text: 'la soglia per la spedizione gratuita in Italia' },
  { num: `${HELP_FACTS.withdrawalDays} gg`, text: 'per recedere, senza spiegare il motivo, su confezioni sigillate' },
  { num: `${HELP_FACTS.warrantyYears} anni`, text: 'di garanzia legale: se un prodotto è difettoso, rimediamo noi' },
];

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const SEARCH_INDEX = HELP_ARTICLES.map((a) => ({
  article: a,
  q: normalize(a.q),
  text: normalize(`${a.q} ${plainText(a.short)} ${blocksToPlain(a.body)}`),
}));

function search(query) {
  const words = normalize(query).split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return [];
  return SEARCH_INDEX
    .map((e) => ({
      ...e,
      score: words.reduce((s, w) => s + (e.q.includes(w) ? 3 : e.text.includes(w) ? 1 : -10), 0),
    }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((e) => e.article);
}

function SearchIcon() {
  return (
    <svg className={styles.searchIcon} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export default function AssistenzaPage() {
  useSEO({
    title: 'Centro assistenza',
    description: 'Ordini, spedizioni, resi, conservazione e scelta dei calibri: le risposte del Capperificio di Racale, e come scriverci.',
    path: '/assistenza',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Centro assistenza', path: '/assistenza' },
    ],
  });

  const [query, setQuery] = useState('');
  const results = useMemo(() => search(query), [query]);
  const showResults = query.trim().length > 2;

  return (
    <div className={styles.page}>
      <HelpHero
        kicker="Centro assistenza"
        title="Come possiamo aiutarti?"
        intro="Ordini, spedizioni, resi, e come scegliere e conservare i capperi. Se non trovi la risposta, ti scriviamo noi da Racale."
      >
        <div className={styles.search} role="search">
          <SearchIcon />
          <label htmlFor="help-search" className="sr-only">Cerca nel centro assistenza</label>
          <input
            id="help-search"
            type="search"
            className={styles.searchInput}
            placeholder="Cerca: reso, dissalare, spedizione…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {showResults && (
            <ul className={styles.results} aria-live="polite">
              {results.length ? results.map((a) => (
                <li key={a.slug}>
                  <Link to={helpArticlePath(a)}>
                    {a.q}
                    <small>{plainText(a.short)}</small>
                  </Link>
                </li>
              )) : (
                <li className={styles.resultsEmpty}>
                  Nessuna risposta trovata. <Link to="/contatti">Scrivici</Link> e ti rispondiamo noi.
                </li>
              )}
            </ul>
          )}
        </div>
        <div className={styles.chipsRow}>
          <span>Spesso ci chiedete:</span>
          {HELP_CHIPS.map((slug) => {
            const a = getHelpArticle(slug);
            return <Link key={slug} to={helpArticlePath(a)} className={styles.chip}>{a.q}</Link>;
          })}
        </div>
      </HelpHero>

      <HelpTabs />

      <div className={styles.wrap}>
        <section className={styles.section}>
          <div className={styles.entries}>
            {ENTRIES.map((e, i) => (
              <Link key={e.to} to={e.to} className={styles.entry}>
                <span className={styles.entryNum}>0{i + 1}</span>
                <span className={styles.entryTitle}>{e.title}</span>
                <span className={styles.entryText}>{e.text}</span>
                <span className={styles.entryGo}>Inizia <Chevron /></span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.label}><span className={styles.dot} />Scegli un argomento</p>
          <div className={styles.topics}>
            {HELP_CATEGORIES.map((c, i) => (
              <Link key={c.slug} to={helpCategoryPath(c)} className={styles.topic}>
                <span className={styles.topicNum}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.topicTitle}>{c.title}</span>
                <span className={styles.topicSub}>{c.sub}</span>
                <span className={styles.topicCount}>{getArticlesInCategory(c.slug).length} risposte</span>
              </Link>
            ))}
            <Link to="/contatti" className={styles.topic}>
              <span className={styles.topicNum}>{String(HELP_CATEGORIES.length + 1).padStart(2, '0')}</span>
              <span className={styles.topicTitle}>Altro</span>
              <span className={styles.topicSub}>Raccontaci cosa ti serve: ti rispondiamo dal capperificio.</span>
              <span className={styles.topicCount}>Scrivici</span>
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Le domande più frequenti</h2>
          <ul className={styles.qlist}>
            {HELP_TOP.map((slug) => {
              const a = getHelpArticle(slug);
              return (
                <li key={slug}>
                  <Link to={helpArticlePath(a)} className={styles.qlink}>
                    <span className={styles.qtext}>
                      {a.q}
                      <span className={styles.qshort}>{plainText(a.short)}</span>
                    </span>
                    <Chevron />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link to="/faq" className={styles.moreLink}>Tutte le domande in una pagina <Chevron /></Link>
        </section>

        <section className={styles.section}>
          <p className={styles.label}><span className={styles.dot} />Le nostre garanzie</p>
          <div className={styles.stats}>
            {GUARANTEES.map((g) => (
              <div key={g.num} className={styles.stat}>
                <div className={styles.statNum}>{g.num}</div>
                <p className={styles.statText}>{g.text}</p>
              </div>
            ))}
          </div>
          <Link to="/spedizioni-e-resi" className={styles.moreLink}>Spedizioni e resi nel dettaglio <Chevron /></Link>
        </section>
      </div>

      <HelpCta />
    </div>
  );
}
