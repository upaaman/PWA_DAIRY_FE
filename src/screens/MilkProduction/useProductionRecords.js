/**
 * useProductionRecords
 *
 * Fetches milk production records for the given filters from the real
 * backend endpoint (GET /milkProduction/getAll) via the centralized
 * decentralizedWrapper, applies the client-side quantity range filter,
 * and groups the results by date.
 */
import { useCallback, useState } from 'react';
import { get } from '../../api/decentralizedWrapper';
import { applyQuantityRange, buildProductionQuery, groupRecordsByDate } from './productionMeta';

const useProductionRecords = filters => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = buildProductionQuery(filters);
      const response = await get(`/milkProduction/getAll${query}`);
      const raw = Array.isArray(response) ? response : [];
      setRecords(applyQuantityRange(raw, filters));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.startDate,
    filters.endDate,
    filters.shift,
    filters.animalType,
    filters.minQuantity,
    filters.maxQuantity,
  ]);

  const totalQuantity = records.reduce(
    (sum, record) => sum + Number(record.quantity || 0),
    0,
  );

  return {
    records,
    grouped: groupRecordsByDate(records),
    totalQuantity,
    loading,
    error,
    reload: load,
  };
};

export default useProductionRecords;
