/**
 * useDashboardData
 *
 * Fetches the real dashboard summary for a given date range:
 *   GET /dashboard?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd
 * (DashboardController.getDashboard) via the centralized
 * decentralizedWrapper. No mock data — every field shown on the
 * Dashboard comes directly from this response.
 */
import { useCallback, useState } from 'react';
import { get } from '../../api/decentralizedWrapper';
import { toQueryDateRange } from '../../utils/dateRanges';

const useDashboardData = range => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { startDate, endDate } = toQueryDateRange(range);
      const response = await get(
        `/dashboard?startDate=${startDate}&endDate=${endDate}`,
      );
      setData(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startDate, range.endDate]);

  return { data, loading, error, reload: load };
};

export default useDashboardData;
