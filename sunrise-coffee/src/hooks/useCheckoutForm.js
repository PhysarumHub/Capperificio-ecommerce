import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { isValidPostcode, isValidPhone, splitStreetHouseNumber } from '../lib/utils/address';

/**
 * Stato del form di checkout: valori, campi toccati, validazione e persistenza.
 *
 * La persistenza usa `sessionStorage` e non `localStorage`: sono dati personali
 * (nome, indirizzo, email) e devono sparire alla chiusura della scheda, ma
 * sopravvivere a un refresh o al ritorno dall'app in background su mobile —
 * che prima azzerava il form e rimandava l'utente all'inizio.
 */

const STORAGE_KEY = 'sunrise.checkout.form';

const EMPTY = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  street: '',
  houseNumber: '',
  zipcode: '',
  city: '',
  countryIso: '',
  company: '',
  vatId: '',
};

/** Solo questi campi vengono riletti dallo storage: ignora chiavi estranee. */
function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return Object.fromEntries(
      Object.keys(EMPTY)
        .filter((k) => typeof parsed[k] === 'string')
        .map((k) => [k, parsed[k]])
    );
  } catch {
    return null;
  }
}

/**
 * Paese preselezionato: Italia.
 *
 * Prima veniva dedotto dalla lingua del browser, che è un pessimo indizio sulla
 * posizione: chi tiene il sistema in inglese si ritrovava "Stati Uniti", con la
 * spedizione estera e la regola del CAP sbagliate su un negozio che vende quasi
 * solo in Italia. Chi spedisce altrove cambia una tendina; tutti gli altri non
 * toccano niente.
 */
const DEFAULT_COUNTRY_ISO = 'IT';

/** Campi che compongono ciascuna sezione, nell'ordine in cui appaiono. */
export const CONTACT_FIELDS = ['firstName', 'lastName', 'email'];
export const ADDRESS_FIELDS = ['street', 'houseNumber', 'zipcode', 'city'];

export function useCheckoutForm({ customer, isLoggedIn }) {
  const [values, setValues] = useState(() => ({
    ...EMPTY,
    countryIso: DEFAULT_COUNTRY_ISO,
    ...readStored(),
  }));
  const [touched, setTouched] = useState({});

  // Salva a ogni modifica. Se lo storage è pieno o disabilitato (Safari privato)
  // il checkout deve funzionare lo stesso: la persistenza è un comfort, non un
  // requisito.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch { /* storage non disponibile: si prosegue senza persistenza */ }
  }, [values]);

  // Precompila dai dati del cliente loggato senza sovrascrivere quello che
  // l'utente ha già scritto a mano: un login a metà checkout non deve
  // cancellargli l'indirizzo appena inserito.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!isLoggedIn || !customer || prefilledRef.current) return;
    prefilledRef.current = true;
    const saved = customer.defaultShippingAddress;
    setValues((prev) => {
      const next = { ...prev };
      const fill = (key, value) => { if (value && !next[key]?.trim()) next[key] = value; };
      fill('email', customer.email);
      fill('firstName', customer.firstName);
      fill('lastName', customer.lastName);
      if (saved) {
        const { street, houseNumber } = splitStreetHouseNumber(saved.street);
        fill('street', street);
        fill('houseNumber', houseNumber);
        fill('zipcode', saved.zipcode);
        fill('city', saved.city);
        fill('phone', saved.phoneNumber);
        if (saved.country?.iso && !prev.countryIso) next.countryIso = saved.country.iso;
      }
      return next;
    });
  }, [isLoggedIn, customer]);

  const setField = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  /** Applica più campi in un colpo (autocomplete indirizzo, wallet). */
  const setFields = useCallback((patch) => {
    setValues((prev) => ({ ...prev, ...patch }));
    setTouched((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((k) => { next[k] = true; });
      return next;
    });
  }, []);

  const markTouched = useCallback((key) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  /** Errore di un campo, ignorando lo stato "toccato" quando `force` è true. */
  const errorFor = useCallback((key, force = false) => {
    if (!force && !touched[key]) return null;
    const value = values[key];
    const required = [...CONTACT_FIELDS, ...ADDRESS_FIELDS].includes(key);
    if (required && !value?.trim()) return 'Campo obbligatorio';
    if (key === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
      return 'Controlla l’indirizzo email';
    if (key === 'zipcode' && value?.trim() && !isValidPostcode(value, values.countryIso))
      return 'CAP non valido per il paese scelto';
    if (key === 'phone' && !isValidPhone(value)) return 'Numero di telefono non valido';
    return null;
  }, [values, touched]);

  /** Sezione valida a prescindere da cosa l'utente ha già toccato. */
  const isSectionValid = useCallback((fields) =>
    fields.every((f) => !errorFor(f, true)), [errorFor]);

  /**
   * Segna toccati i campi della sezione e dice se è valida: usato quando si
   * prova ad andare avanti, così gli errori compaiono tutti insieme.
   */
  const validateSection = useCallback((fields) => {
    setTouched((prev) => {
      const next = { ...prev };
      fields.forEach((f) => { next[f] = true; });
      return next;
    });
    return fields.every((f) => !errorFor(f, true));
  }, [errorFor]);

  const contactValid = useMemo(() => isSectionValid(CONTACT_FIELDS), [isSectionValid]);
  const addressValid = useMemo(
    () => isSectionValid(ADDRESS_FIELDS) && !errorFor('phone', true),
    [isSectionValid, errorFor]
  );

  /** Ordine concluso: i dati personali non devono restare nella sessione. */
  const clearStorage = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* nulla da pulire */ }
  }, []);

  return {
    values, touched, setField, setFields, markTouched,
    errorFor, validateSection, contactValid, addressValid, clearStorage,
  };
}
