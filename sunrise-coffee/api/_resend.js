// ─────────────────────────────────────────────────────────────────────────────
//  Email transazionali — Capperificio di Racale
//
//  Env var:
//    RESEND_API_KEY      → resend.com/api-keys
//    RESEND_FROM         → "Capperificio di Racale <ordini@capperificiocaro.com>"
//    RESEND_MERCHANT_TO  → email merchant per notifiche (es. digital@capperificiocaro.com)
//
//  Email implementate:
//    Cliente:
//      sendOrderConfirmation(order)              — pagamento confermato
//      sendOrderShipped(order, tracking)         — ordine spedito + tracking
//      sendOrderCancelled(order)                 — ordine annullato + rimborso
//      sendRefundIssued(order, amount)           — rimborso parziale emesso
//      sendWelcome(customer)                     — nuovo account registrato
//      sendPasswordReset(customer, resetUrl)     — reset password
//      sendReviewRequest(order)                  — 10gg dopo spedizione
//      sendSampleBoxConfirmation(pi)             — box campioni pagato (EN)
//    Merchant:
//      sendMerchantAlert(order, packlinkRef)     — nuovo ordine ricevuto
//      sendSampleBoxAlert(pi)                    — box campioni pagato
//      sendMerchantLowStock(products)            — scorte in esaurimento
// ─────────────────────────────────────────────────────────────────────────────

import { Resend } from 'resend';

const client = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM        = process.env.RESEND_FROM       || 'Capperificio di Racale <ordini@capperificiocaro.com>';
const MERCHANT_TO = process.env.RESEND_MERCHANT_TO || '';
const SITE_URL    = (process.env.FRONTEND_URL || 'https://capperificiocaro.com').replace(/\/$/, '');
const SHOPWARE_URL = `http://${process.env.SHOPWARE_DOMAIN || '157.90.241.97:8090'}`;

export function resendConfigured() { return Boolean(client); }

// ── Stile "Editorial" (allineato al sito) ─────────────────────────────────────
//  Stessa grammatica di scheda prodotto e /sample-box: fondo crema, titoli in
//  PP Editorial (riga 2 in corsivo verde), etichette "• MAIUSCOLO", elenchi a
//  filetti, riquadro verdino per i prossimi passi, pulsanti a pillola.
//  Codice email-safe: tabelle + stili inline. I font del brand si caricano solo
//  dove il client lo consente (Apple Mail, iOS); altrove ripiegano su Georgia /
//  Helvetica senza rompere l'impaginazione. Logo e foto sono PNG/JPG serviti dal
//  sito: Gmail e Outlook non mostrano SVG e (alcuni) WebP.
const C = {
  dark:    '#2C4A2C',   // color-dark
  green:   '#547054',   // color-red (verde brand)
  mid:     '#6B8A6B',   // color-mid
  cream:   '#FCF3DF',   // fondo pagina
  mint:    '#EAF0E5',   // color-cream (verdino)
  line:    '#D9D8C2',   // color-border su crema, in esadecimale per Outlook
  white:   '#FFFFFF',
  warning: '#6B4A12',
  warnBg:  '#F5E6C3',
  danger:  '#9A2B2B',
};
const SERIF = "'PP Editorial Old', Georgia, 'Times New Roman', serif";
const SANS  = "'Paralucent', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const LOGO_URL = `${SITE_URL}/images/email/logo.png`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function euro(n) {
  return typeof n === 'number' ? `€${n.toFixed(2).replace('.', ',')}` : '—';
}
function euroEn(n) {
  return typeof n === 'number' ? `€${n.toFixed(2)}` : '—';
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

function addr(a) {
  if (!a) return '';
  return [
    `${a.firstName || ''} ${a.lastName || ''}`.trim(),
    a.company,
    [a.street, a.additionalAddressLine2].filter(Boolean).join(' '),
    `${a.zipcode || ''} ${a.city || ''}`.trim(),
    a.country?.name || '',
  ].filter(Boolean).map(esc).join('<br>');
}

// ── Layout base ───────────────────────────────────────────────────────────────
//  eyebrow  → "• CONFERMA ORDINE" sotto il logo
//  title    → [riga 1, riga 2 in corsivo verde (facoltativa)]
//  intro    → paragrafo sotto il titolo (HTML)
//  pills    → [{ text, filled }] — riferimento ordine, stato
//  preheader→ anteprima mostrata dalla casella prima di aprire l'email
const FOOTER = {
  it: { line: 'Raccolti a mano a Racale · Salento',
        links: [['Prodotti', '/collections/all'], ['La nostra storia', '/storia'], ['Contatti', '/contatti']],
        tagline: 'Capperi, cucunci e foglie. Tre generazioni di sapere artigianale.' },
  en: { line: 'Hand-picked in Racale · Salento · Italy',
        links: [['Sample box', '/sample-box'], ['Our story', '/storia'], ['Contact', '/contatti']],
        tagline: 'Capers, caper berries and leaves. Three generations of craft.' },
};

function pills(list = []) {
  if (!list.length) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 0;"><tr>${list.map(p => `
    <td style="padding:0 8px 0 0;">
      <span style="display:inline-block;padding:${p.filled ? '7px 15px' : '5.5px 13.5px'};border-radius:30px;font-family:${SANS};font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;${p.filled
        ? `background:${C.green};color:${C.cream};`
        : `border:1.5px solid ${C.green};color:${C.green};`}">${p.text}</span>
    </td>`).join('')}</tr></table>`;
}

