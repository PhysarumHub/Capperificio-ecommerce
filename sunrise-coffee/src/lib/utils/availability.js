/**
 * Single source of truth for product availability.
 *
 * All sold-out checks across the app go through these functions so that the
 * logic never diverges between listing cards, the product detail page and the
 * cart.
 *
 * Shopware semantics (important, and the source of most past bugs):
 *  - `available` is computed server-side as `!isCloseout || availableStock >= minPurchase`.
 *    When present it is authoritative: a product with `available: true` is
 *    purchasable even with `availableStock === 0` (backorder / non-closeout).
 *  - `availableStock` alone means nothing: for a variant parent it is usually 0,
 *    and for a non-closeout product it can be 0 while the product still sells.
 *  - Therefore: never test `availableStock <= 0` outside this module.
 *
 * Every API call that feeds these helpers must request `available`, `isCloseout`,
 * `availableStock`, `minPurchase` and `maxPurchase` — see `lib/api/products.js`.
 */

/** Returns the first numeric value among the arguments, or null. */
function firstNumber(...values) {
  for (const v of values) if (typeof v === 'number' && !Number.isNaN(v)) return v;
  return null;
}

/**
 * Returns true when a standalone product or a variant child is purchasable.
 *
 * Order of trust: Shopware's own `available` flag → closeout rules → stock.
 * When we have no stock information at all we assume purchasable and let the
 * Store API be the gate (see `getCartStockIssues`), because rendering a false
 * "Esaurito" on a buyable product is the worse failure mode.
 */
export function isProductAvailable(product) {
  if (!product) return false;

  // 1. Server-computed flag — authoritative when the API returned it.
  if (typeof product.available === 'boolean') return product.available;

  // 2. Non-closeout products keep selling at stock 0.
  if (product.isCloseout === false) return true;

  // 3. Fall back to stock only for closeout / unknown-closeout products.
  const stock = firstNumber(product.availableStock, product.stock);
  if (stock === null) return true;
  return stock >= (firstNumber(product.minPurchase) ?? 1);
}

/**
 * Maximum quantity the customer may put in the cart for this product.
 * Returns 0 for sold-out products and Infinity when nothing limits the qty.
 * Used to cap every "+" control so the UI can never promise more than Shopware
 * will accept.
 */
export function getMaxPurchasable(product) {
  if (!isProductAvailable(product)) return 0;

  const limits = [];
  const maxPurchase = firstNumber(product.maxPurchase);
  if (maxPurchase !== null && maxPurchase > 0) limits.push(maxPurchase);

  // Stock caps the quantity only when the product stops selling at 0.
  if (product.isCloseout) {
    const stock = firstNumber(product.availableStock, product.stock);
    if (stock !== null) limits.push(stock);
  }

  return limits.length ? Math.max(0, Math.min(...limits)) : Infinity;
}

/**
 * Builds a map of { [optionName]: boolean } for a list of variant children.
 * Used by ProductCard to disable individual variant chips.
 *
 * Keyed on the child's first option so that it always matches the keys built by
 * `buildVariantMap` (optionName → childId) in `lib/utils/variants.js`.
 *
 * @param {Array} variants  - array of Shopware variant product objects
 * @returns {Record<string, boolean>}
 */
export function buildVariantAvailabilityMap(variants) {
  const map = {};
  for (const v of variants || []) {
    const name = v.options?.[0]?.translated?.name || v.options?.[0]?.name;
    if (name) map[name] = isProductAvailable(v);
  }
  return map;
}

/**
 * Builds a map of { [propertyGroupOptionId]: boolean } for the PDP configurator.
 * An option is selectable when at least one available variant carries it, which
 * is the correct rule for multi-group configurators (e.g. formato × peso).
 *
 * @param {Array} variants - loaded child variants
 * @returns {Record<string, boolean>}
 */
export function buildOptionAvailabilityMap(variants) {
  const map = {};
  for (const v of variants || []) {
    const available = isProductAvailable(v);
    for (const o of v.options || []) {
      if (!o?.id) continue;
      map[o.id] = map[o.id] || available;
    }
  }
  return map;
}

