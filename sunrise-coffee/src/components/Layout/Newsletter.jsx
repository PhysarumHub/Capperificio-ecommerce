import styles from './Newsletter.module.css';

export default function Newsletter() {
  return (
    <section className={styles.newsletter}>
      <div className={styles.inner}>
        <div>
          <h2 className={styles.heading}>Resta in contatto</h2>
          <p className={styles.sub}>Offerte esclusive, nuovi prodotti e ricette direttamente nella tua casella.</p>
        </div>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <input
            className={styles.input}
            type="email"
            placeholder="Il tuo indirizzo email"
            autoComplete="email"
          />
          <button className={styles.button} type="submit">Iscriviti &rarr;</button>
        </form>
      </div>
    </section>
  );
}
