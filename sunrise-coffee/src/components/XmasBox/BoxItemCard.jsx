import styles from './BoxItemCard.module.css';

/* Riga prodotto del configuratore: miniatura, nome in Editorial corsivo,
   costo in gettoni e comando a destra. Compatta di proposito: su mobile
   devono stare più prodotti per schermata.
   variant 'radio' → scelta esclusiva (vino o olio). */

export function Coins({ n, className = '' }) {
  return (
    <span className={`${styles.coins} ${className}`} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <span key={i} className={styles.coin} />)}
    </span>
  );
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}
function MinusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>;
}
function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}

export default function BoxItemCard({ product: p, state, onAdd, onRemove, variant = 'qty' }) {
  const { qty, canAdd, reason, swap } = state;
  const selected = qty > 0;
  const costLabel = p.cost === 1 ? '1 gettone' : `${p.cost} gettoni`;
  const fullName = `${p.name}, ${p.detail}`;
  const locked = !selected && !canAdd;
  const radio = variant === 'radio';

  // tocco su miniatura o testo = aggiungi (o scegli, per vino/olio)
  const tapRow = (e) => {
    if (e.target.closest('button')) return;
    if (radio) { if (!selected && canAdd) onAdd(); return; }
    if (canAdd) onAdd();
  };

  let control;
  if (radio) {
    control = (
      <button
        type="button"
        className={`${styles.pick} ${selected ? styles.pickOn : ''}`}
        role="radio"
        aria-checked={selected}
        aria-label={`${selected ? 'Scelto' : swap ? 'Scegli al posto dell’altro' : 'Scegli'}: ${fullName}, ${costLabel}`}
        disabled={!selected && !canAdd}
        onClick={() => (selected ? onRemove() : onAdd())}
      >
        {selected ? <><CheckIcon /> Scelto</> : swap ? 'Cambia' : 'Scegli'}
      </button>
    );
  } else if (selected) {
    control = (
      <div className={styles.qty}>
        <button type="button" className={styles.qtyBtn} onClick={onRemove} aria-label={`Togli ${fullName}`}><MinusIcon /></button>
        <span className={styles.qtyNum} key={qty} aria-live="polite">{qty}</span>
        <button type="button" className={styles.qtyBtn} onClick={onAdd} disabled={!canAdd} aria-label={`Aggiungi un altro ${fullName}`}><PlusIcon /></button>
      </div>
    );
  } else {
    control = (
      <button type="button" className={styles.add} onClick={onAdd} disabled={!canAdd} aria-label={`Aggiungi ${fullName}, ${costLabel}`}>
        <PlusIcon />
      </button>
    );
  }

  const note = !selected && reason ? reason : p.note;

  return (
    <li
      className={[styles.row, selected && styles.selected, locked && styles.locked].filter(Boolean).join(' ')}
      onClick={tapRow}
    >
      <span className={styles.thumb}>
        <img src={p.image} alt="" width="600" height="720" loading="lazy" decoding="async" />
        {selected && !radio && <span className={styles.badge} aria-hidden="true">{qty}</span>}
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{p.name}</span>
        <span className={styles.detail}>{p.detail}</span>
        {p.producer && <span className={styles.producer}>{p.producer}</span>}
        {note && <span className={`${styles.note} ${!selected && reason ? styles.noteWarn : ''}`}>{note}</span>}
      </span>
      <span className={styles.side}>
        <span className={styles.cost} title={costLabel}>
          <Coins n={p.cost} /><span className="sr-only">{costLabel}</span>
        </span>
        {control}
      </span>
    </li>
  );
}
