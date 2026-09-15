/**
 * date.js
 *
 * Small date helpers shared across screens/forms.
 */

/**
 * Converts a JS Date to the "yyyy-MM-dd" string format expected by the
 * backend for LocalDate fields (e.g. Animal.dateOfBirth, dateOfPurchase).
 * Returns undefined for null/undefined input so the field can simply be
 * omitted from the request payload when not set.
 */
export const toISODateString = date => {
  if (!date) {
    return undefined;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a "yyyy-MM-dd" string (as returned by the backend for LocalDate
 * fields) into a readable display date, e.g. "12 Jan 2020".
 * Returns null for missing/invalid input so callers can show a fallback
 * like "—".
 */
export const formatDateString = dateString => {
  if (!dateString) {
    return null;
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
