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

/**
 * Returns the shift that applies for a given time of day:
 * "MORNING" from 3 AM up to (but not including) 3 PM, otherwise
 * "EVENING". Defaults to the current time.
 */
export const getCurrentShift = (date = new Date()) => {
  const hours = date.getHours();
  return hours >= 3 && hours < 15 ? 'MORNING' : 'EVENING';
};
