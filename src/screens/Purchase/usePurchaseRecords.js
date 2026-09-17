/**
 * usePurchaseRecords
 *
 * Loads milk purchases for a given date range via the real backend
 * endpoint:
 *   GET /purchase/getAll?startDate=...&endDate=...
 * (MilkPurchaseController.getAllPurchases — all query params optional).
 */
import { useCallback, useState } from 'react';
import { get } from '../../api/decentralizedWrapper';
import { toQueryDateRange } from '../../utils/dateRanges';

const usePurchaseRecords = range => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = toQueryDateRange(range);
      const response = await get(
        `/purchase/getAll?startDate=${startDate}&endDate=${endDate}`,
      );
      const sorted = (Array.isArray(response) ? response : []).sort((a, b) =>
        (b.purchaseDate || '').localeCompare(a.purchaseDate || ''),
      );
      setPurchases(sorted);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startDate, range.endDate]);

  const totalQuantity = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.quantity || 0),
    0,
  );
  const totalAmount = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.amount || 0),
    0,
  );

  return {
    purchases,
    totalQuantity,
    totalAmount,
    loading,
    error,
    reload: load,
  };
};

export default usePurchaseRecords;
