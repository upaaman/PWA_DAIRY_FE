/**
 * enums.js
 *
 * Shared backend enum label/option mappings that are used by more than
 * one module (Milk Production + Milk Sales both use MilkShifts).
 * Mirrors DairyEnums.MilkShifts exactly — do not add values the backend
 * doesn't support.
 */

export const SHIFT_LABELS = {
  MORNING: 'Morning',
  EVENING: 'Evening',
};

export const getShiftLabel = shift => SHIFT_LABELS[shift] || shift || '—';

export const SHIFT_OPTIONS = [
  { label: 'Morning', value: 'MORNING' },
  { label: 'Evening', value: 'EVENING' },
];
