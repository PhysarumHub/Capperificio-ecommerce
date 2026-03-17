/**
 * Format a numeric price for display with Italian locale.
 * @param {number} price - The price value
 * @param {string} [currency='EUR'] - ISO currency code
 * @returns {string} Formatted price, e.g. "€12,90"
 */
export function formatPrice(price, currency = 'EUR') {
  if (price == null || isNaN(price)) return '';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}
