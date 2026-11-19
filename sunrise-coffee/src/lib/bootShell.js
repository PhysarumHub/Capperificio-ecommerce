/**
 * Shell statico della home (vedi index.html, #boot-shell).
 *
 * L'<img> dell'hero nello shell è già dipinta quando React parte: ne
 * teniamo il riferimento prima che createRoot svuoti #root, così Hero
 * può rimettere nel DOM lo stesso nodo (nello stesso commit, quindi senza
 * un frame vuoto) invece di crearne uno nuovo. Per il browser resta un solo
 * elemento LCP, dipinto subito, e l'immagine non sfarfalla.
 * Deve essere importato da main.jsx prima del render.
 */
let heroImg = document.querySelector('#boot-shell .boot-hero img');

/** Restituisce l'immagine dello shell una sola volta (poi null). */
export function takeBootHeroImg() {
  const img = heroImg;
  heroImg = null;
  return img;
}
