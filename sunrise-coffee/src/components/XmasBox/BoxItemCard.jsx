import styles from './BoxItemCard.module.css';

/* Card prodotto del configuratore: stessa grammatica della ProductCard del
   sito (riquadro bianco arrotondato, nome in Editorial corsivo, comando
   tondo verde in basso a destra), più il costo in gettoni e lo stato.
   variant 'radio' → scelta esclusiva (vino o olio). */

export function Coins({ n, className = '' }) {
  return (
    <span className={`${styles.coins} ${className}`} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <span key={i} className={styles.coin} />)}
    </span>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
  );
}

export default function BoxItemCard({ product: p, state, onAdd, onRemove, variant = 'qty' }) {
  const { qty, canAdd, reason, swap } = state;
  const selected = qty > 0;
  const costLabel = p.cost === 1 ? '1 gettone' : `${p.cost} gettoni`;
  const fullName = `${p.name}, ${p.detail}`;
  const locked = !selected && !canAdd;

  const tapImage = (e) => {
    if (e.target.closest('button')) return; // i comandi gestiscono da soli il click
    if (variant === 'radio') { if (!selected && canAdd) onAdd(); return; }
    if (canAdd) onAdd();
  };

  let control;
  if (variant === 'radio') {
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
        {selected ? <><CheckIcon /> Scelto</> : swap ? 'Scegli questo' : 'Scegli'}
      </button>
    );
  } else if (selected) {
    control = (
      <div className={styles.qty}>
        <button type="button" className={styles.qtyBtn} onClick={onRemove} aria-label={`Togli ${fullName}`}>−</button>
        <span className={styles.qtyNum} key={qty} aria-live="polite">{qty}</span>
        <button type="button" className={styles.qtyBtn} onClick={onAdd} disabled={!canAdd} aria-label={`Aggiungi un altro ${fullName}`}>+</button>
      </div>
    );
  } else {
    control = (
      <button type="button" className={styles.add} onClick={onAdd} disabled={!canAdd} aria-label={`Aggiungi ${fullName}, ${costLabel}`}>
        <PlusIcon />
      </button>
    );
  }

  return (
    <article className={[styles.card, selected && styles.selected, locked && styles.locked].filter(Boolean).join(' ')}>
      <div className={styles.imgWrap} onClick={tapImage}>
        <span className={`${styles.cost} ${p.cost > 1 ? styles.costTwo : ''}`}>
          <Coins n={p.cost} /> {costLabel}
        </span>
        {selected && variant !== 'radio' && (
          <span className={styles.inBox} aria-hidden="true"><CheckIcon /></span>
        )}
        <img src={p.image} alt="" className={styles.img} width="600" height="720" loading="lazy" decoding="async" />
        {control}
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{p.name}</h3>
        <span className={styles.detail}>{p.detail}</span>
        {p.producer && <span className={styles.producer}>{p.producer}</span>}
        <span className={`${styles.note} ${!selected && reason ? styles.noteWarn : ''}`}>
          {!selected && reason ? reason : p.note}
        </span>
      </div>
    </article>
  );
}
