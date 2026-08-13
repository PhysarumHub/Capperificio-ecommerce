/**
 * Tema degli Stripe Elements, derivato dai token di `global.css`.
 *
 * Gli Elements vivono in un iframe e non vedono le CSS custom property della
 * pagina, quindi i valori vanno passati come stringhe. Prima erano scritti a
 * mano in esadecimale dentro il JSX del checkout: una copia muta della palette,
 * che restava indietro al primo ritocco al brand. Qui vengono letti a runtime
 * dai token veri, così il modulo di pagamento resta allineato da solo.
 */

function token(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Il font del brand, servito da /public/fonts, così anche i campi carta lo usano. */
export function stripeFonts() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return [
    { family: 'Paralucent', src: `url(${origin}/fonts/Paralucent-Medium.woff2)`, weight: '500' },
  ];
}

export function buildAppearance() {
  const dark = token('--color-dark', '#2C4A2C');
  const mid = token('--color-mid', '#6B8A6B');
  const accent = token('--color-red', '#547054');
  const border = token('--color-border', 'rgba(84, 112, 84, 0.22)');
  const light = token('--color-light', '#FCF3DF');

  return {
    theme: 'none',
    variables: {
      colorPrimary: accent,
      colorBackground: light,
      colorText: dark,
      colorTextSecondary: mid,
      colorTextPlaceholder: mid,
      colorDanger: accent,
      colorIcon: mid,
      fontFamily: 'Paralucent, system-ui, sans-serif',
      fontSizeBase: '16px',
      borderRadius: '0px',
      spacingUnit: '4px',
    },
    rules: {
      // Input a filo, coerenti con quelli del form fuori dall'iframe.
      '.Input': {
        border: 'none',
        borderBottom: `1.5px solid ${border}`,
        boxShadow: 'none',
        padding: '12px 0',
        backgroundColor: 'transparent',
        fontSize: '16px',
      },
      '.Input:hover': { borderBottom: `1.5px solid ${mid}` },
      '.Input:focus': {
        border: 'none',
        borderBottom: `1.5px solid ${dark}`,
        boxShadow: 'none',
        outline: 'none',
      },
      '.Input--invalid': { borderBottom: `1.5px solid ${accent}`, boxShadow: 'none' },

      '.Label': {
        fontSize: '11px',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: mid,
        marginBottom: '6px',
      },

      '.Tab': {
        border: 'none',
        borderBottom: `1.5px solid ${border}`,
        borderRadius: '0',
        boxShadow: 'none',
        backgroundColor: 'transparent',
        padding: '12px 8px',
      },
      '.Tab:hover': { borderBottom: `1.5px solid ${mid}`, boxShadow: 'none' },
      '.Tab--selected': {
        borderBottom: `2px solid ${dark}`,
        boxShadow: 'none',
        color: dark,
      },
      '.Tab--selected:focus': { boxShadow: 'none', outline: 'none' },
      '.TabLabel': { fontWeight: '500' },
      '.TabIcon--selected': { fill: accent },

      '.Error': { fontSize: '13px', marginTop: '6px' },
      '.RedirectText': { fontSize: '13px', color: mid },
    },
  };
}
