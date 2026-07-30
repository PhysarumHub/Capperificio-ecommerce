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
//    Merchant:
//      sendMerchantAlert(order, packlinkRef)     — nuovo ordine ricevuto
//      sendMerchantLowStock(product)             — scorte in esaurimento
// ─────────────────────────────────────────────────────────────────────────────

import { Resend } from 'resend';

const client = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM        = process.env.RESEND_FROM       || 'Capperificio di Racale <ordini@capperificiocaro.com>';
const MERCHANT_TO = process.env.RESEND_MERCHANT_TO || '';
const SITE_URL    = (process.env.FRONTEND_URL || 'https://capperificiocaro.com').replace(/\/$/, '');
const SHOPWARE_URL = `http://${process.env.SHOPWARE_DOMAIN || '157.90.241.97:8090'}`;

export function resendConfigured() { return Boolean(client); }

// ── Design tokens (speculari a global.css) ────────────────────────────────────
const C = {
  dark:    '#2C4A2C',   // color-dark
  green:   '#547054',   // color-red (brand green)
  mid:     '#6B8A6B',   // color-mid
  cream:   '#FCF3DF',   // body background
  mint:    '#EAF0E5',   // color-cream
  white:   '#FFFFFF',
  border:  'rgba(84,112,84,0.22)',
  warning: '#7A4800',
  warnBg:  '#FFF3E0',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function euro(n) {
  return typeof n === 'number' ? `€${n.toFixed(2).replace('.', ',')}` : '—';
}

function dateIt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function addr(a) {
  if (!a) return '';
  return [
    `${a.firstName || ''} ${a.lastName || ''}`.trim(),
    a.company,
    [a.street, a.additionalAddressLine2].filter(Boolean).join(' '),
    `${a.zipcode || ''} ${a.city || ''}`.trim(),
    a.country?.name || '',
  ].filter(Boolean).join('<br>');
}

function productRows(lineItems = []) {
  return (lineItems || [])
    .filter(i => i.type === 'product' || !i.type)
    .map(i => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${C.mint};font-size:14px;color:${C.dark};line-height:1.4;">
          ${i.label || '—'}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${C.mint};font-size:14px;color:${C.mid};text-align:center;white-space:nowrap;">
          ×${i.quantity || 1}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${C.mint};font-size:14px;color:${C.dark};text-align:right;white-space:nowrap;font-weight:600;">
          ${euro(i.price?.totalPrice)}
        </td>
      </tr>`).join('');
}

function totalsBlock(order) {
  const shipping = order.deliveries?.[0]?.shippingCosts?.totalPrice ?? 0;
  const total    = order.price?.totalPrice;
  const sub      = order.price?.positionPrice ?? (total - shipping);
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      ${sub != null ? `<tr>
        <td style="font-size:13px;color:${C.mid};padding:3px 0;">Subtotale</td>
        <td style="font-size:13px;color:${C.dark};text-align:right;padding:3px 0;">${euro(sub)}</td>
      </tr>` : ''}
      <tr>
        <td style="font-size:13px;color:${C.mid};padding:3px 0;">Spedizione</td>
        <td style="font-size:13px;text-align:right;padding:3px 0;">
          ${shipping <= 0
            ? `<span style="color:${C.green};font-weight:600;">Gratuita</span>`
            : euro(shipping)}
        </td>
      </tr>
      <tr>
        <td style="font-size:16px;font-weight:700;color:${C.dark};padding:12px 0 0;border-top:1.5px solid ${C.border};">Totale</td>
        <td style="font-size:16px;font-weight:700;color:${C.dark};text-align:right;padding:12px 0 0;border-top:1.5px solid ${C.border};">${euro(total)}</td>
      </tr>
    </table>`;
}

// ── Layout base ───────────────────────────────────────────────────────────────
function layout(title, eyebrow, content, { tag = '' } = {}) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${C.dark};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:${C.cream};padding:40px 16px 60px;">
  <tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width:600px;">

    <!-- Header -->
    <tr><td style="background:${C.dark};padding:32px 40px 28px;border-radius:10px 10px 0 0;text-align:center;">
      <p style="margin:0 0 10px;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:${C.mid};font-weight:600;">
        Capperificio di Racale
      </p>
      ${eyebrow ? `<p style="margin:0 0 6px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${C.green};">${eyebrow}</p>` : ''}
      <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;font-style:italic;color:${C.cream};letter-spacing:.02em;line-height:1.3;">
        ${title}
      </h1>
      ${tag ? `<div style="display:inline-block;margin-top:14px;background:${C.green};color:${C.cream};font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:4px 14px;border-radius:100px;">${tag}</div>` : ''}
    </td></tr>

    <!-- Body -->
    <tr><td style="background:${C.white};padding:36px 40px;border:1px solid ${C.mint};border-top:none;border-bottom:none;">
      ${content}
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:${C.dark};padding:24px 40px;border-radius:0 0 10px 10px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;color:${C.mid};letter-spacing:.06em;">
        <a href="${SITE_URL}/collections/all" style="color:${C.green};text-decoration:none;">Prodotti</a>
        &nbsp;·&nbsp;
        <a href="${SITE_URL}/storia" style="color:${C.green};text-decoration:none;">La nostra storia</a>
        &nbsp;·&nbsp;
        <a href="${SITE_URL}/contatti" style="color:${C.green};text-decoration:none;">Contatti</a>
      </p>
      <p style="margin:8px 0 0;font-size:10px;color:${C.mid};letter-spacing:.04em;opacity:.7;">
        © 2026 Capperificio di Racale · Racale (LE) ·
        <a href="${SITE_URL}" style="color:${C.mid};text-decoration:none;">capperificiocaro.com</a>
      </p>
      <p style="margin:6px 0 0;font-size:10px;color:${C.mid};opacity:.5;font-style:italic;">
        Capperi, cucunci e foglie. Tre generazioni di sapere artigianale.
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Componenti riusabili ──────────────────────────────────────────────────────
function badge(n) {
  return `
    <div style="background:${C.mint};border-left:3px solid ${C.dark};padding:16px 20px;margin-bottom:28px;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 3px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:${C.mid};font-weight:600;">Numero ordine</p>
      <p style="margin:0;font-size:22px;font-weight:700;color:${C.dark};letter-spacing:.04em;font-family:Georgia,'Times New Roman',serif;">#${n}</p>
    </div>`;
}

function cta(label, url) {
  return `
    <div style="text-align:center;margin:32px 0 8px;">
      <a href="${url}"
         style="display:inline-block;background:${C.green};color:${C.white};text-decoration:none;
                padding:13px 36px;border-radius:100px;font-size:12px;letter-spacing:.1em;
                text-transform:uppercase;font-weight:600;">
        ${label}
      </a>
    </div>`;
}

function label(text) {
  return `<h2 style="margin:0 0 10px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${C.mid};font-weight:600;border-bottom:1px solid ${C.mint};padding-bottom:8px;">${text}</h2>`;
}

function infoBlock(html) {
  return `<div style="background:${C.mint};padding:16px 20px;border-radius:6px;margin-bottom:24px;">${html}</div>`;
}

function warnBlock(html) {
  return `<div style="background:${C.warnBg};border-left:3px solid #E07000;padding:14px 18px;border-radius:0 6px 6px 0;margin-bottom:24px;">
    <p style="margin:0;font-size:13px;color:${C.warning};line-height:1.6;">${html}</p>
  </div>`;
}

function successBlock(html) {
  return `<div style="background:#E8F0E4;border-left:3px solid #5A8A4A;padding:14px 18px;border-radius:0 6px 6px 0;margin-bottom:24px;">
    <p style="margin:0;font-size:13px;color:#2C4A2C;line-height:1.6;">${html}</p>
  </div>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid ${C.mint};margin:24px 0;">`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. CONFERMA ORDINE → cliente
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOrderConfirmation(order) {
  if (!client) return;
  const to = order.orderCustomer?.email;
  if (!to) return console.warn('Resend sendOrderConfirmation: email cliente mancante');
  const num = order.orderNumber || order.id;
  const firstName = order.orderCustomer?.firstName || 'Cliente';
  const delivery = order.deliveries?.[0]?.shippingOrderAddress;

  const content = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:${C.mid};">
      Ciao <strong style="color:${C.dark};">${firstName}</strong>,<br>
      il tuo ordine è confermato. Lo stiamo preparando con cura nel nostro laboratorio a Racale.
    </p>

    ${badge(num)}

    ${label('Prodotti ordinati')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:left;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Prodotto</th>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:center;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Qtà</th>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:right;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Prezzo</th>
        </tr>
      </thead>
      <tbody>${productRows(order.lineItems)}</tbody>
    </table>

    ${totalsBlock(order)}

    ${delivery ? `${label('Indirizzo di spedizione')}<p style="margin:0 0 28px;font-size:14px;line-height:1.8;color:${C.dark};">${addr(delivery)}</p>` : ''}

    ${successBlock('Riceverai una seconda email non appena la spedizione partirà, con il numero di tracking.')}

    ${cta('Scopri altri prodotti', `${SITE_URL}/collections/all`)}

    <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:${C.mid};text-align:center;">
      Per qualsiasi domanda scrivi a <a href="mailto:ordini@capperificiocaro.com" style="color:${C.green};">ordini@capperificiocaro.com</a>
    </p>`;

  await _send({
    to,
    subject: `Ordine #${num} confermato — Capperificio di Racale`,
    html: layout('Il tuo ordine è confermato', 'Conferma ordine', content, { tag: `#${num}` }),
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
  const firstName = order.orderCustomer?.firstName || 'Cliente';
  const delivery = order.deliveries?.[0]?.shippingOrderAddress;

  const trackBlock = tracking.number
    ? `${label('Traccia la tua spedizione')}
       ${infoBlock(`
         <p style="margin:0 0 4px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};">Corriere</p>
         <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:${C.dark};">${tracking.carrier || '—'}</p>
         <p style="margin:0 0 4px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};">Numero di tracking</p>
         <p style="margin:0;font-size:15px;font-weight:700;color:${C.dark};">${tracking.number}</p>
       `)}
       ${tracking.url ? cta('Traccia il pacco', tracking.url) : ''}`
    : warnBlock('I dettagli di tracking saranno disponibili a breve sul sito del corriere.');

  const content = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:${C.mid};">
      Ciao <strong style="color:${C.dark};">${firstName}</strong>,<br>
      ottima notizia — il tuo ordine è partito ed è in viaggio verso di te.
    </p>

    ${badge(num)}

    ${trackBlock}

    ${delivery ? `${label('Indirizzo di consegna')}<p style="margin:0 0 28px;font-size:14px;line-height:1.8;color:${C.dark};">${addr(delivery)}</p>` : ''}

    ${divider()}

    ${label('Prodotti in spedizione')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:left;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Prodotto</th>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:center;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Qtà</th>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:right;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Prezzo</th>
        </tr>
      </thead>
      <tbody>${productRows(order.lineItems)}</tbody>
    </table>

    <p style="margin:0;font-size:12px;line-height:1.7;color:${C.mid};text-align:center;">
      Per qualsiasi domanda scrivi a <a href="mailto:ordini@capperificiocaro.com" style="color:${C.green};">ordini@capperificiocaro.com</a>
    </p>`;

  await _send({
    to,
    subject: `Il tuo ordine #${num} è in viaggio — Capperificio di Racale`,
    html: layout('Il tuo ordine è partito', 'Spedizione confermata', content, { tag: 'In spedizione' }),
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
  const firstName = order.orderCustomer?.firstName || 'Cliente';

  const content = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:${C.mid};">
      Ciao <strong style="color:${C.dark};">${firstName}</strong>,<br>
      il tuo ordine è stato annullato come da tua richiesta (o a causa di un problema tecnico).
    </p>

    ${badge(num)}

    ${warnBlock(`Il rimborso verrà accreditato sul tuo metodo di pagamento entro <strong>3-5 giorni lavorativi</strong>. I tempi dipendono dalla tua banca o circuito di pagamento.`)}

    ${label('Prodotti dell\'ordine annullato')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:left;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Prodotto</th>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:center;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Qtà</th>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:right;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Prezzo</th>
        </tr>
      </thead>
      <tbody>${productRows(order.lineItems)}</tbody>
    </table>

    ${totalsBlock(order)}

    ${cta('Torna allo shop', `${SITE_URL}/collections/all`)}

    <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:${C.mid};text-align:center;">
      Hai bisogno di assistenza? <a href="mailto:ordini@capperificiocaro.com" style="color:${C.green};">ordini@capperificiocaro.com</a>
    </p>`;

  await _send({
    to,
    subject: `Ordine #${num} annullato — Capperificio di Racale`,
    html: layout('Ordine annullato', 'Cancellazione ordine', content, { tag: `#${num}` }),
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
  const firstName = order.orderCustomer?.firstName || 'Cliente';

  const content = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:${C.mid};">
      Ciao <strong style="color:${C.dark};">${firstName}</strong>,<br>
      abbiamo elaborato un rimborso per il tuo ordine.
    </p>

    ${badge(num)}

    ${infoBlock(`
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};">Importo rimborsato</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:${C.dark};font-family:Georgia,'Times New Roman',serif;">${euro(amount)}</p>
    `)}

    ${warnBlock('Il rimborso sarà visibile sul tuo conto entro <strong>3-5 giorni lavorativi</strong>, in base ai tempi della tua banca.')}

    ${cta('Torna allo shop', `${SITE_URL}/collections/all`)}

    <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:${C.mid};text-align:center;">
      Domande? <a href="mailto:ordini@capperificiocaro.com" style="color:${C.green};">ordini@capperificiocaro.com</a>
    </p>`;

  await _send({
    to,
    subject: `Rimborso di ${euro(amount)} per l'ordine #${num}`,
    html: layout(`Rimborso di ${euro(amount)} emesso`, 'Rimborso', content, { tag: `#${num}` }),
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
  const name = customer.firstName || 'Cliente';

  const content = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:${C.mid};">
      Ciao <strong style="color:${C.dark};">${name}</strong>,<br>
      benvenuto nel Capperificio di Racale. Siamo felici di averti con noi.
    </p>

    ${infoBlock(`
      <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;font-style:italic;color:${C.dark};line-height:1.5;">
        "Tre generazioni di sapere artigianale tra le distese di Racale, in Puglia."
      </p>
      <p style="margin:0;font-size:13px;color:${C.mid};line-height:1.6;">
        Coltiviamo e selezioniamo capperi con cura, rispettando la terra e i ritmi della natura — perché il gusto autentico non si improvvisa.
      </p>
    `)}

    ${label('Cosa puoi fare ora')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${C.mint};font-size:14px;color:${C.dark};">
          <span style="color:${C.green};font-weight:700;margin-right:10px;">→</span>
          Scopri la nostra selezione di capperi, cucunci e foglie
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${C.mint};font-size:14px;color:${C.dark};">
          <span style="color:${C.green};font-weight:700;margin-right:10px;">→</span>
          Leggi la storia del Capperificio sul nostro blog
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-size:14px;color:${C.dark};">
          <span style="color:${C.green};font-weight:700;margin-right:10px;">→</span>
          Sei un rivenditore? Scopri le condizioni B2B
        </td>
      </tr>
    </table>

    ${cta('Esplora i prodotti', `${SITE_URL}/collections/all`)}`;

  await _send({
    to,
    subject: 'Benvenuto nel Capperificio di Racale',
    html: layout('Benvenuto', 'Nuovo account', content),
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
  const name = customer.firstName || 'Cliente';

  const content = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:${C.mid};">
      Ciao <strong style="color:${C.dark};">${name}</strong>,<br>
      abbiamo ricevuto una richiesta di reset della password per il tuo account.
    </p>

    ${cta('Reimposta la password', resetUrl)}

    ${warnBlock(`Questo link è valido per <strong>2 ore</strong>. Se non hai richiesto il reset, puoi ignorare questa email — il tuo account rimane al sicuro.`)}

    <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:${C.mid};text-align:center;">
      Se il pulsante non funziona, copia e incolla questo URL nel browser:<br>
      <a href="${resetUrl}" style="color:${C.green};word-break:break-all;">${resetUrl}</a>
    </p>`;

  await _send({
    to,
    subject: 'Reimposta la tua password — Capperificio di Racale',
    html: layout('Reimposta la password', 'Sicurezza account', content),
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
  const firstName = order.orderCustomer?.firstName || 'Cliente';
  const items = (order.lineItems || []).filter(i => i.type === 'product' || !i.type);

  const productList = items.map(i => `
    <li style="padding:8px 0;border-bottom:1px solid ${C.mint};font-size:14px;color:${C.dark};">
      ${i.label || '—'}
    </li>`).join('');

  const content = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:${C.mid};">
      Ciao <strong style="color:${C.dark};">${firstName}</strong>,<br>
      speriamo che i tuoi capperi siano arrivati in perfetta forma e che tu li stia gustando.
    </p>

    ${infoBlock(`
      <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-style:italic;color:${C.dark};">
        Cosa ne pensi del tuo acquisto?
      </p>
      <p style="margin:0;font-size:13px;color:${C.mid};line-height:1.6;">
        La tua opinione è preziosa per noi e per chi non ci conosce ancora. Lasciare una recensione richiede solo un minuto.
      </p>
    `)}

    ${label('Prodotti acquistati')}
    <ul style="margin:0 0 28px;padding:0;list-style:none;">${productList}</ul>

    ${cta('Lascia una recensione', `${SITE_URL}/collections/all`)}

    <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:${C.mid};text-align:center;">
      Hai avuto problemi con l'ordine #${num}? Scrivici a<br>
      <a href="mailto:ordini@capperificiocaro.com" style="color:${C.green};">ordini@capperificiocaro.com</a>
    </p>`;

  await _send({
    to,
    subject: 'Come sono stati i tuoi capperi? — Capperificio di Racale',
    html: layout('Com\'è andata?', 'La tua opinione', content),
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
  const shippingMethod = order.deliveries?.[0]?.shippingMethod?.name || '—';

  const plBlock = packlinkRef
    ? successBlock(`Draft Packlink creato: <strong>${packlinkRef}</strong><br>
        <a href="https://pro.packlink.com/shipment/${packlinkRef}" style="color:${C.dark};font-weight:600;">
          Seleziona corriere e stampa etichetta →
        </a>`)
    : warnBlock('Nessun draft Packlink creato automaticamente. Crea la spedizione manualmente su <a href="https://pro.packlink.com" style="color:#7A4800;">pro.packlink.com</a>');

  const content = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:${C.mid};">
      Nuovo ordine pagato e confermato.
    </p>

    <div style="display:flex;gap:12px;margin-bottom:24px;">
      ${infoBlock(`
        <p style="margin:0 0 3px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:${C.mid};">Ordine</p>
        <p style="margin:0;font-size:24px;font-weight:700;color:${C.dark};font-family:Georgia,'Times New Roman',serif;">#${num}</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:${C.green};">${euro(total)}</p>
      `)}
    </div>

    ${label('Cliente')}
    <p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:${C.dark};">
      ${customer.firstName || ''} ${customer.lastName || ''}<br>
      <a href="mailto:${customer.email}" style="color:${C.green};">${customer.email || '—'}</a>
    </p>

    ${label('Prodotti')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:left;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Prodotto</th>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:center;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Qtà</th>
          <th style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${C.mid};text-align:right;padding-bottom:8px;border-bottom:1.5px solid ${C.border};">Prezzo</th>
        </tr>
      </thead>
      <tbody>${productRows(order.lineItems)}</tbody>
    </table>

    ${totalsBlock(order)}

    ${delivery ? `${label('Spedire a')}
    <p style="margin:0 0 6px;font-size:14px;line-height:1.8;color:${C.dark};">${addr(delivery)}</p>
    <p style="margin:0 0 24px;font-size:12px;color:${C.mid};">Metodo: ${shippingMethod}</p>` : ''}

    ${divider()}
    ${plBlock}

    ${cta('Apri in Shopware', `${SHOPWARE_URL}/admin#/sw/order/list`)}`;

  await _send({
    to: MERCHANT_TO,
    subject: `Nuovo ordine #${num} — ${euro(total)}`,
    html: layout(`Nuovo ordine #${num}`, 'Alert merchant', content, { tag: euro(total) }),
    tag: 'merchant-alert',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  9. SCORTE IN ESAURIMENTO → merchant
//  product = { name, sku, stock, threshold }
// ─────────────────────────────────────────────────────────────────────────────
export async function sendMerchantLowStock(product) {
  if (!client || !MERCHANT_TO) return;

  const content = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:${C.mid};">
      Un prodotto sta esaurendo le scorte.
    </p>

    ${warnBlock(`
      <strong>${product.name || 'Prodotto'}</strong>${product.sku ? ` (SKU: ${product.sku})` : ''}<br>
      Scorte rimanenti: <strong>${product.stock ?? '—'} unità</strong><br>
      ${product.threshold ? `Soglia di allerta: ${product.threshold} unità` : ''}
    `)}

    ${cta('Gestisci le scorte in Shopware', `${SHOPWARE_URL}/admin#/sw/product/list`)}`;

  await _send({
    to: MERCHANT_TO,
    subject: `⚠ Scorte in esaurimento: ${product.name || 'Prodotto'}`,
    html: layout('Scorte in esaurimento', 'Alert inventario', content),
    tag: 'low-stock',
  });
}

// ── Invio centralizzato — best-effort, non lancia mai ─────────────────────────
async function _send({ to, subject, html, tag }) {
  try {
    const { data, error } = await client.emails.send({ from: FROM, to, subject, html,
      tags: tag ? [{ name: 'type', value: tag }] : [],
    });
    if (error) throw new Error(error.message);
    console.log(`Resend ✓ [${tag || '—'}] → ${to} (id: ${data?.id})`);
  } catch (e) {
    console.error(`Resend ✗ [${tag || '—'}] → ${to}:`, e.message);
  }
}
