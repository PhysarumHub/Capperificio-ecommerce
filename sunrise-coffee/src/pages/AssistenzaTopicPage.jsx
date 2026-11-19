import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import {
  HELP_CATEGORIES, HELP_FACTS, getArticlesInCategory, getHelpArticle, getHelpCategory,
  helpArticlePath, helpCategoryPath,
} from '../data/assistenza';
import { blocksToPlain, plainText } from '../components/Assistenza/RichText';
import { COMPANY } from '../data/company';
import { getGuide, guidePath } from '../data/guide';
import NotFoundPage from './NotFoundPage';
import s, { Accordion, Crumbs, HelpRich, JARS, SideHelp, TopicsNav, pad } from '../components/Help/Help';

const HUB = { name: 'Centro assistenza', path: '/assistenza' };
const F = HELP_FACTS;

// Numeri chiave mostrati in testa ad alcuni argomenti.
const STATS = {
  spedizioni: [
    { k: 'GRATUITA DA', v: `€${F.freeShippingFrom}`, t: 'in Italia; sotto, il costo è nel carrello' },
    { k: 'PARTENZA', v: '1–2 gg', t: 'lavorativi per preparare il pacco' },
    { k: 'CONSEGNA', v: '2–5 gg', t: `in Italia · ${F.deliveryEU} nel resto d’Europa` },
  ],
  'resi-e-garanzia': [
    { k: 'RECESSO', v: `${F.withdrawalDays} gg`, t: 'dalla consegna, confezioni sigillate' },
    { k: 'PACCO ROVINATO', v: `${F.damageReportDays} gg`, t: 'per mandarci le foto: rimediamo noi' },
    { k: 'GARANZIA LEGALE', v: `${F.warrantyYears} anni`, t: `difetti da segnalare entro ${F.defectReportMonths} mesi` },
  ],
};

const ORDER_TOOLS = [
  { to: '/assistenza/dove-e-il-mio-ordine', title: 'Dov’è il mio ordine?', go: 'Stato e tracciamento →', jar: 'occhio' },
  { to: '/assistenza/qualcosa-non-va', title: 'Il pacco ha un problema', go: 'Percorso guidato →', jar: 'aceto' },
];
const PRODUCT_TOOLS = [
  { to: '/guide/quale-calibro-scegliere', title: 'Quale calibro scegliere', go: 'Leggi la guida →', jar: 'lilliput' },
  { to: '/assistenza/primo-ordine', title: 'Il tuo primo ordine', go: 'Passo per passo →', jar: 'capperone' },
];
const TOOLS = {
  'ordini-e-pagamenti': ORDER_TOOLS,
  spedizioni: ORDER_TOOLS,
  'resi-e-garanzia': ORDER_TOOLS,
  'regali-e-natale': [
    { to: '/box-di-natale', title: 'La Box di Natale', go: 'Componi la tua →', jar: 'lacrimella' },
    { to: '/assistenza/dove-e-il-mio-ordine', title: 'Dov’è il mio ordine?', go: 'Stato e tracciamento →', jar: 'occhio' },
  ],
  'ristoranti-e-rivenditori': [
    { to: '/b2b', title: 'Area B2B', go: 'Prezzi e formati →', jar: 'capperone' },
    { to: '/contatti', title: 'Scrivici per una proposta', go: 'Contatti →', jar: 'aceto' },
  ],
};

function JarCard({ to, title, go, jar }) {
  return (
    <Link to={to} className={s.jarCard}>
      <span className={s.jarCardText}>
        <span className={s.cellTitleItalic} style={{ fontSize: 30 }}>{title}</span>
        <span className={s.link} style={{ fontSize: 14 }}>{go}</span>
      </span>
      <img src={JARS[jar].src} alt="" loading="lazy" width="400" height="400" />
    </Link>
  );
}

