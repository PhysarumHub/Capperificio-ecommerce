/**
 * Single source of truth for product availability.
 *
 * All sold-out checks across the app go through these functions so that
 * the logic never diverges between the product card and the detail page.
 */

/**
 * Returns true when a standalone product or a variant child is purchasable.
 * Shopware sets `available=false` when stock is 0 or the product is inactive.
 * We also guard on `availableStock` directly as a belt-and-suspenders check.
 */
export function isProductAvailable(product) {
  if (!product) return false;
  if (product.available === false) return false;
  if (typeof product.availableStock === 'number' && product.availableStock <= 0) return false;
  return true;
}

/**
 * Builds a map of { [optionName]: boolean } for a list of variant children.
 * Used by ProductCard to disable individual variant chips.
 *
 * @param {Array} variants  - array of Shopware variant product objects
 * @returns {Record<string, boolean>}
 */
export function buildVariantAvailabilityMap(variants) {
  const map = {};
  for (const v of variants) {
    const name = v.options?.[0]?.translated?.name || v.options?.[0]?.name;
    if (name) map[name] = isProductAvailable(v);
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
    return variants.length > 0 && variants.every(v => !isProductAvailable(v));
  }

  return !isProductAvailable(product);
}
