/**
 * productionMeta.js
 *
 * Shared helpers for the Milk Production screens (List, History,
 * Filters, Statistics): building the real `/milkProduction/getAll`
 * query string from a filters object, and grouping fetched records by
 * date for the list views.
 *
 * Filters shape used across these screens:
 *   {
 *     rangeKey: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM',
 *     startDate: Date | null,
 *     endDate: Date | null,
 *     animalType: 'COW' | 'BUFFALO' | null,
 *     shift: 'MORNING' | 'EVENING' | null,
 *     minQuantity: string,
 *     maxQuantity: string,
 *   }
 */
import { RANGE_KEYS, getDateRangeForKey, toQueryDateRange } from '../../utils/dateRanges';

export const getDefaultFilters = () => {
  const { startDate, endDate } = getDateRangeForKey(RANGE_KEYS.THIS_MONTH);
  return {
    rangeKey: RANGE_KEYS.THIS_MONTH,
    startDate,
    endDate,
    animalType: null,
    shift: null,
    minQuantity: '',
    maxQuantity: '',
  };
};

/**
 * Builds the query string for GET /milkProduction/getAll using only the
 * params the backend actually supports (startDate, endDate,
 * productionShift, animalType). Quantity range has no backend support,
 * so it's applied client-side separately — see `applyQuantityRange`.
 */
export const buildProductionQuery = filters => {
  const params = new URLSearchParams();
  const { startDate, endDate } = toQueryDateRange(filters);

  if (startDate) {
    params.append('startDate', startDate);
  }
  if (endDate) {
    params.append('endDate', endDate);
  }
  if (filters.shift) {
    params.append('productionShift', filters.shift);
  }
  if (filters.animalType) {
    params.append('animalType', filters.animalType);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const applyQuantityRange = (records, filters) => {
  const min = filters.minQuantity !== '' ? Number(filters.minQuantity) : null;
  const max = filters.maxQuantity !== '' ? Number(filters.maxQuantity) : null;

  if (min === null && max === null) {
    return records;
  }

  return records.filter(record => {
    const quantity = Number(record.quantity);
    if (min !== null && quantity < min) {
      return false;
    }
    if (max !== null && quantity > max) {
      return false;
    }
    return true;
  });
};

/**
 * Groups records by productionDate, newest first, with a per-day total.
 */
export const groupRecordsByDate = records => {
  const groups = new Map();

  records.forEach(record => {
    const key = record.productionDate || 'Unknown';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(record);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      total: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      items,
    }));
};
