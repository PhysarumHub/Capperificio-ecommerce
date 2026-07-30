import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // Se Sentry è configurato in futuro: Sentry.captureException(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
          <p style={{ fontSize: 48, margin: '0 0 12px' }}>⚠</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-3xl)', margin: '0 0 16px' }}>
            Qualcosa è andato storto
          </h1>
          <p style={{ color: 'var(--color-mid)', fontSize: 15, marginBottom: 32 }}>
            Si è verificato un errore inaspettato. Ricarica la pagina o torna alla home.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              style={{
                padding: '12px 28px', background: 'var(--color-dark)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
              }}
            >
              Ricarica
            </button>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              style={{
                padding: '12px 28px', background: 'transparent', color: 'var(--color-dark)',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-pill)',
                textDecoration: 'none', fontWeight: 600, fontSize: 14,
              }}
            >
              Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
