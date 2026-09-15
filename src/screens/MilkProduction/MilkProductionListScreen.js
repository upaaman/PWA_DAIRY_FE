/**
 * MilkProductionListScreen
 *
 * Default "day-to-day" view of the Production tab: quick date-range
 * chips, lightweight inline Animal Type / Shift quick-filters, and the
 * grouped-by-date list. For custom date ranges or a quantity range,
 * "Custom" (or the header filter icon) opens the shared
 * ProductionFiltersScreen.
 *
 * Data: GET /milkProduction/getAll (via useProductionRecords), no
 * dedicated "list all" summary card here (that lives on History).
 */
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppSelect from '../../components/AppSelect';
import QuickRangeChips from '../../components/QuickRangeChips';
import colors from '../../constants/colors';
import { fontSize, spacing } from '../../constants/appConstants';
import { RANGE_KEYS, getDateRangeForKey } from '../../utils/dateRanges';
import { PRODUCTION_ROUTES } from '../../navigation/routes';
import { SHIFT_OPTIONS } from '../../constants/enums';
import { TYPE_OPTIONS } from '../Animals/animalMeta';
import { getDefaultFilters } from './productionMeta';
import useProductionRecords from './useProductionRecords';
import ProductionListSection from './ProductionListSection';

const TYPE_FILTER_OPTIONS = [{ label: 'All Types', value: null }, ...TYPE_OPTIONS];
const SHIFT_FILTER_OPTIONS = [{ label: 'All Shifts', value: null }, ...SHIFT_OPTIONS];

const HeaderActions = ({ onFilter, onAdd }) => (
  <View style={styles.headerActions}>
    <Pressable onPress={onFilter} style={styles.headerButton} hitSlop={8}>
      <Text style={styles.headerIcon}>⚙️</Text>
    </Pressable>
    <Pressable onPress={onAdd} style={styles.headerButton} hitSlop={8}>
      <Text style={styles.headerIcon}>➕</Text>
    </Pressable>
  </View>
);

const MilkProductionListScreen = ({ navigation, route }) => {
  const [filters, setFilters] = useState(getDefaultFilters);
  const { grouped, loading, error, reload } = useProductionRecords(filters);

  // Receive filters applied from the Filters screen (Custom range,
  // Animal Type, Shift, Quantity range) via navigate-back params.
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
      navigation.navigate(PRODUCTION_ROUTES.FILTERS, {
        initialFilters: filters,
        returnTo: PRODUCTION_ROUTES.LIST,
      });
      return;
    }
    const { startDate, endDate } = getDateRangeForKey(key);
    setFilters(prev => ({ ...prev, rangeKey: key, startDate, endDate }));
  };

  const openFilters = useCallback(() => {
    navigation.navigate(PRODUCTION_ROUTES.FILTERS, {
      initialFilters: filters,
      returnTo: PRODUCTION_ROUTES.LIST,
    });
  }, [navigation, filters]);

  const openAdd = useCallback(() => {
    navigation.navigate(PRODUCTION_ROUTES.ADD);
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderActions onFilter={openFilters} onAdd={openAdd} />
      ),
    });
  }, [navigation, openFilters, openAdd]);

  return (
    <View style={styles.container}>
      <QuickRangeChips
        activeKey={filters.rangeKey}
        onSelect={handleQuickRangeSelect}
        style={styles.chipsRow}
      />

      <View style={styles.quickFiltersRow}>
        <AppSelect
          containerStyle={styles.quickFilter}
          placeholder="Animal Type: All"
          value={filters.animalType}
          options={TYPE_FILTER_OPTIONS}
          onSelect={value =>
            setFilters(prev => ({ ...prev, animalType: value }))
          }
        />
        <AppSelect
          containerStyle={styles.quickFilter}
          placeholder="Shift: All"
          value={filters.shift}
          options={SHIFT_FILTER_OPTIONS}
          onSelect={value => setFilters(prev => ({ ...prev, shift: value }))}
        />
      </View>

      <ProductionListSection
        grouped={grouped}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="Try a different date range or filter, or add a new production entry."
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
  },
  quickFiltersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  quickFilter: {
    flex: 1,
    marginRight: spacing.sm,
    marginBottom: 0,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    paddingHorizontal: spacing.xs,
  },
  headerIcon: {
    fontSize: fontSize.lg,
  },
});

export default MilkProductionListScreen;
