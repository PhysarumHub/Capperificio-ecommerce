/**
 * Utility per gli indirizzi del checkout.
 */

/**
 * Shopware salva via e civico in un unico campo `street` (es. "Via Roma 12/A"):
 * per popolare i due campi separati del form lo spezziamo sull'ultimo gruppo
 * numerico. Se non c'è un civico riconoscibile, tutto resta nella via.
 */
export function splitStreetHouseNumber(street) {
  const match = /^(.*?)[,\s]+(\d+[a-zA-Z/\-]*)\s*$/.exec((street || '').trim());
  return match
    ? { street: match[1].trim(), houseNumber: match[2] }
    : { street: (street || '').trim(), houseNumber: '' };
}

/** Ricompone il campo `street` nel formato che si aspetta Shopware. */
export function joinStreetHouseNumber(street, houseNumber) {
  return [street, houseNumber].filter(Boolean).join(', ');
}

/**
 * Formati CAP per paese.
 *
 * Serve perché la regola unica precedente (`/^\d{4,10}$/`) rifiutava come "non
 * valido" ogni CAP alfanumerico: Regno Unito (SW1A 1AA), Paesi Bassi (1234 AB)
 * e Canada (K1A 0B1) sono tutti nella lista dei paesi spedibili, quindi era un
 * checkout bloccato per chiunque ordinasse da lì.
 *
 * I paesi non elencati ricadono su una regola permissiva: meglio accettare un
 * CAP strano che bloccare un ordine legittimo — tanto la validazione vera la fa
 * comunque Shopware al momento dell'ordine.
 */
const POSTCODE_RULES = {
  IT: /^\d{5}$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
  ES: /^\d{5}$/,
  FI: /^\d{5}$/,
  US: /^\d{5}(-\d{4})?$/,
  AT: /^\d{4}$/,
  BE: /^\d{4}$/,
  CH: /^\d{4}$/,
  DK: /^\d{4}$/,
  NO: /^\d{4}$/,
  HU: /^\d{4}$/,
  AU: /^\d{4}$/,
  NZ: /^\d{4}$/,
  SE: /^\d{3}\s?\d{2}$/,
  PL: /^\d{2}-?\d{3}$/,
  CZ: /^\d{3}\s?\d{2}$/,
  SK: /^\d{3}\s?\d{2}$/,
  PT: /^\d{4}(-\d{3})?$/,
  GR: /^\d{3}\s?\d{2}$/,
  JP: /^\d{3}-?\d{4}$/,
  NL: /^\d{4}\s?[A-Za-z]{2}$/,
  GB: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/,
  CA: /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/,
  IE: /^[A-Za-z]\d{2}\s?[A-Za-z\d]{4}$/,
};

/** Regola di ripiego: 3-10 caratteri alfanumerici, con spazi o trattini interni. */
const POSTCODE_FALLBACK = /^[A-Za-z\d][A-Za-z\d\s-]{1,8}[A-Za-z\d]$/;

/** true se il CAP è plausibile per il paese indicato. */
export function isValidPostcode(zipcode, countryIso) {
  const value = (zipcode || '').trim();
  if (!value) return false;
  const rule = POSTCODE_RULES[(countryIso || '').toUpperCase()];
  return rule ? rule.test(value) : POSTCODE_FALLBACK.test(value);
}

/**
 * Esempio di CAP valido per il paese, da mostrare come placeholder.
 * Un formato atteso visibile previene l'errore invece di segnalarlo dopo.
 */
const POSTCODE_EXAMPLES = {
  IT: '73055', DE: '10115', FR: '75001', ES: '28001', GB: 'SW1A 1AA',
  NL: '1012 AB', CA: 'K1A 0B1', US: '10001', AT: '1010', BE: '1000',
  CH: '8001', PT: '1000-001', SE: '111 22', PL: '00-001', JP: '100-0001',
};

export function postcodeExample(countryIso) {
  return POSTCODE_EXAMPLES[(countryIso || '').toUpperCase()] || '00100';
}

/**
 * Telefono: opzionale ovunque, ma quando c'è deve essere componibile da un
 * corriere. Accettiamo prefisso internazionale, spazi, punti, trattini e
 * parentesi, chiedendo solo che restino almeno 7 cifre.
 */
export function isValidPhone(phone) {
  const value = (phone || '').trim();
  if (!value) return true;
  if (!/^\+?[\d\s().-]+$/.test(value)) return false;
  return (value.match(/\d/g) || []).length >= 7;
}
