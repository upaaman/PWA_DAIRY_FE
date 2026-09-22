/**
 * DashboardScreen
 *
 * Home tab. Shows a greeting header, a date-range filter, and the real
 * dashboard summary from the backend:
 *   GET /dashboard?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd
 * (DashboardController.getDashboard) — production, purchase, and sale
 * totals, each with a % change vs. the previous equivalent period
 * (computed by the backend itself).
 *
 * No mock data and no "Recent Activity" section — every value shown
 * here comes directly from the API response above.
 */
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DateRangeFilter from '../../components/DateRangeFilter';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { spacing } from '../../constants/appConstants';
import { RANGE_KEYS, getDateRangeForKey } from '../../utils/dateRanges';
import { formatCurrency, formatLiters } from '../../utils/format';
import DashboardHeader from './DashboardHeader';
import MilkProductionSummaryCard from './MilkProductionSummaryCard';
import DashboardStatCard from './DashboardStatCard';
import useDashboardData from './useDashboardData';

const DashboardScreen = () => {
  const [range, setRange] = useState(() => ({
    rangeKey: RANGE_KEYS.THIS_MONTH,
    ...getDateRangeForKey(RANGE_KEYS.THIS_MONTH),
  }));

  const { data, loading, error, reload } = useDashboardData(range);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader />

        <DateRangeFilter
          value={range}
          onChange={setRange}
          style={styles.filter}
        />

        {loading ? (
          <Loading message="Loading dashboard..." />
        ) : error || !data ? (
          <EmptyState
            icon="⚠️"
            title="Couldn't load dashboard"
            message={error?.message || 'Something went wrong. Please try again.'}
            actionLabel="Retry"
            onActionPress={reload}
          />
        ) : (
          <>
            <MilkProductionSummaryCard
              totalLiters={data.totalProduction}
              percentChange={data.totalProductionChange}
              comparisonLabel="vs previous period"
            />

            <View style={styles.grid}>
              <DashboardStatCard
                emoji="🚚"
                label="Milk Purchased"
                value={formatLiters(data.totalPurchaseQuantity)}
                changePercent={data.totalPurchaseQuantityChange}
                backgroundColor={colors.info}
              />
              <DashboardStatCard
                emoji="💸"
                label="Purchase Amount"
                value={formatCurrency(data.totalPurchaseAmount) || '₹0'}
                changePercent={data.totalPurchaseAmountChange}
                backgroundColor={colors.accentPurple}
              />
              <DashboardStatCard
                emoji="📦"
                label="Milk Sold"
                value={formatLiters(data.totalSaleQuantity)}
                changePercent={data.totalSaleQuantityChange}
                backgroundColor={colors.accentTeal}
              />
              <DashboardStatCard
                emoji="💰"
                label="Sale Amount"
                value={formatCurrency(data.totalSaleAmount) || '₹0'}
                changePercent={data.totalSaleAmountChange}
                backgroundColor={colors.warning}
              />
              <DashboardStatCard
                emoji="💸"
                label="Total Salaries Paid"
                value={formatCurrency(data.totalSalariesPaid) || '₹0'}
                changePercent={data.salariesPaidChange}
                backgroundColor={colors.accentPurple}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  filter: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  grid: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default DashboardScreen;
