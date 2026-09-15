/**
 * ProductionFiltersScreen
 *
 * Shared advanced filter screen for Milk Production List & History:
 * date range (quick chips + custom start/end), Animal Type, Shift,
 * and a client-side Quantity Range (the backend has no quantity query
 * param, so min/max is applied after fetching — see productionMeta.js).
 *
 * Receives `initialFilters` + `returnTo` (route name) via route params,
 * and navigates back to `returnTo` with `{ filters }` on Apply.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AppSelect from '../../components/AppSelect';
import AppDatePicker from '../../components/AppDatePicker';
import QuickRangeChips from '../../components/QuickRangeChips';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { RANGE_KEYS, getDateRangeForKey } from '../../utils/dateRanges';
import { SHIFT_OPTIONS } from '../../constants/enums';
import { TYPE_OPTIONS } from '../Animals/animalMeta';
import { getDefaultFilters } from './productionMeta';

const TYPE_FILTER_OPTIONS = [{ label: 'All Types', value: null }, ...TYPE_OPTIONS];
const SHIFT_FILTER_OPTIONS = [{ label: 'All Shifts', value: null }, ...SHIFT_OPTIONS];

const ProductionFiltersScreen = ({ navigation, route }) => {
  const { initialFilters, returnTo } = route.params || {};
  const [filters, setFilters] = useState(initialFilters || getDefaultFilters());

  const handleQuickRangeSelect = key => {
    if (key === RANGE_KEYS.CUSTOM) {
      setFilters(prev => ({ ...prev, rangeKey: key }));
      return;
    }
    const { startDate, endDate } = getDateRangeForKey(key);
    setFilters(prev => ({ ...prev, rangeKey: key, startDate, endDate }));
  };

  const handleClear = () => {
    setFilters(getDefaultFilters());
  };

  const handleApply = () => {
    navigation.navigate(returnTo, { filters });
  };

  const isCustom = filters.rangeKey === RANGE_KEYS.CUSTOM;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionLabel}>Date Range</Text>
      <QuickRangeChips
        activeKey={filters.rangeKey}
        onSelect={handleQuickRangeSelect}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}
      />

      {isCustom ? (
        <View style={styles.customDateRow}>
          <AppDatePicker
            label="Start Date"
            value={filters.startDate}
            onChange={date => setFilters(prev => ({ ...prev, startDate: date }))}
            containerStyle={styles.customDateField}
          />
          <AppDatePicker
            label="End Date"
            value={filters.endDate}
            onChange={date => setFilters(prev => ({ ...prev, endDate: date }))}
            containerStyle={styles.customDateField}
          />
        </View>
      ) : null}

      <AppSelect
        label="Animal Type"
        value={filters.animalType}
        options={TYPE_FILTER_OPTIONS}
        onSelect={value => setFilters(prev => ({ ...prev, animalType: value }))}
      />

      <AppSelect
        label="Shift"
        value={filters.shift}
        options={SHIFT_FILTER_OPTIONS}
        onSelect={value => setFilters(prev => ({ ...prev, shift: value }))}
      />

      <Text style={styles.sectionLabel}>Quantity Range (Liters)</Text>
      <View style={styles.quantityRow}>
        <AppInput
          placeholder="Min"
          keyboardType="numeric"
          value={filters.minQuantity}
          onChangeText={value =>
            setFilters(prev => ({ ...prev, minQuantity: value }))
          }
          containerStyle={styles.quantityField}
        />
        <AppInput
          placeholder="Max"
          keyboardType="numeric"
          value={filters.maxQuantity}
          onChangeText={value =>
            setFilters(prev => ({ ...prev, maxQuantity: value }))
          }
          containerStyle={styles.quantityField}
        />
      </View>

      <AppButton title="Apply Filters" onPress={handleApply} style={styles.applyButton} />
      <AppButton title="Clear All" variant="outline" onPress={handleClear} />
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
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    marginBottom: spacing.lg,
  },
  chipsContent: {
    paddingHorizontal: 0,
  },
  customDateRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  customDateField: {
    flex: 1,
    marginRight: spacing.sm,
  },
  quantityRow: {
    flexDirection: 'row',
  },
  quantityField: {
    flex: 1,
    marginRight: spacing.sm,
  },
  applyButton: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});

export default ProductionFiltersScreen;