/** /assistenza/:cat → elenco risposte dell’argomento. */
function CategoryView({ category }) {
  const articles = getArticlesInCategory(category.slug);
  const crumbs = [HUB, { name: category.title, path: helpCategoryPath(category) }];
  const index = HELP_CATEGORIES.findIndex((c) => c.slug === category.slug);
  const stats = STATS[category.slug];
  const tools = TOOLS[category.slug] || PRODUCT_TOOLS;

  useSEO({
    title: `${category.title} — Assistenza`,
    description: `${category.sub}: le risposte del Capperificio di Racale.`,
    path: helpCategoryPath(category),
    breadcrumbs: [{ name: 'Home', path: '/' }, ...crumbs],
  });

  const items = articles.map((a) => ({
    id: a.slug,
    q: a.q,
    sub: plainText(a.short),
    body: (
      <>
        <HelpRich body={a.body} />
        <Link to={helpArticlePath(a)} className={s.link} style={{ fontSize: 14 }}>Apri la risposta completa →</Link>
      </>
    ),
  }));

  return (
    <div className={s.page}>
      <Crumbs items={crumbs} />
      <div className={s.shell}>
        <aside className={s.left} aria-label="Argomenti">
          <span className={s.kicker}>Argomenti</span>
          <TopicsNav current={category.slug} />
          <Link to="/faq" className={s.link} style={{ fontSize: 14, paddingTop: 6 }}>Tutte le domande frequenti →</Link>
        </aside>

        <main className={s.center}>
          <div className={s.head}>
            <span className={s.kicker}>Argomento · {pad(index + 1)}</span>
            <h1 className={s.h1} style={{ fontSize: 'clamp(48px, 6vw, 80px)' }}>{category.title}</h1>
            <p className={s.lead} style={{ fontSize: 19 }}>{category.sub}.</p>
          </div>

          {stats && (
            <div className={`${s.ruleGrid} ${s.stack}`}>
              {stats.map((st) => (
                <div key={st.k} className={s.ruleCell}>
                  <span className={s.mono}>{st.k}</span>
                  <span className={s.bigNum}>{st.v}</span>
                  <span className={s.monoMuted}>{st.t}</span>
                </div>
              ))}
            </div>
          )}

          <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span className={s.mono}>{articles.length} DOMANDE IN QUESTO ARGOMENTO</span>
            <Accordion items={items} initial={items[0]?.id} numbered />
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {tools.map((t) => <JarCard key={t.to} {...t} />)}
          </section>
        </main>

        <aside className={s.right} aria-label="Aiuto">
          <SideHelp email={COMPANY.emailOrders} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className={s.kicker}>Le regole per intero</span>
            <div className={s.sideLinks}><Link to="/spedizioni-e-resi">Spedizioni e resi →</Link></div>
            <span className={s.monoMuted} style={{ fontSize: 12 }}>Dove spediamo, costi per Paese, tempi per Natale, consegna mancata.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Risposte che hanno una guida completa.
const GUIDE_FOR = {
  'quale-calibro-scegliere': 'quale-calibro-scegliere',
  'sale-o-aceto': 'capperi-sotto-sale-o-sottaceto',
  'capperi-e-cucunci': 'capperi-e-cucunci',
  'foglie-e-polvere': 'foglie-e-polvere-di-cappero',
  'come-dissalare': 'come-dissalare-i-capperi',
  'dopo-apertura': 'come-conservare-i-capperi',
  'sale-umido-cristalli': 'come-conservare-i-capperi',
  scadenza: 'come-conservare-i-capperi',
};

/** /assistenza/:cat/:slug → singola risposta. */
function ArticleView({ article, category }) {
  const [voted, setVoted] = useState(false);
  const crumbs = [
    HUB,
    { name: category.title, path: helpCategoryPath(category) },
    { name: article.q, path: helpArticlePath(article) },
  ];
  const short = plainText(article.short);
  const siblings = getArticlesInCategory(category.slug);
  const related = siblings.filter((a) => a.slug !== article.slug).slice(0, 3);
  const guide = getGuide(GUIDE_FOR[article.slug]);
  const isReturn = category.slug === 'resi-e-garanzia';

  useSEO({
    title: article.q,
    description: short,
    path: helpArticlePath(article),
    breadcrumbs: [{ name: 'Home', path: '/' }, ...crumbs],
    jsonLd: {
      '@type': 'FAQPage',
      mainEntity: [{
        '@type': 'Question',
        name: article.q,
        acceptedAnswer: { '@type': 'Answer', text: blocksToPlain(article.body) },
      }],
    },
  });

  return (
    <div className={s.page}>
      <Crumbs items={crumbs} />
      <div className={s.shell}>
        <aside className={s.left} aria-label="Altre domande">
          <span className={s.kicker}>{category.title}</span>
          <ol className={s.nav}>
            {siblings.map((a, i) => (
              <li key={a.slug}>
                <Link to={helpArticlePath(a)} aria-current={a.slug === article.slug ? 'page' : undefined}>
                  <span>{pad(i + 1)}</span>
                  {a.slug === article.slug ? `→ ${a.q}` : a.q}
                </Link>
              </li>
            ))}
          </ol>
          <Link to={helpCategoryPath(category)} className={s.link} style={{ fontSize: 14, paddingTop: 6 }}>← Tutto l’argomento</Link>
        </aside>

        <article className={s.center}>
          <div className={s.head}>
            <span className={s.kicker}>{category.title}</span>
            <h1 className={s.h1} style={{ fontSize: 'clamp(42px, 5.4vw, 76px)' }}>{article.q}</h1>
            <span className={s.monoMuted} style={{ fontSize: 12 }}>Risposta del team del Capperificio Caro, Racale</span>
          </div>

          <div className={s.brief}>
            <span className={s.kicker}>In breve</span>
            <span className={s.briefText}>{short}</span>
          </div>

          <HelpRich body={article.body} />

          {guide && (
            <Link to={guidePath(guide)} className={s.jarCard}>
              <span className={s.jarCardText}>
                <span className={s.mono}>LA GUIDA COMPLETA · {guide.readMin} MIN</span>
                <span className={s.cellTitleItalic} style={{ fontSize: 30 }}>{guide.title} →</span>
              </span>
              <img src={JARS.occhio.src} alt="" loading="lazy" width="400" height="400" />
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '22px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }} aria-live="polite">
            {voted ? (
              <span className={s.cellTitleItalic} style={{ fontSize: 22, color: 'var(--color-red)' }}>Grazie, ci aiuta a migliorare le risposte.</span>
            ) : (
              <>
                <span className={s.cellTitle} style={{ fontSize: 22 }}>Questa risposta ti è stata utile?</span>
                <button type="button" className={s.btnGhost} style={{ minHeight: 44, textTransform: 'none', fontSize: 15 }} onClick={() => setVoted(true)}>Sì</button>
                <button type="button" className={s.btnGhost} style={{ minHeight: 44, textTransform: 'none', fontSize: 15 }} onClick={() => setVoted(true)}>No</button>
              </>
            )}
          </div>

          {related.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <span className={s.mono}>CI CHIEDETE ANCHE</span>
              <div className={s.ruleGrid} style={{ '--cols': related.length, borderBottom: 'none' }}>
                {related.map((a) => (
                  <Link key={a.slug} to={helpArticlePath(a)} className={s.ruleCell}>
                    <span className={s.cellTitleItalic} style={{ fontSize: 22 }}>{a.q}</span>
                    <span className={s.monoMuted} style={{ fontSize: 12 }}>{plainText(a.short)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className={s.right} aria-label="Aiuto">
          <div className={s.outlineCard}>
            <span className={s.mono}>{isReturn ? 'VUOI FARE UN RESO?' : 'HAI ANCORA UN DUBBIO?'}</span>
            <span className={s.cellTitleItalic} style={{ fontSize: 26 }}>
              {isReturn ? 'Scrivici con il numero d’ordine' : 'Chiedi pure, ti rispondiamo noi'}
            </span>
            {isReturn ? (
              <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent('Reso ordine n. ')}`} className={s.btn}>Scrivi un’email →</a>
            ) : (
              <a href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer" className={s.btn}>WhatsApp →</a>
            )}
            <span className={s.monoMuted} style={{ fontSize: 12 }}>{COMPANY.email}</span>
          </div>
          <div className={s.greenCard}>
            <span className={s.kicker}>Il pacco ha un problema?</span>
            <span className={s.greenTitle} style={{ fontSize: 24 }}>Ti guidiamo in due domande</span>
            <Link to="/assistenza/qualcosa-non-va" style={{ fontWeight: 500 }}>Qualcosa non va →</Link>
          </div>
          <div className={s.sideLinks}>
            <Link to="/spedizioni-e-resi">Spedizioni e resi, le regole per intero →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function AssistenzaTopicPage() {
  const { cat, slug } = useParams();
  const category = getHelpCategory(cat);
  if (!category) return <NotFoundPage />;
  if (!slug) return <CategoryView key={cat} category={category} />;

  const article = getHelpArticle(slug);
  if (!article) return <NotFoundPage />;
  // Risposta raggiunta con l’argomento sbagliato nell’URL → percorso canonico
  if (article.cat !== cat) return <Navigate to={helpArticlePath(article)} replace />;
  return <ArticleView key={slug} article={article} category={category} />;
}