function layout({ eyebrow = '', title = [], intro = '', pills: pl = [], preheader = '', lang = 'it' }, content) {
  const f = FOOTER[lang] || FOOTER.it;
  const [t1, t2] = title;
  const docTitle = [t1, t2].filter(Boolean).join(' ');
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${docTitle}</title>
<style>
@font-face{font-family:'PP Editorial Old';font-style:normal;font-weight:400;src:url(${SITE_URL}/fonts/PPEditorialOld-Regular.woff2) format('woff2')}
@font-face{font-family:'PP Editorial Old';font-style:italic;font-weight:400;src:url(${SITE_URL}/fonts/PPEditorialOld-Italic.woff2) format('woff2')}
@font-face{font-family:'Paralucent';font-weight:300;src:url(${SITE_URL}/fonts/Paralucent-Light.woff2) format('woff2')}
@font-face{font-family:'Paralucent';font-weight:500;src:url(${SITE_URL}/fonts/Paralucent-Medium.woff2) format('woff2')}
@media (max-width:620px){
  .px{padding-left:24px!important;padding-right:24px!important}
  .h1{font-size:36px!important}
  .photo{width:100%!important;height:auto!important}
}
</style>
</head>
<body style="margin:0;padding:0;background:${C.cream};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.cream};">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};">
  <tr><td align="center" style="padding:0 0 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:${SANS};font-weight:300;color:${C.dark};">

    <!-- Logo -->
    <tr><td align="center" style="padding:40px 48px 30px;border-bottom:1px solid ${C.line};" class="px">
      <a href="${SITE_URL}" style="text-decoration:none;"><img src="${LOGO_URL}" width="44" height="64" alt="Capperificio Caro" style="display:block;border:0;width:44px;height:auto;"></a>
      ${eyebrow ? `<p style="margin:14px 0 0;font-family:${SANS};font-size:11px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:${C.green};">• ${eyebrow}</p>` : ''}
    </td></tr>

    <!-- Titolo -->
    <tr><td style="padding:42px 48px 0;" class="px">
      <h1 class="h1" style="margin:0;font-family:${SERIF};font-weight:400;font-size:44px;line-height:1.04;color:${C.dark};">
        ${t1 || ''}${t2 ? `<br><span style="font-style:italic;color:${C.green};">${t2}</span>` : ''}
      </h1>
      ${intro ? `<p style="margin:18px 0 0;font-family:${SANS};font-size:15px;line-height:1.75;color:${C.dark};">${intro}</p>` : ''}
      ${pills(pl)}
    </td></tr>

    ${content}

    <!-- Footer -->
    <tr><td align="center" style="padding:44px 48px 40px;" class="px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-top:1px solid ${C.line};padding-top:30px;">
        <p style="margin:0 0 10px;font-family:${SANS};font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:${C.green};">${f.line}</p>
        <p style="margin:0 0 10px;font-family:${SANS};font-size:12px;color:${C.mid};">
          ${f.links.map(([t, href]) => `<a href="${SITE_URL}${href}" style="color:${C.green};text-decoration:underline;">${t}</a>`).join(' &nbsp;·&nbsp; ')}
        </p>
        <p style="margin:0;font-family:${SERIF};font-style:italic;font-size:14px;color:${C.mid};">${f.tagline}</p>
        <p style="margin:12px 0 0;font-family:${SANS};font-size:10px;color:${C.mid};">© ${new Date().getFullYear()} Capperificio Caro · Racale (LE) · <a href="${SITE_URL}" style="color:${C.mid};text-decoration:none;">capperificiocaro.com</a></p>
      </td></tr></table>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Componenti (ognuno è una riga <tr> del layout) ────────────────────────────
function section(inner, { top = 38 } = {}) {
  return `<tr><td style="padding:${top}px 48px 0;" class="px">${inner}</td></tr>`;
}

function label(text) {
  return `<p style="margin:0 0 12px;font-family:${SANS};font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:${C.green};">• ${text}</p>`;
}

