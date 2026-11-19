import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import {
  HELP_ARTICLES, HELP_CATEGORIES, HELP_CHIPS, HELP_TOP, HELP_FACTS,
  getArticlesInCategory, getHelpArticle, helpArticlePath, helpCategoryPath,
} from '../data/assistenza';
import { GUIDES } from '../data/guide';
import { blocksToPlain, plainText } from '../components/Assistenza/RichText';
import s, { Accordion, Band, ContactSplit, pad } from '../components/Help/Help';

const QUICK = [
  {
    to: '/assistenza/dove-e-il-mio-ordine',
    kicker: '01 — HO GIÀ ORDINATO',
    title: 'Dov’è il mio ordine?',
    text: 'Numero d’ordine ed email: ti diciamo a che punto è e ti diamo il tracciamento.',
    go: 'Controlla lo stato →',
  },
  {
    to: '/assistenza/qualcosa-non-va',
    kicker: '02 — C’È UN PROBLEMA',
    title: 'Qualcosa non va',
    text: 'Vasetto rotto, prodotto sbagliato, pacco in ritardo: dicci cosa è successo e rimediamo.',
    go: 'Segnalalo →',
  },
  {
    to: '/assistenza/primo-ordine',
    kicker: '03 — NON HO ANCORA ORDINATO',
    title: 'Il tuo primo ordine',
    text: 'Che calibro prendere, come pagare, quando arriva. Tutto in una pagina.',
    go: 'Inizia da qui →',
  },
];

const normalize = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

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
      score: words.reduce((sc, w) => sc + (e.q.includes(w) ? 3 : e.text.includes(w) ? 1 : -10), 0),
    }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((e) => e.article);
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

  const top = HELP_TOP.map((slug) => getHelpArticle(slug)).filter(Boolean).map((a) => ({
    id: a.slug,
    q: a.q,
    body: (
      <>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: '#4E6B4E' }}>{plainText(a.short)}</p>
        <Link to={helpArticlePath(a)} className={s.link}>Leggi la risposta completa →</Link>
      </>
    ),
  }));

  return (
    <div className={s.page}>
      {/* Domanda + ricerca */}
      <section className={s.heroCenter}>
        <span className={s.kicker}>Centro assistenza</span>
        <h1 className={s.h1} style={{ fontSize: 'clamp(48px, 7vw, 96px)' }}>Come possiamo aiutarti?</h1>
        <p className={s.lead}>
          Ordini, spedizioni, resi e tutto quello che c’è da sapere sui capperi di Racale. Rispondiamo noi, dal capperificio.
        </p>
        <div className={s.search} role="search">
          <label htmlFor="help-search" className="sr-only">Cerca nel centro assistenza</label>
          <input
            id="help-search"
            type="search"
            className={s.input}
            placeholder="Scrivi la tua domanda: reso, calibro, spedizione…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {showResults && (
            <ul className={s.results} aria-live="polite">
              {results.length ? results.map((a) => (
                <li key={a.slug}>
                  <Link to={helpArticlePath(a)}>
                    {a.q}
                    <small>{plainText(a.short)}</small>
                  </Link>
                </li>
              )) : (
                <li className={s.resultsEmpty}>
                  Nessuna risposta trovata. <Link to="/contatti">Scrivici</Link> e ti rispondiamo noi.
                </li>
              )}
            </ul>
          )}
        </div>
        <div className={s.chips}>
          <span className={s.monoMuted} style={{ fontSize: 12, marginRight: 4 }}>Cercati spesso:</span>
          {HELP_CHIPS.map((slug) => {
            const a = getHelpArticle(slug);
            return a ? <Link key={slug} to={helpArticlePath(a)} className={s.pill}>{a.q}</Link> : null;
          })}
        </div>
      </section>

      {/* Tre azioni rapide */}
      <nav aria-label="Azioni rapide" className={s.quick}>
        {QUICK.map((q) => (
          <Link key={q.to} to={q.to}>
            <span className={s.mono}>{q.kicker}</span>
            <span className={s.cellTitleItalic}>{q.title}</span>
            <span className={s.monoMuted}>{q.text}</span>
            <span className={s.quickGo}>{q.go}</span>
          </Link>
        ))}
      </nav>

      {/* Argomenti */}
      <section className={s.section} style={{ paddingBottom: 0 }}>
        <div className={s.sectionHead}>
          <div className={s.sectionHeadText}>
            <span className={s.mono}>• PER ARGOMENTO</span>
            <h2 className={s.h2}>Dal vasetto alla porta di casa</h2>
          </div>
          <Link to="/faq" className={s.link}>Tutte le domande frequenti →</Link>
        </div>
        <div className={s.topics}>
          {HELP_CATEGORIES.map((c, i) => (
            <Link key={c.slug} to={helpCategoryPath(c)} className={s.topic}>
              <span className={s.topicTop}>
                <span>{pad(i + 1)}</span>
                <span>{getArticlesInCategory(c.slug).length} risposte</span>
              </span>
              <span className={s.cellTitleItalic} style={{ fontSize: 32 }}>{c.title}</span>
              <span className={s.monoMuted}>{c.sub}</span>
              <span className={s.topicArrow} aria-hidden="true">→</span>
            </Link>
          ))}
          <Link to="/guide" className={`${s.topic} ${s.topicDark}`}>
            <span className={s.topicTop}>
              <span>{pad(HELP_CATEGORIES.length + 1)}</span>
              <span>{GUIDES.length} guide</span>
            </span>
            <span className={s.cellTitleItalic} style={{ fontSize: 32 }}>Le guide</span>
            <span className={s.monoMuted}>Dissalare, conservare, scegliere il calibro: spiegati per bene</span>
            <span className={s.topicArrow} aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Le più lette */}
      <section className={s.section} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 56, paddingTop: 88, paddingBottom: 88 }}>
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span className={s.mono}>• LE PIÙ CHIESTE</span>
          <h2 className={s.h2}>Le cinque domande che ci fate di più</h2>
          <p className={s.lead} style={{ maxWidth: 420, fontSize: 17 }}>
            Se la tua è tra queste, la risposta è qui sotto. Altrimenti cercala in alto o scrivici: rispondiamo noi, non un risponditore automatico.
          </p>
        </div>
        <div style={{ flex: '999 1 560px', minWidth: 0 }}>
          <Accordion items={top} initial={top[0]?.id} numbered />
        </div>
      </section>

      <Band words={[
        `Spedizione gratuita sopra €${HELP_FACTS.freeShippingFrom}`,
        `Partenza in ${HELP_FACTS.prepDays}`,
        `Resi entro ${HELP_FACTS.withdrawalDays} giorni`,
        'Pagamenti sicuri con Stripe',
      ]} />

      <ContactSplit
        kicker="04 — PARLA CON NOI"
        title="Dall’altra parte c’è la famiglia che fa i capperi"
        text="Nessun call center: le risposte arrivano da Racale, da chi i capperi li raccoglie e li sala. Scegli tu come scriverci."
        jars={['lilliput', 'occhio', 'aceto']}
      />
    </div>
  );
}
