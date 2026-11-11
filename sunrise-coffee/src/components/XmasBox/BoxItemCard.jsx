import ui from './xmasUi.module.css';
import styles from './BoxItemCard.module.css';

/* Card prodotto del configuratore: vasetto su tessera crema, nome, costo in
   gettoni e comandi − n + a destra. In griglia a due colonne su desktop,
   una sotto l'altra su mobile.
   variant 'radio' → scelta esclusiva (vino o olio). */

export function Coins({ n, className = '' }) {
  return (
    <span className={`${ui.coins} ${className}`} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <span key={i} className={ui.coin} />)}
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

  // tocco su vasetto o testo = aggiungi (o scegli, per vino/olio)
  const tapCard = (e) => {
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
  } else {
    control = (
      <span className={styles.qty}>
        {selected && (
          <>
            <button type="button" className={styles.qtyBtn} onClick={onRemove} aria-label={`Togli ${fullName}`}><MinusIcon /></button>
            <span className={styles.qtyNum} key={qty} aria-live="polite">{qty}</span>
          </>
        )}
        <button
          type="button"
          className={`${styles.qtyBtn} ${styles.qtyAdd}`}
          onClick={onAdd}
          disabled={!canAdd}
          aria-label={`${selected ? 'Aggiungi un altro' : 'Aggiungi'} ${fullName}, ${costLabel}`}
        >
          <PlusIcon />
        </button>
      </span>
    );
  }

  const warn = !selected && reason;

  return (
    <li
      className={[styles.card, selected && styles.selected, locked && styles.locked].filter(Boolean).join(' ')}
      onClick={tapCard}
    >
      <span className={styles.thumb}>
        <img src={p.image} alt="" width="600" height="720" loading="lazy" decoding="async" />
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{p.name}</span>
        <span className={styles.detail}>{p.detail}</span>
        {p.producer && <span className={styles.detail}>{p.producer}</span>}
        <span className={styles.cost}><Coins n={p.cost} /> {costLabel}</span>
        {warn && <span className={styles.warn}>{reason}</span>}
      </span>
      {control}
    </li>
  );
}
