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

export function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></svg>
  );
}

export function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z"/>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#fff"/>
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
    </svg>
  );
}

export function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>
  );
}
