// ─────────────────────────────────────────────────────────────────────────────
//  Helper per i codici promozionali Shopware.
//
//  Shopware rappresenta una promozione applicata come line item di tipo
//  `promotion` con prezzo negativo. Uno sconto sulla spedizione, invece, NON
//  compare nel prezzo del line item (che resta 0): Shopware aggiunge una seconda
//  `delivery` con shippingCosts negativi. Per questo il costo di spedizione va
//  sempre sommato su TUTTE le deliveries.
// ─────────────────────────────────────────────────────────────────────────────

/** Line item di tipo promozione presenti nel carrello. */
export function getPromotionItems(cart) {
  return (cart?.lineItems ?? []).filter((i) => i.type === 'promotion');
}

/**
 * Promozioni applicate raggruppate per codice.
 * Una singola promozione può generare più line item (uno per scope: carrello,
 * spedizione…): all'utente va mostrata come un codice solo.
 */
export function getAppliedPromotions(cart) {
  const groups = new Map();
  for (const item of getPromotionItems(cart)) {
    const code = item.payload?.code || item.referencedId || item.label;
    const group = groups.get(code) || { code, label: item.label, ids: [], discount: 0 };
    group.ids.push(item.id);
    group.discount += item.price?.totalPrice ?? 0;
    groups.set(code, group);
  }
  return [...groups.values()];
}

/** Sconto totale sui prodotti (valore negativo, 0 se nessuna promozione). */
export function getPromotionDiscount(cart) {
  return getPromotionItems(cart).reduce((sum, i) => sum + (i.price?.totalPrice ?? 0), 0);
}

/** Costo di spedizione reale: somma su tutte le deliveries (incluse quelle di sconto). */
export function getShippingCosts(cart) {
  return (cart?.deliveries ?? []).reduce((sum, d) => sum + (d.shippingCosts?.totalPrice ?? 0), 0);
}

/** Sconto applicato alla spedizione (valore negativo, 0 se nessuno). */
export function getShippingDiscount(cart) {
  return (cart?.deliveries ?? []).reduce((sum, d) => {
    const cost = d.shippingCosts?.totalPrice ?? 0;
    return cost < 0 ? sum + cost : sum;
  }, 0);
}

/**
 * Esito dell'applicazione di un codice.
 * Shopware risponde 200 anche quando il codice non esiste o non è applicabile:
 * l'unica prova di successo è la presenza del line item promozione.
 */
export function promotionResult(cart, code) {
  const wanted = (code || '').trim().toUpperCase();
  const applied = getPromotionItems(cart).find(
    (i) => (i.referencedId || i.payload?.code || '').toUpperCase() === wanted
  );
  if (applied) return { ok: true, item: applied };

  // Cerca un messaggio di errore utile fra quelli restituiti dal carrello
  const errors = Object.values(cart?.errors ?? {});
  const failure = errors.find(
    (e) => /promotion/i.test(e?.messageKey || e?.key || '') && (e?.level ?? 0) > 0
  );
  const notFound = errors.some((e) => /not-found/i.test(e?.messageKey || e?.key || ''));

  return {
    ok: false,
    message: notFound
      ? 'Codice non valido.'
      : failure?.message || 'Codice non valido o non applicabile a questo carrello.',
  };
}
