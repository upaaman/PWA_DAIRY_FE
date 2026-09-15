/**
 * dateRanges.js
 *
 * Shared date-range helpers for the quick filter chips used across
 * Milk Production, Production Statistics, and Milk Sales
 * (Today / This Week / This Month), plus formatting for backend
 * LocalDate query params ("yyyy-MM-dd").
 */
import { toISODateString } from './date';

export const RANGE_KEYS = {
  TODAY: 'TODAY',
  THIS_WEEK: 'THIS_WEEK',
  THIS_MONTH: 'THIS_MONTH',
  CUSTOM: 'CUSTOM',
};

export const RANGE_LABELS = {
  [RANGE_KEYS.TODAY]: 'Today',
  [RANGE_KEYS.THIS_WEEK]: 'This Week',
  [RANGE_KEYS.THIS_MONTH]: 'This Month',
  [RANGE_KEYS.CUSTOM]: 'Custom',
};

const startOfDay = date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const startOfWeek = date => {
  // Week starts on Monday, matching the Mon–Sun chart in the reference UI.
  const copy = startOfDay(date);
  const day = copy.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  return copy;
};

const startOfMonth = date => {
  const copy = startOfDay(date);
  copy.setDate(1);
  return copy;
};

/**
 * Returns { startDate, endDate } as JS Dates for the given range key,
 * relative to "now". CUSTOM must be supplied by the caller (this just
 * falls back to today for CUSTOM if no explicit dates are given yet).
 */
export const getDateRangeForKey = (key, now = new Date()) => {
  switch (key) {
    case RANGE_KEYS.THIS_WEEK:
      return { startDate: startOfWeek(now), endDate: startOfDay(now) };
    case RANGE_KEYS.THIS_MONTH:
      return { startDate: startOfMonth(now), endDate: startOfDay(now) };
    case RANGE_KEYS.TODAY:
    default:
      return { startDate: startOfDay(now), endDate: startOfDay(now) };
  }
};

export const toQueryDateRange = ({ startDate, endDate }) => ({
  startDate: toISODateString(startDate),
  endDate: toISODateString(endDate),
});
