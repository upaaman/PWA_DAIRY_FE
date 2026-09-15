/**
 * format.js
 *
 * Small display-formatting helpers shared across screens.
 */

/**
 * Formats a number as Indian Rupees, e.g. 45000 -> "₹45,000".
 * Returns null for missing/invalid input so callers can show a fallback.
 */
export const formatCurrency = value => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const number = Number(value);
  if (Number.isNaN(number)) {
    return null;
  }
  return `₹${number.toLocaleString('en-IN')}`;
};

/**
 * Formats a number of liters, e.g. 12.5 -> "12.5 L".
 */
export const formatLiters = value => {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return '0 L';
  }
  // Trim trailing ".0" but keep meaningful decimals (e.g. 12.5).
  const rounded = Math.round(number * 100) / 100;
  return `${rounded} L`;
};
