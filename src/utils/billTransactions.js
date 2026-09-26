/**
 * billTransactions.js
 *
 * Shared ordering for anything that renders a bill's transaction table —
 * the generated PDF (purePdfBuilder), the plain-text receipt
 * (pdfService), the HTML template (billTemplate) and the in-app preview
 * (BillPreviewModal).
 *
 * Bills read as a ledger, so entries always run oldest → newest
 * (01 → 30), no matter which order the screen that produced them was
 * displaying (the list screens keep newest-first, which is what people
 * expect when browsing transactions).
 */

/**
 * Sortable number for a transaction's date. Backend LocalDate fields come
 * back as "yyyy-MM-dd", which is used directly; anything else falls back
 * to its timestamp. Undated records sort first.
 */
const dateKey = (item, dateField) => {
  const value = String((item && item[dateField]) || '').trim();
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) {
    return Number(iso[1]) * 10000 + Number(iso[2]) * 100 + Number(iso[3]);
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

/**
 * Returns a new array of `transactions` sorted chronologically, keeping
 * records that share a date in their original order (so a single day's
 * morning/evening entries don't shuffle between renders).
 */
export const sortBillTransactions = (
  transactions,
  dateField = 'purchaseDate',
) => {
  const list = Array.isArray(transactions) ? transactions : [];

  return list
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const left = dateKey(a.item, dateField);
      const right = dateKey(b.item, dateField);

      if (left === right) {
        return a.index - b.index;
      }
      return left < right ? -1 : 1;
    })
    .map(entry => entry.item);
};

export default sortBillTransactions;