function text(html, { color = C.dark, size = 15, top = 0 } = {}) {
  return `<p style="margin:${top}px 0 0;font-family:${SANS};font-size:${size}px;line-height:1.75;color:${color};">${html}</p>`;
}

// Elenco a filetti. rows = [{ num, left, sub, right, rightColor }]
function list(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line};">${rows.map(r => `
    <tr>
      ${r.num ? `<td valign="top" style="width:34px;padding:13px 0;border-bottom:1px solid ${C.line};font-family:${SERIF};font-style:italic;font-size:18px;color:${C.green};">${r.num}</td>` : ''}
      <td valign="top" style="padding:13px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:15px;font-weight:500;color:${C.dark};line-height:1.4;">
        ${r.left}${r.sub ? `<br><span style="font-size:12px;font-weight:300;color:${C.mid};">${r.sub}</span>` : ''}
      </td>
      ${r.right != null ? `<td valign="top" align="right" style="padding:13px 0 13px 16px;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:15px;font-weight:500;color:${r.rightColor || C.green};white-space:nowrap;">${r.right}</td>` : ''}
    </tr>`).join('')}
  </table>`;
}

function itemsList(lineItems = []) {
  return list((lineItems || [])
    .filter(i => i.type === 'product' || !i.type)
    .map(i => ({
      left: esc(i.label || '—'),
      sub: `Quantità ${i.quantity || 1}`,
      right: euro(i.price?.totalPrice),
    })));
}

// Tabella dettagli a due colonne, come la scheda prodotto. rows = [[chiave, valore]]
function details(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line};">${rows.filter(Boolean).map(([k, v]) => `
    <tr>
      <td valign="top" style="width:44%;padding:11px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;font-weight:500;color:${C.dark};">${k}</td>
      <td valign="top" style="padding:11px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;color:${C.green};line-height:1.6;">${v}</td>
    </tr>`).join('')}
  </table>`;
}

function totalLine(lbl, value) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;"><tr>
    <td style="font-family:${SERIF};font-size:26px;color:${C.dark};">${lbl}</td>
    <td align="right" style="font-family:${SERIF};font-size:30px;color:${C.green};white-space:nowrap;">${value}</td>
  </tr></table>`;
}

function orderTotals(order) {
  const shipping = order.deliveries?.[0]?.shippingCosts?.totalPrice ?? 0;
  const total    = order.price?.totalPrice;
  const sub      = order.price?.positionPrice ?? (total - shipping);
  return details([
    sub != null ? ['Subtotale', euro(sub)] : null,
    ['Spedizione', shipping <= 0 ? 'Gratuita' : euro(shipping)],
  ]) + totalLine('Totale', euro(total));
}

function button(lbl, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr>
    <td style="background:${C.green};border-radius:30px;">
      <a href="${url}" style="display:inline-block;padding:15px 30px;font-family:${SANS};font-size:13px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:${C.cream};text-decoration:none;border-radius:30px;">${lbl} →</a>
    </td>
  </tr></table>`;
}

// Riquadro verdino "prossimi passi". body = HTML, cta = button(...) facoltativo
function noteBox(title, body, cta = '') {
  return section(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.mint};border-radius:20px;"><tr><td style="padding:28px;">
    <p style="margin:0 0 10px;font-family:${SERIF};font-style:italic;font-size:24px;color:${C.dark};">${title}</p>
    <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.7;color:${C.dark};">${body}</p>
    ${cta}
  </td></tr></table>`);
}

function warnBox(html) {
  return section(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.warnBg};border-radius:14px;"><tr><td style="padding:18px 22px;">
    <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.65;color:${C.warning};">${html}</p>
  </td></tr></table>`, { top: 28 });
}

function photo(url, alt) {
  return `<tr><td style="padding:34px 28px 0;"><img class="photo" src="${url}" width="544" height="380" alt="${alt}" style="display:block;border:0;width:544px;height:380px;border-radius:20px;"></td></tr>`;
}

function signature(lang = 'it') {
  return section(`
    <p style="margin:0;font-family:${SANS};font-size:15px;color:${C.dark};">${lang === 'en' ? 'Warm regards from Salento,' : 'Un caro saluto dal Salento,'}</p>
    <p style="margin:6px 0 0;font-family:${SERIF};font-style:italic;font-size:24px;color:${C.green};">${lang === 'en' ? 'The Capperificio Caro team' : 'Il team del Capperificio Caro'}</p>`, { top: 36 });
}

