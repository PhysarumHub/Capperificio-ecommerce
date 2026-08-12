import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { confirmNewsletter } from '../lib/api/newsletter';

export default function NewsletterConfirmPage() {
  useSEO({ title: 'Conferma iscrizione newsletter', noindex: true, canonical: false });

  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    const em = searchParams.get('em');
    const hash = searchParams.get('hash');
    if (!em || !hash) { setStatus('error'); return; }
    confirmNewsletter({ em, hash })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  const MESSAGES = {
    loading: { title: 'Conferma in corso...', body: 'Un attimo, stiamo confermando la tua iscrizione.' },
    success: { title: 'Iscrizione confermata', body: 'Da ora riceverai le nostre offerte e novità via email.' },
    error:   { title: 'Link non valido', body: 'Il link di conferma non è valido o è scaduto. Puoi iscriverti di nuovo dalla home.' },
  };
  const { title, body } = MESSAGES[status];

  return (
    <div style={{ padding: '100px 24px', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-3xl)', margin: '0 0 16px' }}>
        {title}
      </h1>
      <p style={{ color: 'var(--color-mid)', fontSize: 15, marginBottom: 36 }}>
        {body}
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-block', background: 'var(--color-red)', color: '#fff',
          padding: '14px 36px', borderRadius: 'var(--radius-pill)',
          textDecoration: 'none', fontWeight: 600, fontSize: 15,
        }}
      >
        Torna alla home
      </Link>
    </div>
  );
}
