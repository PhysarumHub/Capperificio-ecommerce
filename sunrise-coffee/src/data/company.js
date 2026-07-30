/**
 * Dati legali del titolare del trattamento / venditore.
 * Fonte unica per pagine legali, footer e markup JSON-LD.
 */
export const COMPANY = {
  /* Denominazione */
  legalName: "FARM & TECH AGRICOLA Società a Responsabilità Limitata Semplificata",
  legalNameShort: 'FARM & TECH AGRICOLA S.r.l.s.',
  brand: 'Capperificio di Racale',

  /* Identificativi fiscali */
  vat: '05222980756',
  taxCode: '05222980756',
  euVat: 'IT05222980756',
  rea: 'LE-351078',
  reaNumber: '351078',
  chamberOfCommerce: 'Camera di Commercio di Lecce',

  /* Sede legale */
  address: {
    street: 'Via Montesanto 64',
    zip: '73055',
    city: 'Racale',
    province: 'LE',
    region: 'Puglia',
    country: 'IT',
    countryName: 'Italia',
  },
  get addressLine() {
    const a = this.address;
    return `${a.street}, ${a.zip} ${a.city} (${a.province}) — ${a.countryName}`;
  },

  /* Contatti */
  email: 'info@capperificiocaro.com',
  emailPrivacy: 'privacy@capperificiocaro.com',
  emailOrders: 'ordini@capperificiocaro.com',
  emailB2B: 'b2b@capperificiocaro.com',
  pec: 'farmetechsrls@pec.agritel.it',

  /* Web */
  domain: 'capperificiocaro.com',
  siteUrl: 'https://capperificiocaro.com',
};

/** Ultimo aggiornamento dei documenti legali (mostrato in pagina). */
export const LEGAL_LAST_UPDATE = '30 luglio 2026';
