import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export default function NotFoundPage() {
  useSEO({ title: 'Pagina non trovata', noindex: true, canonical: false });

  return (
    <div style={{ padding: '100px 24px', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
      <p style={{ fontSize: 72, fontWeight: 700, color: 'var(--color-border)', margin: '0 0 8px' }}>404</p>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-3xl)', margin: '0 0 16px' }}>
        Pagina non trovata
      </h1>
      <p style={{ color: 'var(--color-mid)', fontSize: 15, marginBottom: 36 }}>
        La pagina che cerchi non esiste o è stata spostata.
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
