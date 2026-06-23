// ─────────────────────────────────────────────────────────────────────────────
//  Rate limiter best-effort per serverless.
//
//  ⚠ Limite: la Map è in-memory e si azzera ad ogni cold start, quindi NON è
//     una protezione forte. Per limiti reali e condivisi tra le istanze usare
//     Upstash Redis (@upstash/ratelimit). Vedi SECURITY-AUDIT.md.
//     Qui serve solo come prima barriera contro gli abusi banali.
// ─────────────────────────────────────────────────────────────────────────────

const buckets = new Map();

/**
 * Estrae l'IP client. Su Vercel x-forwarded-for è impostato dall'edge:
 * il PRIMO valore è il client reale (i successivi sono proxy interni).
 */
export function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Ritorna true se l'IP ha superato `max` richieste nella finestra `windowMs`.
 */
export function isRateLimited(key, { windowMs = 15 * 60 * 1000, max = 20 } = {}) {
  const now = Date.now();
  const start = now - windowMs;
  const hits = (buckets.get(key) || []).filter((t) => t > start);
  hits.push(now);
  buckets.set(key, hits);
  return hits.length > max;
}
