/**
 * ProductionStatisticsScreen
 *
 * Daily / Weekly / Monthly tabs showing:
 *  - Total Milk Production + % change vs the previous equivalent period
 *    (from the real GET /dashboard endpoint, which already computes this)
 *  - Production by day (bar chart)
 *  - Production by animal type
 *  - Production by shift
 *
 * The backend has no dedicated "statistics" endpoint for the by-day /
 * by-type / by-shift breakdowns, so those are calculated client-side
 * from the real GET /milkProduction/getAll records for the selected
 * period — NOT mock data, and no invented API contract. This
 * calculation is isolated in `computeBreakdowns` below.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get } from '../../api/decentralizedWrapper';
import AppCard from '../../components/AppCard';
import FilterChip from '../../components/FilterChip';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import SimpleBarChart from '../../components/SimpleBarChart';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { RANGE_KEYS, getDateRangeForKey, toQueryDateRange } from '../../utils/dateRanges';
import { getAnimalTypeLabel } from '../Animals/animalMeta';
import { getShiftLabel } from '../../constants/enums';
import MilkProductionSummaryCard from '../Dashboard/MilkProductionSummaryCard';
import StatBreakdownRow from './StatBreakdownRow';

const TABS = [
  { key: 'DAILY', label: 'Daily', rangeKey: RANGE_KEYS.TODAY },
  { key: 'WEEKLY', label: 'Weekly', rangeKey: RANGE_KEYS.THIS_WEEK },
  { key: 'MONTHLY', label: 'Monthly', rangeKey: RANGE_KEYS.THIS_MONTH },
];

const TYPE_COLORS = { COW: colors.primary, BUFFALO: colors.secondary };
const SHIFT_COLORS = { MORNING: colors.warning, EVENING: colors.info };

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Pure calculation, isolated from the fetch/render logic so it's easy
 * to unit-test or swap out later if the backend ever adds a real
 * statistics endpoint.
 */
const computeBreakdowns = (records, { rangeKey, startDate, endDate }) => {
  const total = records.reduce((sum, r) => sum + Number(r.quantity || 0), 0);

  // By day
  let byDay = [];
  if (rangeKey === RANGE_KEYS.THIS_WEEK) {
    const dayTotals = new Array(7).fill(0);
    records.forEach(record => {
      const date = new Date(record.productionDate);
      const dayIndex = (date.getDay() + 6) % 7; // Monday = 0
      dayTotals[dayIndex] += Number(record.quantity || 0);
    });
    byDay = WEEKDAY_LABELS.map((label, index) => ({
      label,
      value: Math.round(dayTotals[index] * 100) / 100,
    }));
  } else if (rangeKey === RANGE_KEYS.THIS_MONTH) {
    const totalsByDate = new Map();
    records.forEach(record => {
      const key = record.productionDate;
      totalsByDate.set(key, (totalsByDate.get(key) || 0) + Number(record.quantity || 0));
    });
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const key = cursor.toISOString().slice(0, 10);
      byDay.push({
        label: String(cursor.getDate()),
        value: Math.round((totalsByDate.get(key) || 0) * 100) / 100,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // By animal type
  const typeTotals = {};
  records.forEach(record => {
    const type = record.animal?.type || 'UNKNOWN';
    typeTotals[type] = (typeTotals[type] || 0) + Number(record.quantity || 0);
  });
  const byType = Object.entries(typeTotals).map(([type, value]) => ({
    key: type,
    label: getAnimalTypeLabel(type),
    value,
    percent: total > 0 ? Math.round((value / total) * 100) : 0,
    color: TYPE_COLORS[type] || colors.textMuted,
  }));

  // By shift
  const shiftTotals = {};
  records.forEach(record => {
    const shift = record.productionShift || 'UNKNOWN';
    shiftTotals[shift] = (shiftTotals[shift] || 0) + Number(record.quantity || 0);
  });
  const byShift = Object.entries(shiftTotals).map(([shift, value]) => ({
    key: shift,
    label: getShiftLabel(shift),
    value,
    percent: total > 0 ? Math.round((value / total) * 100) : 0,
    color: SHIFT_COLORS[shift] || colors.textMuted,
  }));

  return { total, byDay, byType, byShift };
};

const ProductionStatisticsScreen = () => {
  const [activeTab, setActiveTab] = useState('WEEKLY');
  const [dashboard, setDashboard] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const range = useMemo(() => {
    const tab = TABS.find(t => t.key === activeTab);
    return getDateRangeForKey(tab.rangeKey);
  }, [activeTab]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { startDate, endDate } = toQueryDateRange(range);
      const [dashboardResponse, recordsResponse] = await Promise.all([
        get(`/dashboard?startDate=${startDate}&endDate=${endDate}`),
        get(`/milkProduction/getAll?startDate=${startDate}&endDate=${endDate}`),
      ]);
      setDashboard(dashboardResponse);
      setRecords(Array.isArray(recordsResponse) ? recordsResponse : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const breakdowns = useMemo(
    () =>
      computeBreakdowns(records, {
        rangeKey: TABS.find(t => t.key === activeTab).rangeKey,
        startDate: range.startDate,
        endDate: range.endDate,
      }),
    [records, activeTab, range],
  );

  if (loading) {
    return <Loading message="Loading statistics..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load statistics"
        message={error.message || 'Please try again.'}
        actionLabel="Retry"
        onActionPress={load}
      />
    );
  }

  const totalProduction = Number(dashboard?.totalProduction || 0);
  const percentChange =
    dashboard?.totalProductionChange !== undefined
      ? Number(dashboard.totalProductionChange)
      : null;

  const activeTabLabel = TABS.find(t => t.key === activeTab).label.toLowerCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <FilterChip
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onPress={() => setActiveTab(tab.key)}
          />
        ))}
      </View>

      <MilkProductionSummaryCard
        totalLiters={totalProduction}
        percentChange={percentChange}
        comparisonLabel={`from previous ${activeTabLabel}`}
      />

      {breakdowns.byDay.length > 0 ? (
        <AppCard style={styles.section}>
          <Text style={styles.sectionTitle}>Production by Day</Text>
          <SimpleBarChart data={breakdowns.byDay} />
        </AppCard>
      ) : null}

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>By Animal Type</Text>
        {breakdowns.byType.length === 0 ? (
          <EmptyState
            title="No data"
            message="No production records for this period."
          />
        ) : (
          breakdowns.byType.map(item => (
            <StatBreakdownRow key={item.key} {...item} />
          ))
        )}
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>By Shift</Text>
        {breakdowns.byShift.length === 0 ? (
          <EmptyState
            title="No data"
            message="No production records for this period."
          />
        ) : (
          breakdowns.byShift.map(item => (
            <StatBreakdownRow key={item.key} {...item} />
          ))
        )}
      </AppCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
});

export default ProductionStatisticsScreen;
