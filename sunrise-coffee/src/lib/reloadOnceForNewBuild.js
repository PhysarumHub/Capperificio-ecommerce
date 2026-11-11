/* Dopo un deploy i file JS cambiano nome (hash): una scheda aperta prima
   chiede chunk che non esistono più. Ricarica la pagina una sola volta per
   prendere la versione nuova; il segno in sessionStorage evita i loop se il
   problema è un altro (rete assente, file davvero mancante).
   Ritorna true se la pagina sta per ricaricarsi. */
const KEY = 'caro:chunk-reload';

export function reloadOnceForNewBuild() {
  try {
    const last = Number(sessionStorage.getItem(KEY)) || 0;
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
