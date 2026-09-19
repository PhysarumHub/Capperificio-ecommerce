/**
 * Shared variant grouping for product listings.
 *
 * Shopware returns parents and children flat in the same `/product` response.
 * Every listing (home, collection, related products) needs the same thing:
 * one card per product, with the child options as chips and a way to resolve
 * chip → cart id and chip → availability.
 *
 * This used to be copy-pasted in three files with subtly different rules, which
 * is why the same product could read "Esaurito" in one grid and be addable in
 * another. Keep it here.
 */

import { buildVariantAvailabilityMap, isProductAvailable } from './availability';
import { getProductImage, getProductHoverImage } from './image.js';

/**
 * { [optionName]: childId } — keyed on the child's FIRST option so the keys
 * always line up with `buildVariantAvailabilityMap`.
 */
export function buildVariantMap(children) {
  const map = {};
  for (const child of children || []) {
    const name = child.options?.[0]?.translated?.name || child.options?.[0]?.name;
    if (name) map[name] = child.id;
  }
  return map;
}

function optionNames(children) {
  return [...new Set(
    children.flatMap((c) => c.options?.map((o) => o.translated?.name || o.name).filter(Boolean) || [])
  )];
}

/**
 * { [optionName]: imageUrl } — same key as `buildVariantMap`, so a listing
 * card can swap its photo when the customer picks a different chip instead
 * of always showing the parent's cover (the `getProducts` listing query
 * already requests `cover`/`media` for every entity it returns, children
 * included, so this needs no extra fetch — see `lib/api/products.js`).
 */
function buildVariantImageMap(children) {
  const map = {};
  for (const child of children || []) {
    const name = child.options?.[0]?.translated?.name || child.options?.[0]?.name;
    if (name) map[name] = getProductImage(child);
  }
  return map;
}

function buildVariantHoverImageMap(children) {
  const map = {};
  for (const child of children || []) {
    const name = child.options?.[0]?.translated?.name || child.options?.[0]?.name;
    const hover = name && getProductHoverImage(child);
    if (hover) map[name] = hover;
  }
  return map;
}

function enrich(product, children) {
  const availabilityMap = buildVariantAvailabilityMap(children);
  // Default cart id: the first PURCHASABLE child, so a card never defaults to a
  // sold-out variant when other sizes are in stock.
  const firstAvailable = children.find(isProductAvailable) || children[0];
  return {
    ...product,
    _allVariantOptions: optionNames(children),
    _variantMap: buildVariantMap(children),
    _availabilityMap: availabilityMap,
    _variantImageMap: buildVariantImageMap(children),
    _variantHoverImageMap: buildVariantHoverImageMap(children),
    _firstVariantId: firstAvailable?.id,
  };
}

/**
 * Collapses a flat Shopware product list into one entry per product,
 * enriching variant parents with `_allVariantOptions`, `_variantMap`,
 * `_availabilityMap` and `_firstVariantId`.
 */
export function groupVariants(rawList) {
  const list = rawList || [];
  const standalone = list.filter((p) => !p.parentId);
  const children = list.filter((p) => !!p.parentId);

  const groups = {};
  for (const child of children) {
    if (!groups[child.parentId]) groups[child.parentId] = [];
    groups[child.parentId].push(child);
  }

  const result = standalone.map((p) => {
    // `p.children` (associazione richiesta in getProducts) è la fonte di
    // verità: a differenza dei siblings ricavati scansionando la lista flat
    // (che riflette solo quello che è entrato in questa pagina/limit),
    // riporta sempre le varianti REALMENTE esistenti su Shopware in questo
    // momento — niente varianti fantasma cancellate ma ancora "configurate".
    const realChildren = p.children?.length ? p.children : null;
    const siblings = realChildren || groups[p.id] || [];
    return siblings.length ? enrich(p, siblings) : p;
  });

  // Children whose parent is not in the response: promote the first sibling as
  // the representative card.
  for (const [parentId, siblings] of Object.entries(groups)) {
    if (standalone.some((p) => p.id === parentId)) continue;
    result.push(enrich(siblings[0], siblings));
  }

  return result;
}

/**
 * Chip labels for a card: `_allVariantOptions` (built from the product's real
 * `children` association, see `enrich`) wins over `configuratorSettings`.
 *
 * `configuratorSettings` lists the options a product was CONFIGURED with, on
 * the parent, and Shopware does not always clean it up when a variant child
 * is later deleted — trusting it unconditionally shows chips for variants
 * that no longer exist (clicking them can't resolve a cart id or an image).
 * `_allVariantOptions` reflects the children Shopware returns right now, so
 * it's used first; `configuratorSettings` is only a fallback for the rare
 * case where we have no child data at all (e.g. a transient API hiccup).
 */
export function resolveVariantOptions(product) {
  if (product._allVariantOptions?.length) return product._allVariantOptions;

  const fromConfigurator = product.configuratorSettings
    ?.map((s) => s.option?.translated?.name || s.option?.name)
    .filter(Boolean);
  if (fromConfigurator?.length) return [...new Set(fromConfigurator)];

  const fromOptions = product.options
    ?.map((o) => o.translated?.name || o.name)
    .filter(Boolean);
  return fromOptions?.length ? fromOptions : undefined;
}

/**
 * Cart id for a listing card.
 * Returns undefined for a variant parent whose children are not in the response:
 * adding the parent id to the cart is always wrong, so the card must send the
 * customer to the PDP instead of pretending it can add.
 */
export function resolveCardCartId(product) {
  const hasKnownVariants = Object.keys(product._variantMap || {}).length > 0;
  const isUnresolvableParent = !product.parentId
    && !hasKnownVariants
    && product.configuratorSettings?.length > 0;
  if (isUnresolvableParent) return undefined;
  return product._firstVariantId || product.id;
}
