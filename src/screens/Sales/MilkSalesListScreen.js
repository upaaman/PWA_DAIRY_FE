/**
 * MilkSalesListScreen
 *
 * Real backend data: composite fetch across GET /milkSale/getAll (see
 * salesMeta.js for why — the endpoint requires all of startDate,
 * endDate, shift, animalType, customerId) plus GET /dashboard for the
 * "Total Sales" summary card + % change vs the previous period.
 *
 * Payment method is NOT shown — the backend MilkSale entity has no
 * such field (only saleDate, quantity, rate, shift, animalType,
 * customer, amount). Not invented here.
 */
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import QuickRangeChips from '../../components/QuickRangeChips';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { RANGE_KEYS, getDateRangeForKey } from '../../utils/dateRanges';
import { formatCurrency } from '../../utils/format';
import { SALES_ROUTES } from '../../navigation/routes';
import useSalesRecords from './useSalesRecords';
import SaleListItem from './SaleListItem';

const AddHeaderButton = ({ onPress }) => (
  <Pressable onPress={onPress} style={styles.headerButton} hitSlop={8}>
    <Text style={styles.headerIcon}>➕</Text>
  </Pressable>
);

const MilkSalesListScreen = ({ navigation }) => {
  const [range, setRange] = useState(() => ({
    rangeKey: RANGE_KEYS.THIS_MONTH,
    ...getDateRangeForKey(RANGE_KEYS.THIS_MONTH),
  }));

  const { sales, summary, loading, error, reload } = useSalesRecords(range);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleRangeSelect = key => {
    const { startDate, endDate } = getDateRangeForKey(key);
    setRange({ rangeKey: key, startDate, endDate });
  };

  const openAdd = useCallback(() => {
    navigation.navigate(SALES_ROUTES.ADD);
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <AddHeaderButton onPress={openAdd} />,
    });
  }, [navigation, openAdd]);

  const totalAmount = Number(summary?.totalSaleAmount || 0);
  const amountChange =
    summary?.totalSaleAmountChange !== undefined
      ? Number(summary.totalSaleAmountChange)
      : null;

  const summaryCard = (
    <View style={styles.summaryCard}>
      <View>
        <Text style={styles.summaryLabel}>
          Total Sales ({RANGE_LABEL[range.rangeKey]})
        </Text>
        <Text style={styles.summaryValue}>{formatCurrency(totalAmount) || '₹0'}</Text>
        {amountChange !== null ? (
          <Text style={styles.summaryChange}>
            {amountChange >= 0 ? '↑' : '↓'} {Math.abs(amountChange)}% vs last period
          </Text>
        ) : null}
      </View>
      <View style={styles.summaryIconWrap}>
        <Text style={styles.summaryIcon}>💰</Text>
      </View>
    </View>
  );

  if (loading) {
    return <Loading message="Loading sales..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load sales"
        message={error.message || 'Please try again.'}
        actionLabel="Retry"
        onActionPress={reload}
      />
    );
  }

  return (
    <View style={styles.container}>
      <QuickRangeChips
        activeKey={range.rangeKey}
        onSelect={handleRangeSelect}
        rangeKeys={[RANGE_KEYS.TODAY, RANGE_KEYS.THIS_WEEK, RANGE_KEYS.THIS_MONTH]}
        style={styles.chipsRow}
      />

      <FlatList
        data={sales}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={summaryCard}
        renderItem={({ item }) => (
          <SaleListItem
            sale={item}
            onPress={() =>
              navigation.navigate(SALES_ROUTES.DETAILS, { sale: item })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="No sales found"
            message="Try a different date range, or record a new sale."
          />
        }
      />
    </View>
  );
};

const RANGE_LABEL = {
  [RANGE_KEYS.TODAY]: 'Today',
  [RANGE_KEYS.THIS_WEEK]: 'This Week',
  [RANGE_KEYS.THIS_MONTH]: 'This Month',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chipsRow: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.primaryLight,
  },
  summaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.xs,
  },
  summaryChange: {
    fontSize: fontSize.xs,
    color: colors.white,
    marginTop: spacing.xs,
  },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIcon: {
    fontSize: 22,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
  },
  headerIcon: {
    fontSize: fontSize.lg,
  },
});

export default MilkSalesListScreen;
