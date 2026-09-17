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
      style={[styles.scrollView, style]}
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
  scrollView: {
    // Hard-pin the ScrollView to its content height. Without this, a
    // horizontal ScrollView with no explicit height can end up being
    // measured much taller than its pill-row content in some flex
    // layouts, leaving a large empty gap below the chips.
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
  },
});

export default QuickRangeChips;
