import { useState, useEffect, useRef, useId } from 'react';
import { SearchIcon, SpinnerIcon } from './CheckoutIcons';
import styles from './Checkout.module.css';

/**
 * Ricerca indirizzo su Nominatim (OpenStreetMap).
 *
 * Rispetto alla versione precedente:
 *  · si naviga da tastiera (frecce, Invio, Esc), non solo col mouse;
 *  · le richieste in volo vengono annullate, così una risposta lenta non
 *    sovrascrive più i risultati di una ricerca più recente;
 *  · la ricerca è limitata al paese selezionato, che è ciò che rendeva i
 *    risultati poco pertinenti (una "Via Roma" esiste in mezzo mondo);
 *  · le voci sono `<button>`: prima erano `<div>` con `onMouseDown`, invisibili
 *    a tastiera e screen reader.
 */
export default function AddressAutocomplete({ countryIso, onSelect, disabled }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [open, setOpen] = useState(false);
  // Distingue "non ho ancora cercato" da "ho cercato e non ho trovato nulla":
  // senza, l'avviso "nessun indirizzo trovato" lampeggiava appena digitato il
  // quarto carattere, prima ancora che la richiesta partisse.
  const [searched, setSearched] = useState(false);

  const listId = useId();
  const blurTimer = useRef(null);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  useEffect(() => {
    const term = query.trim();
    setSearched(false);
    if (term.length < 4) { setResults([]); setLoading(false); return; }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: term,
          format: 'json',
          addressdetails: '1',
          limit: '6',
        });
        // Restringe al paese scelto: senza questo i risultati arrivavano da
        // tutto il mondo e l'utente doveva scorrere per trovare casa propria.
        if (countryIso) params.set('countrycodes', countryIso.toLowerCase());

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { headers: { 'Accept-Language': 'it' }, signal: controller.signal }
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setHighlighted(-1);
      } catch (err) {
        if (err.name !== 'AbortError') setResults([]);
      } finally {
        if (!controller.signal.aborted) { setLoading(false); setSearched(true); }
      }
    }, 350);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, countryIso]);

  const choose = (result) => {
    const a = result.address || {};
    onSelect({
      street: a.road || a.pedestrian || a.footway || a.hamlet || '',
      houseNumber: a.house_number || '',
      city: a.city || a.town || a.village || a.municipality || a.county || '',
      zipcode: a.postcode || '',
      countryIso: (a.country_code || '').toUpperCase(),
    });
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      // Invio su un suggerimento sceglie l'indirizzo: non deve inviare il form.
      e.preventDefault();
      choose(results[highlighted]);
    } else if (e.key === 'Escape') {
      setResults([]);
      setOpen(false);
    }
  };

  const showList = open && (results.length > 0 || (searched && !loading));

  return (
    <div className={styles.autocomplete}>
      <SearchIcon size={17} className={styles.autocompleteIcon} />
      <input
        type="text"
        className={`${styles.input} ${styles.autocompleteInput}`}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150); }}
        onKeyDown={onKeyDown}
        placeholder="Cerca il tuo indirizzo…"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Cerca il tuo indirizzo"
      />
      {loading && <SpinnerIcon size={16} className={`${styles.autocompleteSpinner} ${styles.spinner}`} />}

      {showList && (
        <div className={styles.suggestions} id={listId} role="listbox">
          {results.length === 0 ? (
            <p className={styles.emptyHint}>
              Nessun indirizzo trovato. Compila i campi qui sotto a mano.
            </p>
          ) : (
            results.map((result, i) => {
              const a = result.address || {};
              const main = [a.road, a.house_number].filter(Boolean).join(' ')
                || result.display_name.split(',')[0];
              const meta = [a.postcode, a.city || a.town || a.village, a.country]
                .filter(Boolean).join(' · ');
              return (
                <button
                  key={result.place_id ?? i}
                  type="button"
                  role="option"
                  aria-selected={i === highlighted}
                  className={styles.suggestion}
                  style={i === highlighted ? { background: 'var(--color-cream)' } : undefined}
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => choose(result)}
                >
                  <span className={styles.suggestionMain}>{main}</span>
                  {meta && <span className={styles.suggestionMeta}>{meta}</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
