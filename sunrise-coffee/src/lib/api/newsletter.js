async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Errore di rete');
  return data;
}

/** Avvia l'iscrizione alla newsletter (Shopware Store API, double opt-in). */
export function subscribeNewsletter(email) {
  return postJson('/api/newsletter/subscribe', { email });
}

/** Conferma l'iscrizione a partire dai parametri del link ricevuto via email. */
export function confirmNewsletter({ em, hash }) {
  return postJson('/api/newsletter/confirm', { em, hash });
}
