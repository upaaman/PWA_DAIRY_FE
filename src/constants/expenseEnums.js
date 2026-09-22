/**
 * expenseEnums.js
 *
 * Option/label mappings for the Expense module. The `type` field mirrors
 * the backend's ExpenseType enum exactly (FEED, MEDICINE, MISC).
 */

export const EXPENSE_TYPE_LABELS = {
  FEED: 'Feed',
  MEDICINE: 'Medicine',
  MISC: 'Miscellaneous',
};

export const getExpenseTypeLabel = type =>
  EXPENSE_TYPE_LABELS[type] || type || '—';

export const EXPENSE_TYPE_OPTIONS = [
  { label: 'Feed', value: 'FEED' },
  { label: 'Medicine', value: 'MEDICINE' },
  { label: 'Miscellaneous', value: 'MISC' },
];