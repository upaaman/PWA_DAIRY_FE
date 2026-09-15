/**
 * ProductionHistoryScreen
 *
 * A more powerful, filterable view of production history: date-range
 * chips inline, a Total Production summary card, an active-filter
 * banner (when Animal Type / Shift / Quantity Range are set via the
 * Filters screen), and the same grouped-by-date list used by the
 * List screen.
 */
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import QuickRangeChips from '../../components/QuickRangeChips';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { RANGE_KEYS, getDateRangeForKey } from '../../utils/dateRanges';
import { formatDateString, toISODateString } from '../../utils/date';
import { formatLiters } from '../../utils/format';
import { PRODUCTION_ROUTES } from '../../navigation/routes';
import { getShiftLabel } from '../../constants/enums';
import { getAnimalTypeLabel } from '../Animals/animalMeta';
import { getDefaultFilters } from './productionMeta';
import useProductionRecords from './useProductionRecords';
import ProductionListSection from './ProductionListSection';

const hasExtraFilters = filters =>
  Boolean(filters.animalType || filters.shift || filters.minQuantity || filters.maxQuantity);

const FilterHeaderButton = ({ onPress }) => (
  <Pressable onPress={onPress} style={styles.headerButton} hitSlop={8}>
    <Text style={styles.headerIcon}>⚙️</Text>
  </Pressable>
);

const ProductionHistoryScreen = ({ navigation, route }) => {
  const [filters, setFilters] = useState(getDefaultFilters);
  const { grouped, loading, error, totalQuantity, reload } =
    useProductionRecords(filters);

  useEffect(() => {
    if (route.params?.filters) {
      setFilters(route.params.filters);
      navigation.setParams({ filters: undefined });
    }
  }, [route.params?.filters, navigation]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleQuickRangeSelect = key => {
    if (key === RANGE_KEYS.CUSTOM) {
      openFilters();
      return;
    }
    const { startDate, endDate } = getDateRangeForKey(key);
    setFilters(prev => ({ ...prev, rangeKey: key, startDate, endDate }));
  };

  const openFilters = useCallback(() => {
    navigation.navigate(PRODUCTION_ROUTES.FILTERS, {
      initialFilters: filters,
      returnTo: PRODUCTION_ROUTES.HISTORY,
    });
  }, [navigation, filters]);

  const clearExtraFilters = () => {
    setFilters(prev => ({
      ...prev,
      animalType: null,
      shift: null,
      minQuantity: '',
      maxQuantity: '',
    }));
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <FilterHeaderButton onPress={openFilters} />,
    });
  }, [navigation, openFilters]);

  const activeFilterSummary = [
    filters.animalType ? getAnimalTypeLabel(filters.animalType) : null,
    filters.shift ? getShiftLabel(filters.shift) : null,
    filters.minQuantity || filters.maxQuantity
      ? `${filters.minQuantity || '0'}–${filters.maxQuantity || '∞'} L`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const startLabel = formatDateString(toISODateString(filters.startDate));
  const endLabel = formatDateString(toISODateString(filters.endDate));
  const rangeLabel =
    startLabel && endLabel
      ? startLabel === endLabel
        ? startLabel
        : `${startLabel} – ${endLabel}`
      : '';

  const listHeader = (
    <View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryIcon}>🥛</Text>
        <View style={styles.summaryTextBlock}>
          <Text style={styles.summaryLabel}>Total Production</Text>
          <Text style={styles.summaryValue}>{formatLiters(totalQuantity)}</Text>
        </View>
        <Text style={styles.summaryDate}>{rangeLabel}</Text>
      </View>

      {hasExtraFilters(filters) ? (
        <View style={styles.filterBanner}>
          <Text style={styles.filterBannerText} numberOfLines={1}>
            Showing results for: {activeFilterSummary}
          </Text>
          <Text style={styles.filterBannerClear} onPress={clearExtraFilters}>
            ✕
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <QuickRangeChips
        activeKey={filters.rangeKey}
        onSelect={handleQuickRangeSelect}
        style={styles.chipsRow}
      />

      <ProductionListSection
        grouped={grouped}
        loading={loading}
        error={error}
        onRetry={reload}
        ListHeaderComponent={listHeader}
        emptyMessage="Try changing your filters or select a different date range."
      />
    </View>
  );
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  summaryIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  summaryTextBlock: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.xs / 2,
  },
  summaryDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  filterBannerText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  filterBannerClear: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    marginLeft: spacing.sm,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
  },
  headerIcon: {
    fontSize: fontSize.lg,
  },
});

export default ProductionHistoryScreen;
