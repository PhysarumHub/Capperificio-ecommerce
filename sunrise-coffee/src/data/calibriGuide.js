/**
 * GUIDA AI CALIBRI — contenuto educativo per la sezione "Guida al calibro"
 * nella pagina prodotto (ProductDetail.jsx).
 *
 * Il calibro indica il diametro del bocciolo di cappero al momento della
 * raccolta: i quattro calibri qui sotto sono quelli usati dal Capperificio
 * Caro per classificare a mano la produzione di Racale.
 */

export const CALIBRI_INFO = [
  {
    key: 'lilliput',
    name: 'Lilliput',
    diameter: 'Ø 4–6 mm',
    weight: '75 g',
    description: 'Il calibro più piccolo e pregiato: bocciolo raccolto giovanissimo, selezionato uno per uno a mano. Concentra più aromi in meno polpa — la scelta della cucina gourmet.',
  },
  {
    key: 'occhio di pernice',
    name: 'Occhio di Pernice',
    diameter: 'Ø 7–9 mm',
    weight: '150 g',
    description: 'Il calibro intermedio, il più versatile: sapidità equilibrata, mai invadente. Il punto di partenza ideale per l’uso quotidiano.',
  },
  {
    key: 'lacrimella',
    name: 'Lacrimella',
    diameter: 'Ø 9–11 mm',
    weight: '250 g',
    description: 'Calibro medio-grande, polpa carnosa e gusto pieno. Regge bene la cottura senza perdere struttura né aroma.',
  },
  {
    key: 'capperone',
    name: 'Capperone',
    diameter: 'Ø 12–15 mm',
    weight: '250 g',
    description: 'Il calibro più grande, raccolto pochi giorni prima che il bocciolo fiorisca in cucuncio. Aroma intenso e persistente, ideale nei sughi lunghi.',
  },
];

export const CALIBRO_EXPLAINER_HTML = `
  <p>Il <strong>calibro</strong> indica il diametro del bocciolo di cappero al momento della raccolta, misurato in millimetri. A Racale ogni bocciolo viene raccolto e classificato <strong>a mano, uno per uno</strong>: prima viene colto, più piccolo e delicato è il calibro; più tempo resta sulla pianta, più cresce e si fa carnoso.</p>
  <p>Non è un indice di qualità ma di <strong>carattere</strong>: i calibri piccoli come il Lilliput concentrano più aromi in meno polpa, quelli grandi come il Capperone offrono più struttura e resistono meglio alle cotture lunghe.</p>
`;

/**
 * Trova la scheda calibro corrispondente a un'etichetta libera
 * (es. "Lilliput · Ø 4–6 mm" oppure il customField Shopware capperificio_calibro).
 */
export function matchCalibro(label) {
  if (!label) return null;
  const lower = label.toLowerCase();
  return CALIBRI_INFO.find((c) => lower.includes(c.key)) || null;
}

export function buildCalibroCompareHtml(activeKey) {
  const rows = CALIBRI_INFO.map((c) => {
    const isActive = c.key === activeKey;
    const style = isActive ? ' style="font-weight:700;color:var(--color-red)"' : '';
    return `<tr${style}><td>${c.name}${isActive ? ' — questo prodotto' : ''}</td><td>${c.diameter} · ${c.weight}</td></tr>`;
  }).join('');
  const active = CALIBRI_INFO.find((c) => c.key === activeKey);
  const activeDescription = active ? `<p>${active.description}</p>` : '';
  return `<table><tbody>${rows}</tbody></table>${activeDescription}`;
}