/**
 * Resolves whether a product should be treated as sold-out for display/cart.
 *
 * Rules (in order):
 *  1. Variant product + variants still loading → never flash "sold out"
 *  2. Variant product + active variant known   → check that specific variant
 *  3. Variant product + all variants loaded    → sold-out only if ALL variants unavailable
 *  4. Standalone product                       → check product directly
 *
 * Note that rule 1 makes this function optimistic while loading; callers must
 * pair it with `canAddToCart` so the button is never *actionable* before the
 * variant that would be added is known.
 *
 * @param {object} opts
 * @param {object}  opts.product          - Shopware product (parent or standalone)
 * @param {boolean} opts.hasConfigurator  - true when product has variant groups
 * @param {object|null} opts.activeVariant - the currently selected child variant (or null)
 * @param {Array}  opts.variants          - loaded child variants (may be empty during fetch)
 * @param {boolean} opts.variantsLoaded   - true once the variant fetch has settled
 */
export function resolveProductSoldOut({ product, hasConfigurator, activeVariant, variants, variantsLoaded }) {
  if (!product) return false;

  if (hasConfigurator) {
    if (!variantsLoaded) return false;                          // still loading — no flash
    if (activeVariant) return !isProductAvailable(activeVariant);
    return (variants || []).length > 0 && variants.every(v => !isProductAvailable(v));
  }

  return !isProductAvailable(product);
}

/**
 * Sold-out state for a listing card built from a grouped product.
 * Mirrors `resolveProductSoldOut` for the listing case, where the per-variant
 * availability map produced by `groupVariants` replaces the loaded children.
 */
export function resolveListingSoldOut(product) {
  const map = product?._availabilityMap || {};
  const values = Object.values(map);
  // With per-variant data: sold-out only when every variant is unavailable.
  if (values.length) return values.every(v => v === false);
  return !isProductAvailable(product);
}

/* ─── Cart-side truth ────────────────────────────────────────────────────── */

/**
 * Shopware answers 200 on `add to cart` even when it silently refuses or clamps
 * the line item, reporting the reason in `cart.errors`. These are the keys that
 * mean "you got less than you asked for".
 */
const STOCK_ERROR_KEYS = new Set([
  'product-stock-reached',
  'product-out-of-stock',
  'product-not-found',
  'product-deleted',
  'purchase-steps-quantity',
  'min-order-quantity',
]);

/**
 * Extracts stock-related problems from a cart response.
 * `cart.errors` is an object keyed by error id.
 *
 * @returns {Array<{ id: string, key: string, message: string, name?: string, quantity?: number }>}
 */
export function getCartStockIssues(cart) {
  const errors = cart?.errors;
  if (!errors) return [];
  return Object.entries(errors)
    .map(([id, err]) => ({ id, ...err }))
    .filter((err) => STOCK_ERROR_KEYS.has(err.messageKey || err.key))
    .map((err) => ({
      id: err.id,
      key: err.messageKey || err.key,
      name: err.name,
      quantity: err.quantity,
      message: cartIssueMessage(err),
    }));
}

/** Italian, human-readable message for a cart stock error. */
function cartIssueMessage(err) {
  const name = err.name ? `“${err.name}”` : 'Il prodotto';
  switch (err.messageKey || err.key) {
    case 'product-stock-reached':
      return `${name}: disponibili solo ${err.quantity ?? 0} pezzi, quantità aggiornata.`;
    case 'product-out-of-stock':
      return `${name} non è più disponibile ed è stato rimosso dal carrello.`;
    case 'product-not-found':
    case 'product-deleted':
      return `${name} non è più acquistabile ed è stato rimosso dal carrello.`;
    case 'purchase-steps-quantity':
      return `${name}: quantità aggiornata a ${err.quantity ?? 0} per rispettare la confezione minima.`;
    case 'min-order-quantity':
      return `${name}: quantità minima d'ordine ${err.quantity ?? 1}.`;
    default:
      return err.message || `${name}: quantità aggiornata.`;
  }
}

/**
 * Max quantity Shopware will accept for a cart line item.
 * `quantityInformation.maxPurchase` is the server's `calculatedMaxPurchase`,
 * which already folds in the stock when the product is closeout — so this is
 * the only cap the cart UI needs.
 */
export function getLineItemMaxQty(lineItem) {
  const max = lineItem?.quantityInformation?.maxPurchase;
  return typeof max === 'number' && max > 0 ? max : Infinity;
}

/**
 * Real quantity of a product in the cart, summed across duplicate line items.
 * Used to reconcile optimistic "+" counters with what Shopware actually stored,
 * so the UI never shows "Nel carrello · 2" when the cart holds 1 (or none).
 */
export function getCartQuantity(cart, productId) {
  if (!cart?.lineItems || !productId) return 0;
  return cart.lineItems
    .filter((li) => li.referencedId === productId)
    .reduce((sum, li) => sum + (li.quantity || 0), 0);
}
