import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { COMPANY } from '../data/company';
import {
  HELP_ARTICLES, HELP_CATEGORIES, HELP_FACTS, getArticlesInCategory, helpArticlePath, helpCategoryPath,
} from '../data/assistenza';
import { blocksToPlain, plainText } from '../components/Assistenza/RichText';
import s, { Accordion, Band, Crumbs, HelpRich, JARS, SideHelp, TopicsNav, pad } from '../components/Help/Help';

// Le domande arrivano dal centro assistenza (fonte unica): qui tutte in una pagina.
const KICKERS = {
  'scegliere-i-capperi': 'PRIMA DI COMPRARE',
  'ordini-e-pagamenti': 'QUANDO ORDINI',
  spedizioni: 'DOPO L’ORDINE',
  'resi-e-garanzia': 'SE QUALCOSA NON VA',
  'conservazione-e-uso': 'IN CUCINA',
  'regali-e-natale': 'PER QUALCUN ALTRO',
  'ristoranti-e-rivenditori': 'PER I PROFESSIONISTI',
};

const FAQ_JSONLD = {
  '@type': 'FAQPage',
  mainEntity: HELP_ARTICLES.map((a) => ({
    '@type': 'Question',
    name: a.q,
    acceptedAnswer: { '@type': 'Answer', text: blocksToPlain(a.body) },
  })),
};

const normalize = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const INDEX = Object.fromEntries(HELP_ARTICLES.map((a) => [a.slug, normalize(`${a.q} ${plainText(a.short)} ${blocksToPlain(a.body)}`)]));

export default function FAQPage() {
  useSEO({
    title: 'Domande frequenti',
    description: `Calibri, conservazione, spedizioni, resi e pagamenti: tutte le risposte alle domande più comuni su ${COMPANY.brand}.`,
    path: '/faq',
    jsonLd: FAQ_JSONLD,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Centro assistenza', path: '/assistenza' },
      { name: 'Domande frequenti', path: '/faq' },
    ],
  });

  const [query, setQuery] = useState('');
  const words = normalize(query).split(/\s+/).filter((w) => w.length > 2);

  const groups = useMemo(() => HELP_CATEGORIES.map((c, gi) => ({
    cat: c,
    n: pad(gi + 1),
    items: getArticlesInCategory(c.slug)
      .filter((a) => !words.length || words.every((w) => INDEX[a.slug].includes(w)))
      .map((a) => ({
        id: a.slug,
        q: a.q,
        body: (
          <>
            <HelpRich body={a.body} />
            <Link to={helpArticlePath(a)} className={s.link} style={{ fontSize: 14 }}>Apri la risposta completa →</Link>
          </>
        ),
      })),
  })).filter((g) => g.items.length), [words.join(' ')]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstId = HELP_ARTICLES[0]?.slug;

  return (
    <div className={s.page}>
      <Crumbs items={[{ name: 'Centro assistenza', path: '/assistenza' }, { name: 'Domande frequenti', path: '/faq' }]} />

      <div className={s.shell}>
        <aside className={s.left} aria-label="Argomenti">
          <span className={s.kicker}>Argomenti</span>
          <TopicsNav anchors />
          <label htmlFor="faq-search" className={s.monoMuted} style={{ fontSize: 12, paddingTop: 12 }}>Cerca tra le domande</label>
          <input
            id="faq-search"
            type="search"
            className={s.input}
            style={{ height: 46, fontSize: 15, borderColor: 'rgba(84,112,84,.5)' }}
            placeholder="es. fattura"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </aside>

        <main className={s.center}>
          <div className={s.head}>
            <span className={s.kicker}>Domande frequenti</span>
            <h1 className={s.h1}>Le domande che ci fate più spesso</h1>
            <p className={s.lead} style={{ fontSize: 19, maxWidth: 680 }}>
              Le risposte, divise in sette argomenti. Ognuna si apre qui e ha la sua pagina completa nel centro assistenza.
            </p>
          </div>

          {groups.length === 0 && (
            <p className={s.lead}>Nessuna domanda trovata. <a href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer" className={s.link}>Scrivici</a> e ti rispondiamo noi.</p>
          )}

          {groups.map((g) => (
            <section key={g.cat.slug} id={g.cat.slug} style={{ display: 'flex', flexDirection: 'column', gap: 18, scrollMarginTop: 100 }}>
              <div className={s.sectionHead}>
                <div className={s.sectionHeadText}>
                  <span className={s.mono}>{g.n} — {KICKERS[g.cat.slug] || g.cat.sub.toUpperCase()}</span>
                  <h2 className={s.h3}>{g.cat.title}</h2>
                </div>
                <Link to={helpCategoryPath(g.cat)} className={s.link} style={{ fontSize: 14 }}>Vai all’argomento →</Link>
              </div>
              <Accordion items={g.items} initial={firstId} multi />
            </section>
          ))}
        </main>

        <aside className={s.right} aria-label="Aiuto">
          <SideHelp />
          <div className={s.factList}>
            <div className={s.fact}>
              <span className={s.mono}>SPEDIZIONE GRATUITA</span>
              <span className={s.factValue}>da €{HELP_FACTS.freeShippingFrom}</span>
            </div>
            <div className={s.fact}>
              <span className={s.mono}>CONSEGNA IN ITALIA</span>
              <span className={s.factValue}>{HELP_FACTS.deliveryIT}</span>
              <span className={s.monoMuted} style={{ fontSize: 12 }}>dopo {HELP_FACTS.prepDays} di preparazione</span>
            </div>
            <div className={s.fact}>
              <span className={s.mono}>RESO</span>
              <span className={s.factValue}>{HELP_FACTS.withdrawalDays} giorni</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className={s.kicker}>Le guide</span>
            <Link to="/guide/come-dissalare-i-capperi" className={s.jarCard} style={{ minHeight: 160 }}>
              <span className={s.jarCardText} style={{ padding: 18 }}>
                <span className={s.cellTitleItalic} style={{ fontSize: 22 }}>Come dissalare i capperi</span>
                <span className={s.link} style={{ fontSize: 13 }}>Leggi →</span>
              </span>
              <img src={JARS.occhio.src} alt="" loading="lazy" width="300" height="300" style={{ maxHeight: 160 }} />
            </Link>
            <div className={s.sideLinks}>
              <Link to="/guide/quale-calibro-scegliere">Quale calibro scegliere →</Link>
              <Link to="/guide/come-conservare-i-capperi">Come conservarli →</Link>
            </div>
          </div>
        </aside>
      </div>

      <Band words={['Scegliere', 'Ordinare', 'Ricevere', 'Conservare', 'Regalare']} />
    </div>
  );
}
