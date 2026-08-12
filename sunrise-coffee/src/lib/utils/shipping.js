/**
 * Soglia (€) oltre la quale la spedizione è gratuita.
 *
 * ⚠ Questo valore è solo per la UI (barra "ti mancano X € alla spedizione
 * gratuita" nel carrello). Il costo di spedizione REALE è sempre quello
 * calcolato da Shopware sul carrello, che tiene conto anche del paese di
 * destinazione: la promo "spedizione gratuita" è configurata solo per l'Italia.
 *
 * Non usare questa soglia per decidere se mostrare "Gratuita" nel riepilogo
 * ordine — per quello serve `isShippingFree()`, che legge il costo effettivo.
 */
export const FREE_SHIPPING_THRESHOLD = 50;

/**
 * La spedizione è gratuita solo se Shopware ha effettivamente azzerato il costo.
 *
 * Non inferire la gratuità dal subtotale: un ordine da 60 € verso l'estero
 * supera la soglia ma paga comunque la spedizione, e mostrare "Gratuita"
 * mentre il totale include il costo rende il riepilogo incoerente con
 * l'importo addebitato.
 */
export function isShippingFree(shippingCost) {
  return shippingCost <= 0;
}
