/**
 * useSalesRecords
 *
 * Loads milk sales for a given date range (via the composite fetch in
 * salesMeta.js, since /milkSale/getAll requires all query params) plus
 * the real dashboard summary (total sale amount + % change vs the
 * previous period) for the same range.
 */
import { useCallback, useState } from 'react';
import { get } from '../../api/decentralizedWrapper';
import { toQueryDateRange } from '../../utils/dateRanges';
import { fetchAllSalesInRange, fetchCustomers } from './salesMeta';

const useSalesRecords = range => {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = toQueryDateRange(range);
      const [customers, dashboard] = await Promise.all([
        fetchCustomers(),
        get(`/dashboard?startDate=${startDate}&endDate=${endDate}`),
      ]);

      const salesData = await fetchAllSalesInRange(
        range,
        Array.isArray(customers) ? customers : [],
      );

      setSales(salesData);
      setSummary(dashboard);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startDate, range.endDate]);

  const totalQuantity = sales.reduce((sum, sale) => sum + Number(sale.quantity || 0), 0);
  const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);

  return {
    sales,
    summary,
    totalQuantity,
    totalAmount,
    loading,
    error,
    reload: load,
  };
};

export default useSalesRecords;
