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
    const siblings = groups[p.id] || [];
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
 * Chip labels for a card: `configuratorSettings` (always complete, comes from
 * the parent) wins over `_allVariantOptions` (only the children present in the
 * response) and over the child's own `options`.
 */
export function resolveVariantOptions(product) {
  const fromConfigurator = product.configuratorSettings
    ?.map((s) => s.option?.translated?.name || s.option?.name)
    .filter(Boolean);
  if (fromConfigurator?.length) return [...new Set(fromConfigurator)];

  if (product._allVariantOptions?.length) return product._allVariantOptions;

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
