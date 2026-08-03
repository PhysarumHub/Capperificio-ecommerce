export function SunLogo({ className = '', size = 'nav' }) {
  if (size === 'footer') {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 48 C44.15 48 54 38.15 54 26" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M32 48 C19.85 48 10 38.15 10 26" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="32" y1="6" x2="32" y2="18" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="14" y1="12" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="50" y1="12" x2="42" y2="22" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="6" y1="26" x2="16" y2="28" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="58" y1="26" x2="48" y2="28" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="22" y1="8" x2="27" y2="20" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="42" y1="8" x2="37" y2="20" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="32" y1="48" x2="32" y2="48" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="4" y1="48" x2="60" y2="48" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 38 C44.15 38 54 28.15 54 16" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M32 38 C19.85 38 10 28.15 10 16" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="32" y1="0" x2="32" y2="12" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="16" y1="4" x2="23" y2="14" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="48" y1="4" x2="41" y2="14" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="6" y1="16" x2="16" y2="18" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="58" y1="16" x2="48" y2="18" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="22" y1="1" x2="27" y2="13" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="42" y1="1" x2="37" y2="13" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="4" y1="38" x2="60" y2="38" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
  );
}

export function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
  );
}

