import styles from './Newsletter.module.css';

export default function Newsletter() {
  return (
    <section className={styles.newsletter}>
      <div className={styles.inner}>
        <div>
          <h2 className={styles.heading}>Join the club</h2>
          <p className={styles.sub}>Receive special offers and first look at new products.</p>
        </div>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email address"
            autoComplete="email"
          />
          <button className={styles.button} type="submit">Subscribe &rarr;</button>
        </form>
      </div>
    </section>
  );
}
