import { useState } from 'react';
import { subscribeNewsletter } from '../../lib/api/newsletter';
import styles from './Newsletter.module.css';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setError('');
    try {
      await subscribeNewsletter(email);
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Iscrizione non riuscita. Riprova più tardi.');
    }
  };

  return (
    <section className={styles.newsletter}>
      <div className={styles.inner}>
        <div>
          <h2 className={styles.heading}>Resta in contatto</h2>
          <p className={styles.sub}>Offerte esclusive, nuovi prodotti e ricette direttamente nella tua casella.</p>
        </div>

        {status === 'success' ? (
          <p className={styles.sub} role="status">Controlla la tua casella per confermare l'iscrizione.</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Il tuo indirizzo email"
              autoComplete="email"
              required
              disabled={status === 'loading'}
            />
            <button className={styles.button} type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Invio...' : <>Iscriviti &rarr;</>}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className={styles.error} role="alert">{error}</p>
        )}
      </div>
    </section>
  );
}
