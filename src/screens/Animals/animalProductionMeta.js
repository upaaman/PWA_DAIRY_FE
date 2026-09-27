/**
 * animalProductionMeta.js
 *
 * Calculations for the Animal Details "Overview" tab, isolated from
 * fetch/render logic. Computed client-side from the real records
 * returned by GET /milkProduction/getAll?animalId=...&startDate=...
 * &endDate=... — no mock data, no invented endpoint.
 */
import colors from '../../constants/colors';
import { getShiftLabel } from '../../constants/enums';

const SHIFT_COLORS = { MORNING: colors.warning, EVENING: colors.info };

/**
 * One bar per calendar day between startDate and endDate (inclusive),
 * labeled "DD Mon" — matches the reference chart's date labels.
 */
// export const bucketByDay = (records, startDate, endDate) => {
//   if (!startDate || !endDate) {
//     return [];
//   }

//   const totalsByDate = new Map();
//   records.forEach(record => {
//     const key = record.productionDate;
//     totalsByDate.set(key, (totalsByDate.get(key) || 0) + Number(record.quantity || 0));
//   });

//   const bars = [];
//   const cursor = new Date(startDate);
//   const end = new Date(endDate);
//   while (cursor <= end) {
//     const key = cursor.toISOString().slice(0, 10);
//     bars.push({
//       label: cursor.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
//       value: Math.round((totalsByDate.get(key) || 0) * 100) / 100,
//     });
//     cursor.setDate(cursor.getDate() + 1);
//   }
//   return bars;
// };

export const computeShiftBreakdown = records => {
  const total = records.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const totals = {};
  records.forEach(record => {
    const shift = record.productionShift || 'UNKNOWN';
    totals[shift] = (totals[shift] || 0) + Number(record.quantity || 0);
  });

  return Object.entries(totals).map(([shift, value]) => ({
    key: shift,
    label: getShiftLabel(shift),
    value,
    percent: total > 0 ? Math.round((value / total) * 100) : 0,
    color: SHIFT_COLORS[shift] || colors.textMuted,
  }));
};
