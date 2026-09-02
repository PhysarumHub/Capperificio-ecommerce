/**
 * Ricomprime *in place* le immagini raster in public/images/ senza cambiarne
 * path né estensione: i riferimenti nel codice restano validi e il deploy non
 * richiede modifiche. Serve solo a ridurre i byte trasferiti (Lighthouse
 * "Improve image delivery" / "enormous network payloads").
 *
 *   - jpg/jpeg  → mozjpeg progressive, qualità 72
 *   - png       → palette + compressione max (foto: resta png ma più leggero)
 *   - webp      → qualità 72, effort 5
 *   - resize    → lato lungo max 1920px (override per-file sotto)
 *
 * Sovrascrive un file solo se il risultato è più piccolo di almeno 8 KB.
 * L'originale resta recuperabile da git (tutte queste immagini sono tracciate).
 *
 * Uso:
 *   node scripts/optimize-public-images.mjs            # applica
 *   node scripts/optimize-public-images.mjs --dry      # solo report
 */
import sharp from 'sharp';
import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, extname, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const IMAGES_DIR = join(ROOT, 'public', 'images');
const DRY = process.argv.includes('--dry');

const DEFAULT_MAX_EDGE = 1920;
const MIN_SAVING_BYTES = 8 * 1024;

// Override per singoli file (match sul path relativo a public/images/).
// Le immagini prodotto/placeholder non vengono mai mostrate oltre ~700px.
const OVERRIDES = [
  { test: /^PRODUCTSTILL\.jpg$/i, maxEdge: 900, quality: 70 },
  { test: /^HERO\.jpe?g$/i,       maxEdge: 1600, quality: 74 },
  { test: /^capperificio-caro-capperi-racale\.webp$/i, maxEdge: 1400, quality: 68 },
  { test: /^territorio\//i,       maxEdge: 1600 },
  { test: /^Storia\//i,           maxEdge: 1600 },
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function optionsFor(rel) {
  const o = OVERRIDES.find((x) => x.test.test(rel)) || {};
  return { maxEdge: o.maxEdge ?? DEFAULT_MAX_EDGE, quality: o.quality ?? 72 };
}

async function reencode(full, rel) {
  const ext = extname(full).toLowerCase();
  const { maxEdge, quality } = optionsFor(rel);

  let pipe = sharp(full, { failOn: 'none' }).rotate();
  const meta = await pipe.metadata();
  const longEdge = Math.max(meta.width || 0, meta.height || 0);
  if (longEdge > maxEdge) {
    pipe = pipe.resize({
      width: meta.width >= meta.height ? maxEdge : undefined,
      height: meta.height > meta.width ? maxEdge : undefined,
      withoutEnlargement: true,
    });
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    pipe = pipe.jpeg({ quality, progressive: true, mozjpeg: true });
  } else if (ext === '.png') {
    pipe = pipe.png({ compressionLevel: 9, palette: true, quality: 80 });
  } else if (ext === '.webp') {
    pipe = pipe.webp({ quality, effort: 5 });
  } else {
    return null; // svg / gif / altro: non toccare
  }

  return pipe.toBuffer();
}

const RASTER = new Set(['.jpg', '.jpeg', '.png', '.webp']);

let totalBefore = 0;
let totalAfter = 0;
const rows = [];

for (const full of walk(IMAGES_DIR)) {
  const ext = extname(full).toLowerCase();
  if (!RASTER.has(ext)) continue;

  const rel = relative(IMAGES_DIR, full);
  const before = statSync(full).size;

  let buf;
  try {
    buf = await reencode(full, rel);
  } catch (err) {
    rows.push([rel, before, before, `ERRORE: ${err.message}`]);
    totalBefore += before;
    totalAfter += before;
    continue;
  }
  if (!buf) continue;

  const saving = before - buf.length;
  const keep = saving >= MIN_SAVING_BYTES;

  if (keep && !DRY) writeFileSync(full, buf);

  totalBefore += before;
  totalAfter += keep ? buf.length : before;
  rows.push([rel, before, keep ? buf.length : before, keep ? (DRY ? 'da ottimizzare' : 'ottimizzata') : 'invariata']);
}

const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB';
rows.sort((a, b) => (b[1] - b[2]) - (a[1] - a[2]));

console.log('\n  prima →   dopo   risparmio  file');
console.log('  ' + '─'.repeat(70));
for (const [rel, b, a, note] of rows) {
  if (b === a && note === 'invariata') continue;
  console.log(`  ${kb(b)} → ${kb(a)}  ${kb(b - a)}  ${rel}  ${note === 'ottimizzata' || note === 'da ottimizzare' ? '' : '(' + note + ')'}`);
}
console.log('  ' + '─'.repeat(70));
console.log(`  TOTALE  ${kb(totalBefore)} → ${kb(totalAfter)}   risparmio ${kb(totalBefore - totalAfter)}` + (DRY ? '  [dry run, nessun file scritto]' : ''));
console.log('');
