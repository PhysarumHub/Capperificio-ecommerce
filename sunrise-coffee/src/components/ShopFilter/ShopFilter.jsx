import { useState } from 'react';
import styles from './ShopFilter.module.css';

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

/* ── Lista opzioni (condivisa desktop + mobile) ──────────────────────────── */
function OptionList({ section, selected, onToggle }) {
  return (
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
  );
}

/* ── Accordion (desktop) ─────────────────────────────────────────────────── */
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
      {open && <OptionList section={section} selected={selected} onToggle={onToggle} />}
    </div>
  );
}

/* ── Componente principale ──────────────────────────────────────────────── */
export default function ShopFilter({ filters, onChange, isMobileOpen, onClose }) {
  const [activeTab, setActiveTab] = useState(0);

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

  const getSelected = (section) =>
    section.single
      ? (filters[section.key] ? [filters[section.key]] : [])
      : (filters[section.key] || []);

  const activeSection = FILTER_SECTIONS[activeTab];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isMobileOpen ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.sidebar} ${isMobileOpen ? styles.open : ''}`}
        aria-label="Filtri prodotto"
      >
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>
            Filtri
            {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
          </span>
          <div className={styles.headerActions}>
            {activeCount > 0 && (
              <button type="button" className={styles.reset} onClick={reset}>Reset</button>
            )}
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Chiudi filtri">✕</button>
          </div>
        </div>

        {/* ── DESKTOP: accordion ── */}
        <div className={styles.desktopSections}>
          {FILTER_SECTIONS.map((section) => (
            <FilterSection
              key={section.key}
              section={section}
              selected={getSelected(section)}
              onToggle={toggle}
            />
          ))}
        </div>

        {/* ── MOBILE: tabs ── */}
        <div className={styles.mobileTabs}>
          <div className={styles.tabBar}>
            {FILTER_SECTIONS.map((section, i) => {
              const count = getSelected(section).length;
              return (
                <button
                  key={section.key}
                  type="button"
                  className={`${styles.tab} ${activeTab === i ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {section.title}
                  {count > 0 && <span className={styles.tabBadge}>{count}</span>}
                </button>
              );
            })}
          </div>

          <div className={styles.tabContent}>
            <OptionList
              section={activeSection}
              selected={getSelected(activeSection)}
              onToggle={toggle}
            />
          </div>
        </div>

        {/* Applica — mobile */}
        <div className={styles.mobileFooter}>
          <button type="button" className={styles.applyBtn} onClick={onClose}>
            Applica filtri{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      </aside>
    </>
  );
}
