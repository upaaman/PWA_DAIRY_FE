/**
 * QuickRangeChips
 *
 * Today / This Week / This Month / Custom chip row used by the Milk
 * Production List, Production History, and Milk Sales List screens.
 * Tapping "Custom" is handled by the caller (typically opens a Filters
 * screen, since that's where custom start/end dates live).
 */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import FilterChip from './FilterChip';
import { spacing } from '../constants/appConstants';
import { RANGE_KEYS, RANGE_LABELS } from '../utils/dateRanges';

const DEFAULT_ORDER = [
  RANGE_KEYS.TODAY,
  RANGE_KEYS.THIS_WEEK,
  RANGE_KEYS.THIS_MONTH,
  RANGE_KEYS.CUSTOM,
];

const QuickRangeChips = ({
  activeKey,
  onSelect,
  rangeKeys = DEFAULT_ORDER,
  style,
  contentContainerStyle,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={[styles.row, contentContainerStyle]}
    >
      {rangeKeys.map(key => (
        <FilterChip
          key={key}
          label={RANGE_LABELS[key]}
          active={activeKey === key}
          onPress={() => onSelect(key)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexGrow: 1,
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
  },
});

export default QuickRangeChips;
