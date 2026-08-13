/**
 * Icone di linea del checkout.
 *
 * Sostituiscono le emoji usate prima (📧 📦 🔒 ⏳ ⚠ 🔍 🏷): un'emoji viene
 * disegnata dal sistema operativo, quindi cambia forma e colore su ogni
 * dispositivo e non eredita mai il colore del brand. Questi tratti seguono
 * invece la stessa grammatica del logo — 1.5px, currentColor, niente riempimenti.
 */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  xmlns: 'http://www.w3.org/2000/svg',
};

/** Dimensione di default coerente col testo accanto a cui stanno. */
function Icon({ size = 18, children, ...rest }) {
  return <svg {...base} width={size} height={size} aria-hidden="true" focusable="false" {...rest}>{children}</svg>;
}

export function CheckIcon(props) {
  return <Icon {...props}><path d="m4 12.5 5 5L20 6.5" /></Icon>;
}

export function LockIcon(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="10.5" width="16" height="10.5" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </Icon>
  );
}

export function SearchIcon(props) {
  return <Icon {...props}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></Icon>;
}

export function MailIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </Icon>
  );
}

export function TruckIcon(props) {
  return (
    <Icon {...props}>
      <path d="M2.5 6.5h11v9h-11z" />
      <path d="M13.5 10h4l3 3v2.5h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Icon>
  );
}

export function TagIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3.5 11.2V4.5a1 1 0 0 1 1-1h6.7a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-6.7 6.7a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7Z" />
      <circle cx="7.8" cy="7.8" r="1.4" />
    </Icon>
  );
}

export function AlertIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5" />
      <path d="M12 16.2v.3" />
    </Icon>
  );
}

export function ChevronIcon({ up = false, ...props }) {
  return (
    <Icon {...props} style={{ transform: up ? 'rotate(180deg)' : 'none', transition: 'transform .2s', ...props.style }}>
      <path d="m6 9.5 6 6 6-6" />
    </Icon>
  );
}

export function PencilIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    </Icon>
  );
}

export function ArrowRightIcon(props) {
  return <Icon {...props}><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></Icon>;
}

export function ArrowLeftIcon(props) {
  return <Icon {...props}><path d="M20 12H5" /><path d="m11 6-6 6 6 6" /></Icon>;
}

/** Rotella di attesa: anello parziale che gira. L'animazione vive nel CSS module. */
export function SpinnerIcon({ size = 18, className = '' }) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" />
    </svg>
  );
}
