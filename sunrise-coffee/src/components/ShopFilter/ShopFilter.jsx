import { useState } from 'react';
import styles from './ShopFilter.module.css';

/* ── Configurazione sezioni filtro ─────────────────────────────────────────── */

const FILTER_SECTIONS = [
  {
    key:    'tipo',
    title:  'Tipo',
    items:  ['Cappero', 'Cucunci', 'Foglie', 'Polvere'],
    single: false,
  },
  {
    key:    'formato',
    title:  'Formato',
    items:  ['Lilliput', 'Occhio di pernice', 'Lacrimella', 'Capperone'],
    single: false,
  },
  {
    key:    'conservazione',
    title:  'Conservazione',
    items:  ['Sotto sale', 'Sotto aceto di vino', 'Sotto aceto di mele'],
    single: false,
  },
  {
    key:    'priceRange',
    title:  'Prezzo',
    items:  ['Fino a €10', '€10 – €13', 'Oltre €13'],
    single: true,
  },
];

/* ── Sezione accordion singola ──────────────────────────────────────────────── */

function FilterSection({ section, selected, onToggle }) {
  const [open, setOpen] = useState(true);

  return (
    <div className={styles.section}>
      <button
        type="button"
        className={styles.sectionHead}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{section.title}</span>
        <span className={styles.arrow}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <ul className={styles.list}>
          {section.items.map((item) => {
            const checked = selected.includes(item);
            return (
              <li key={item}>
                <label className={styles.label}>
                  <span className={`${styles.check} ${checked ? styles.checked : ''}`} aria-hidden="true" />
                  <input
                    type="checkbox"
                    className={styles.hiddenInput}
                    checked={checked}
                    onChange={() => onToggle(section.key, item, section.single)}
                  />
                  {item}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── Componente principale ──────────────────────────────────────────────────── */

export default function ShopFilter({ filters, onChange, isMobileOpen, onClose }) {
  const toggle = (key, item, single) => {
    if (single) {
      onChange({ ...filters, [key]: filters[key] === item ? '' : item });
    } else {
      const current = filters[key] || [];
      const next = current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item];
      onChange({ ...filters, [key]: next });
    }
  };

  const activeCount =
    (filters.tipo?.length          || 0) +
    (filters.formato?.length       || 0) +
    (filters.conservazione?.length || 0) +
    (filters.priceRange            ? 1 : 0);

  const reset = () =>
    onChange({ tipo: [], formato: [], conservazione: [], priceRange: '' });

  return (
    <>
      {/* Backdrop mobile */}
      {isMobileOpen && (
        <div
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${isMobileOpen ? styles.open : ''}`}
        aria-label="Filtri prodotto"
      >
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>
            Filtri
            {activeCount > 0 && (
              <span className={styles.badge}>{activeCount}</span>
            )}
          </span>
          <div className={styles.headerActions}>
            {activeCount > 0 && (
              <button type="button" className={styles.reset} onClick={reset}>
                Reset
              </button>
            )}
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Chiudi filtri"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sezioni */}
        {FILTER_SECTIONS.map((section) => (
          <FilterSection
            key={section.key}
            section={section}
            selected={
              section.single
                ? (filters[section.key] ? [filters[section.key]] : [])
                : (filters[section.key] || [])
            }
            onToggle={toggle}
          />
        ))}
      </aside>
    </>
  );
}