function helpLine(prefix = 'Per qualsiasi domanda scrivi a', email = 'ordini@capperificiocaro.com') {
  return section(text(`${prefix} <a href="mailto:${email}" style="color:${C.green};">${email}</a>`, { color: C.mid, size: 13 }), { top: 22 });
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. CONFERMA ORDINE → cliente
// ─────────────────────────────────────────────────────────────────────────────
//  Ritorna true se l'email è stata accettata da Resend, false altrimenti:
//  il chiamante deve poter ritentare (la conferma ordine non può andare persa).
export async function sendOrderConfirmation(order) {
  if (!client) return false;
  const to = order.orderCustomer?.email;
  if (!to) {
    console.warn('Resend sendOrderConfirmation: email cliente mancante');
    return false;
  }
  const num = order.orderNumber || order.id;
  const firstName = esc(order.orderCustomer?.firstName || 'Cliente');
  const delivery = order.deliveries?.[0]?.shippingOrderAddress;

  const content = `
    ${section(`${label('Il tuo ordine')}${itemsList(order.lineItems)}`)}
    ${section(`${label('Dettagli')}${orderTotals(order)}`, { top: 32 })}
    ${delivery ? section(`${label('Spedizione a')}${text(addr(delivery), { color: C.green, size: 14 })}`, { top: 32 }) : ''}
    ${noteBox('Cosa succede ora',
      'Prepariamo il tuo pacco a mano nel nostro laboratorio. Riceverai una seconda email non appena partirà, con il numero di tracking.',
      button('Scopri altri prodotti', `${SITE_URL}/collections/all`))}
    ${signature()}
    ${helpLine()}`;

  return _send({
    to,
    subject: `Ordine #${num} confermato — Capperificio di Racale`,
    html: layout({
      eyebrow: 'Conferma ordine',
      title: [`Grazie, ${firstName}.`, 'Il tuo ordine è confermato.'],
      intro: `Lo stiamo preparando con cura nel nostro laboratorio a <span style="font-family:${SERIF};font-style:italic;font-size:17px;">Racale</span>, nel cuore del Salento.`,
      pills: [{ text: `Ordine #${num}` }, { text: 'Pagamento ricevuto', filled: true }],
      preheader: `Ordine #${num} confermato: lo stiamo preparando a Racale.`,
    }, content),
    tag: 'order-confirmation',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. ORDINE SPEDITO → cliente
//  Chiama questa funzione quando aggiungi il tracking all'ordine.
//  tracking = { number: '1Z999AA...', carrier: 'BRT', url: 'https://...' }
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOrderShipped(order, tracking = {}) {
  if (!client) return;
  const to = order.orderCustomer?.email;
  if (!to) return console.warn('Resend sendOrderShipped: email cliente mancante');
  const num = order.orderNumber || order.id;
  const firstName = esc(order.orderCustomer?.firstName || 'Cliente');
  const delivery = order.deliveries?.[0]?.shippingOrderAddress;

  const trackBlock = tracking.number
    ? section(`${label('Traccia la spedizione')}${details([
        ['Corriere', esc(tracking.carrier || '—')],
        ['Numero di tracking', esc(tracking.number)],
      ])}${tracking.url ? button('Traccia il pacco', tracking.url) : ''}`)
    : warnBox('I dettagli di tracking saranno disponibili a breve sul sito del corriere.');

  const content = `
    ${trackBlock}
    ${delivery ? section(`${label('Consegna a')}${text(addr(delivery), { color: C.green, size: 14 })}`, { top: 32 }) : ''}
    ${section(`${label('Nel pacco')}${itemsList(order.lineItems)}`, { top: 32 })}
    ${signature()}
    ${helpLine()}`;

  await _send({
    to,
    subject: `Il tuo ordine #${num} è in viaggio — Capperificio di Racale`,
    html: layout({
      eyebrow: 'Spedizione',
      title: [`Buone notizie, ${firstName}.`, 'Il tuo ordine è partito.'],
      intro: 'I tuoi capperi hanno lasciato Racale e sono in viaggio verso di te.',
      pills: [{ text: `Ordine #${num}` }, { text: 'In viaggio', filled: true }],
      preheader: `L'ordine #${num} è partito${tracking.number ? `: tracking ${tracking.number}` : ''}.`,
    }, content),
    tag: 'order-shipped',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. ORDINE ANNULLATO → cliente
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOrderCancelled(order) {
  if (!client) return;
  const to = order.orderCustomer?.email;
  if (!to) return console.warn('Resend sendOrderCancelled: email cliente mancante');
  const num = order.orderNumber || order.id;
  const firstName = esc(order.orderCustomer?.firstName || 'Cliente');

  const content = `
    ${warnBox('Il rimborso verrà accreditato sul tuo metodo di pagamento entro <strong>3-5 giorni lavorativi</strong>. I tempi dipendono dalla tua banca o dal circuito di pagamento.')}
    ${section(`${label('Ordine annullato')}${itemsList(order.lineItems)}`, { top: 32 })}
    ${section(`${label('Dettagli')}${orderTotals(order)}`, { top: 32 })}
    ${noteBox('Ti aspettiamo',
      'Se vuoi riprovare, i nostri capperi sono sempre qui. Per qualsiasi dubbio sull’annullamento rispondi pure a questa email.',
      button('Torna allo shop', `${SITE_URL}/collections/all`))}
    ${signature()}
    ${helpLine('Hai bisogno di assistenza? Scrivi a')}`;

  await _send({
    to,
    subject: `Ordine #${num} annullato — Capperificio di Racale`,
    html: layout({
      eyebrow: 'Ordine annullato',
      title: [`Ciao ${firstName},`, 'il tuo ordine è stato annullato.'],
      intro: 'L’ordine è stato annullato su tua richiesta o per un problema tecnico. Qui sotto trovi il riepilogo.',
      pills: [{ text: `Ordine #${num}` }],
      preheader: `Ordine #${num} annullato: il rimborso arriverà in 3-5 giorni lavorativi.`,
    }, content),
    tag: 'order-cancelled',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  4. RIMBORSO PARZIALE EMESSO → cliente
//  amount = importo in euro già rimborsato
// ─────────────────────────────────────────────────────────────────────────────
export async function sendRefundIssued(order, amount) {
  if (!client) return;
  const to = order.orderCustomer?.email;
  if (!to) return console.warn('Resend sendRefundIssued: email cliente mancante');
  const num = order.orderNumber || order.id;
  const firstName = esc(order.orderCustomer?.firstName || 'Cliente');

  const content = `
    ${section(`${label('Rimborso')}${details([['Ordine', `#${esc(num)}`]])}${totalLine('Importo rimborsato', euro(amount))}`)}
    ${warnBox('Il rimborso sarà visibile sul tuo conto entro <strong>3-5 giorni lavorativi</strong>, in base ai tempi della tua banca.')}
    ${noteBox('Grazie per la pazienza', 'Se qualcosa non ti torna, rispondi a questa email: ti aiutiamo volentieri.',
      button('Torna allo shop', `${SITE_URL}/collections/all`))}
    ${signature()}
    ${helpLine('Domande? Scrivi a')}`;

  await _send({
    to,
    subject: `Rimborso di ${euro(amount)} per l'ordine #${num}`,
    html: layout({
      eyebrow: 'Rimborso',
      title: [`Ciao ${firstName},`, 'abbiamo emesso un rimborso.'],
      intro: `Abbiamo elaborato un rimborso di <strong style="font-weight:500;">${euro(amount)}</strong> per il tuo ordine.`,
      pills: [{ text: `Ordine #${num}` }, { text: euro(amount), filled: true }],
      preheader: `Rimborso di ${euro(amount)} emesso per l'ordine #${num}.`,
    }, content),
    tag: 'refund-issued',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  5. BENVENUTO → nuovo cliente registrato
//  customer = { firstName, lastName, email }
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWelcome(customer) {
  if (!client) return;
  const to = customer?.email;
  if (!to) return console.warn('Resend sendWelcome: email mancante');
  const name = esc(customer.firstName || 'Cliente');
  const link = (t, href) => `<a href="${SITE_URL}${href}" style="color:${C.dark};text-decoration:none;">${t}</a>`;

  const content = `
    ${section(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.mint};border-radius:20px;"><tr><td style="padding:28px;">
      <p style="margin:0 0 12px;font-family:${SERIF};font-style:italic;font-size:22px;line-height:1.4;color:${C.dark};">“Tre generazioni di sapere artigianale tra le distese di Racale, in Puglia.”</p>
      <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.7;color:${C.dark};">Coltiviamo e selezioniamo capperi con cura, rispettando la terra e i ritmi della natura — perché il gusto autentico non si improvvisa.</p>
    </td></tr></table>`)}
    ${section(`${label('Da dove iniziare')}${list([
      { num: '01', left: link('Scopri capperi, cucunci e foglie', '/collections/all') },
      { num: '02', left: link('Leggi la storia del Capperificio', '/storia') },
      { num: '03', left: link('Sei un rivenditore? Le condizioni B2B', '/b2b') },
    ])}${button('Esplora i prodotti', `${SITE_URL}/collections/all`)}`, { top: 32 })}
    ${signature()}`;

  await _send({
    to,
    subject: 'Benvenuto nel Capperificio di Racale',
    html: layout({
      eyebrow: 'Nuovo account',
      title: [`Benvenuto, ${name}.`, 'Siamo felici di averti con noi.'],
      intro: 'Il tuo account è pronto: da ora puoi ordinare più in fretta e seguire i tuoi ordini.',
      preheader: 'Il tuo account Capperificio di Racale è pronto.',
    }, content),
    tag: 'welcome',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  6. RESET PASSWORD → cliente
//  resetUrl = link con token valido (generato da Shopware o sistema auth)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPasswordReset(customer, resetUrl) {
  if (!client) return;
  const to = customer?.email;
  if (!to) return console.warn('Resend sendPasswordReset: email mancante');
  const name = esc(customer.firstName || 'Cliente');
  const url = esc(resetUrl);

  const content = `
    ${section(button('Reimposta la password', url), { top: 18 })}
    ${warnBox('Il link è valido per <strong>2 ore</strong>. Se non hai richiesto tu il reset, ignora questa email: il tuo account resta al sicuro.')}
    ${section(text(`Se il pulsante non funziona, copia e incolla questo indirizzo nel browser:<br><a href="${url}" style="color:${C.green};word-break:break-all;">${url}</a>`, { color: C.mid, size: 13 }), { top: 24 })}
    ${signature()}`;

  await _send({
    to,
    subject: 'Reimposta la tua password — Capperificio di Racale',
    html: layout({
      eyebrow: 'Sicurezza account',
      title: [`Ciao ${name},`, 'reimposta la tua password.'],
      intro: 'Abbiamo ricevuto una richiesta di reset della password per il tuo account.',
      preheader: 'Il link per reimpostare la password è valido per 2 ore.',
    }, content),
    tag: 'password-reset',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  7. RICHIESTA RECENSIONE → cliente  (invia 10-12 giorni dopo spedizione)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendReviewRequest(order) {
  if (!client) return;
  const to = order.orderCustomer?.email;
  if (!to) return console.warn('Resend sendReviewRequest: email cliente mancante');
  const num = order.orderNumber || order.id;
  const firstName = esc(order.orderCustomer?.firstName || 'Cliente');
  const items = (order.lineItems || []).filter(i => i.type === 'product' || !i.type);

  const content = `
    ${section(`${label('Hai acquistato')}${list(items.map((i, n) => ({ num: String(n + 1).padStart(2, '0'), left: esc(i.label || '—') })))}`)}
    ${noteBox('Cosa ne pensi?',
      'La tua opinione è preziosa per noi e per chi non ci conosce ancora. Lasciare una recensione richiede solo un minuto.',
      button('Lascia una recensione', `${SITE_URL}/collections/all`))}
    ${signature()}
    ${helpLine(`Problemi con l’ordine #${esc(num)}? Scrivi a`)}`;

  await _send({
    to,
    subject: 'Come sono stati i tuoi capperi? — Capperificio di Racale',
    html: layout({
      eyebrow: 'La tua opinione',
      title: [`Ciao ${firstName},`, 'com’è andata?'],
      intro: 'Speriamo che i tuoi capperi siano arrivati in perfetta forma e che tu li stia gustando.',
      preheader: 'Un minuto per dirci com’erano i tuoi capperi?',
    }, content),
    tag: 'review-request',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  8. NUOVO ORDINE → merchant
// ─────────────────────────────────────────────────────────────────────────────
export async function sendMerchantAlert(order, packlinkRef = null) {
  if (!client || !MERCHANT_TO) {
    if (!MERCHANT_TO) console.warn('Resend sendMerchantAlert: RESEND_MERCHANT_TO non configurato');
    return;
  }
  const num = order.orderNumber || order.id;
  const customer = order.orderCustomer || {};
  const delivery = order.deliveries?.[0]?.shippingOrderAddress;
  const total = order.price?.totalPrice;
  const shippingMethod = esc(order.deliveries?.[0]?.shippingMethod?.name || '—');

  const plBlock = packlinkRef
    ? noteBox('Spedizione Packlink pronta',
        `Draft creato: <strong style="font-weight:500;">${esc(packlinkRef)}</strong>. Seleziona il corriere e stampa l’etichetta.`,
        button('Apri su Packlink', `https://pro.packlink.com/shipment/${esc(packlinkRef)}`))
    : warnBox('Nessun draft Packlink creato automaticamente. Crea la spedizione a mano su <a href="https://pro.packlink.com" style="color:#6B4A12;">pro.packlink.com</a>.');

  const content = `
    ${section(`${label('Cliente')}${details([
      ['Nome', esc(`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '—')],
      ['Email', customer.email ? `<a href="mailto:${esc(customer.email)}" style="color:${C.green};">${esc(customer.email)}</a>` : '—'],
      delivery ? ['Spedire a', addr(delivery)] : null,
      ['Metodo', shippingMethod],
    ])}`)}
    ${section(`${label('Prodotti')}${itemsList(order.lineItems)}`, { top: 32 })}
    ${section(`${label('Totali')}${orderTotals(order)}`, { top: 32 })}
    ${plBlock}
    ${section(button('Apri in Shopware', `${SHOPWARE_URL}/admin#/sw/order/list`), { top: 24 })}`;

  await _send({
    to: MERCHANT_TO,
    subject: `Nuovo ordine #${num} — ${euro(total)}`,
    html: layout({
      eyebrow: 'Nuovo ordine',
      title: [`Ordine #${num}`, euro(total)],
      intro: 'Nuovo ordine pagato e confermato. Da preparare e spedire.',
      pills: [{ text: 'Pagato', filled: true }, { text: shippingMethod }],
      preheader: `Nuovo ordine #${num} da ${euro(total)}.`,
    }, content),
    tag: 'merchant-alert',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  8b. BOX CAMPIONI PAGATO → merchant
//  pi = PaymentIntent Stripe di /sample-box (nessun ordine Shopware): i dati
//  del rivenditore stanno in metadata, l'indirizzo in pi.shipping.
// ─────────────────────────────────────────────────────────────────────────────
export async function sendSampleBoxAlert(pi) {
  if (!client || !MERCHANT_TO) {
    if (!MERCHANT_TO) console.warn('Resend sendSampleBoxAlert: RESEND_MERCHANT_TO non configurato');
    return false;
  }
  const m = pi.metadata || {};
  const s = pi.shipping || {};
  const total = pi.amount / 100;

  const content = `
    ${section(`${label('Rivenditore')}${details([
      ['Azienda', esc(m.company)],
      ['Contatto', esc(`${m.firstName || ''} ${m.lastName || ''}`.trim())],
      ['Email', `<a href="mailto:${esc(m.email)}" style="color:${C.green};">${esc(m.email)}</a>`],
      ['Telefono', esc(m.phone)],
      m.vat ? ['P. IVA / VAT', esc(m.vat)] : null,
    ])}`)}
    ${section(`${label('Spedire a')}${text(`${esc(s.name)}<br>${esc(s.address?.line1)}<br>${esc(s.address?.postal_code)} ${esc(s.address?.city)} · ${esc(s.address?.country)}`, { color: C.green, size: 14 })}${totalLine('Spedizione pagata', euro(total))}`, { top: 32 })}
    ${noteBox('Da fare',
      'Prepara il box con le 6 specialità e spediscilo. Poi manda al cliente il numero di tracking: non parte in automatico.',
      button('Apri su Stripe', `https://dashboard.stripe.com/payments/${pi.id}`))}`;

  return _send({
    to: MERCHANT_TO,
    subject: `Box campioni pagato — ${m.company || 'rivenditore'} (${m.country || '—'})`,
    html: layout({
      eyebrow: 'Box campioni',
      title: ['Box campioni da spedire', esc(m.company || 'Nuovo rivenditore')],
      intro: 'Un rivenditore ha pagato la spedizione del box campioni (6 specialità).',
      pills: [{ text: 'Pagato', filled: true }, { text: `${euro(total)} · ${esc(m.country || '—')}` }],
      preheader: `${m.company || 'Un rivenditore'} ha pagato il box campioni.`,
    }, content),
    tag: 'merchant-sample-box',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  8c. BOX CAMPIONI PAGATO → cliente (in inglese)
//  Il tracking non parte in automatico (niente Packlink per il box): lo manda
//  il merchant a mano, quindi qui si promette solo "appena spedito".
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_BOX_ITEMS = [
  'Small capers in vinegar',
  'Lilliput capers in sea salt',
  'Caper powder',
  'Caper berries',
  'Caper leaves',
  'Caper shoots in vinegar',
];
const COUNTRY_EN = { BE: 'Belgium', IT: 'Italy', NL: 'Netherlands', LU: 'Luxembourg' };
const B2B_EMAIL = 'b2b@capperificiocaro.com';

export function sampleBoxConfirmationHtml(pi) {
  const m = pi.metadata || {};
  const s = pi.shipping || {};
  const ref = pi.id.slice(-8).toUpperCase();
  const country = COUNTRY_EN[s.address?.country] || s.address?.country || '';
  const amount = euroEn(pi.amount / 100);

  const content = `
    ${photo(`${SITE_URL}/images/email/sample-box.jpg`, 'Capperificio Caro jars on a stone table in Salento')}
    ${section(`${label("What's inside your box")}${list(SAMPLE_BOX_ITEMS.map((name, i) => ({ num: `0${i + 1}`, left: name })))}`, { top: 40 })}
    ${section(`${label('Details')}${details([
      ['Samples', 'Complimentary'],
      [`Shipping${country ? ` to ${esc(country)}` : ''}`, amount],
      ['Deliver to', [m.company, `${m.firstName || ''} ${m.lastName || ''}`.trim(), s.address?.line1,
        `${s.address?.postal_code || ''} ${s.address?.city || ''}${country ? ` · ${country}` : ''}`.trim()]
        .filter(Boolean).map(esc).join('<br>')],
    ])}${totalLine('Total paid', amount)}`, { top: 34 })}
    ${noteBox('What happens next',
      'We will email you the tracking number as soon as your box leaves Racale. Once you have tasted the products, we would be glad to plan a first trial order in retail or HoReCa formats.',
      button('Write to us', `mailto:${B2B_EMAIL}`))}
    ${signature('en')}`;

  return {
    subject: `Your Capperificio Caro sample box — #${ref}`,
    html: layout({
      lang: 'en',
      eyebrow: 'Trade samples',
      title: [`Thank you, ${esc(m.firstName) || 'partner'}.`, 'Your sample box is confirmed.'],
      intro: `We have received your payment. Our six specialities are being packed by hand in <span style="font-family:${SERIF};font-style:italic;font-size:17px;">Racale</span>, in the heart of Salento, and will be on their way to you shortly.`,
      pills: [{ text: `Reference #${ref}` }, { text: 'Payment received', filled: true }],
      preheader: 'Your six specialities from Racale are being packed by hand.',
    }, content),
  };
}

export async function sendSampleBoxConfirmation(pi, { to } = {}) {
  const email = to || pi.metadata?.email;
  if (!client || !email) return false;
  const { subject, html } = sampleBoxConfirmationHtml(pi);
  return _send({ to: email, subject, html, tag: 'sample-box-confirmation' });
}

// ─────────────────────────────────────────────────────────────────────────────
//  9. SCORTE IN ESAURIMENTO → merchant
//  products = [{ name, sku, stock }]  — UNA sola email riepilogativa per tutti
//  i prodotti sotto soglia (mai una email per prodotto: vedi server.js, che la
//  invia solo quando l'elenco dei prodotti sotto soglia cambia davvero).
// ─────────────────────────────────────────────────────────────────────────────
export async function sendMerchantLowStock(products, threshold = null) {
  if (!client || !MERCHANT_TO) return;

  const items = (Array.isArray(products) ? products : [products]).filter(Boolean);
  if (!items.length) return;

  const titolo = items.length === 1
    ? '1 prodotto in esaurimento'
    : `${items.length} prodotti in esaurimento`;

  const content = `
    ${section(`${label('Sotto soglia')}${list(items.map(p => ({
      left: esc(p.name || 'Prodotto'),
      sub: p.sku ? `SKU ${esc(p.sku)}` : '',
      right: `${p.stock ?? '—'} pz`,
      rightColor: (p.stock ?? 0) <= 0 ? C.danger : C.warning,
    })))}${button('Gestisci le scorte', `${SHOPWARE_URL}/admin#/sw/product/list`)}`)}
    ${section(text('Riceverai una nuova email solo quando l’elenco dei prodotti sotto soglia cambia.', { color: C.mid, size: 12 }), { top: 22 })}`;

  await _send({
    to: MERCHANT_TO,
    subject: `⚠ Scorte in esaurimento — ${titolo}`,
    html: layout({
      eyebrow: 'Inventario',
      title: ['Scorte in esaurimento', titolo],
      intro: `${items.length === 1
        ? 'Un prodotto è sceso sotto la soglia di scorta.'
        : `${items.length} prodotti sono scesi sotto la soglia di scorta.`}${threshold ? ` Soglia di allerta: <strong style="font-weight:500;">${threshold} unità</strong>.` : ''}`,
      preheader: titolo,
    }, content),
    tag: 'low-stock',
  });
}

// ── Invio centralizzato — best-effort, non lancia mai ─────────────────────────
//  Ritorna true solo se Resend ha accettato l'email. Il chiamante può quindi
//  decidere se ritentare più tardi (vedi la rete di sicurezza in server.js):
//  senza questo valore un errore Resend restava invisibile e l'email era persa.
//  3 tentativi con backoff: copre i 429/5xx transitori di Resend.
const SEND_RETRIES = 3;

async function _send({ to, subject, html, tag }) {
  for (let attempt = 1; attempt <= SEND_RETRIES; attempt++) {
    try {
      const { data, error } = await client.emails.send({ from: FROM, to, subject, html,
        tags: tag ? [{ name: 'type', value: tag }] : [],
      });
      if (error) throw new Error(error.message);
      console.log(`Resend ✓ [${tag || '—'}] → ${to} (id: ${data?.id})`);
      return true;
    } catch (e) {
      const last = attempt === SEND_RETRIES;
      console.error(`Resend ✗ [${tag || '—'}] → ${to} (tentativo ${attempt}/${SEND_RETRIES}):`, e.message);
      if (last) return false;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  return false;
}
