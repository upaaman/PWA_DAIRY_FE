/**
 * DateRangeFilter
 *
 * Reusable date-range control: Today / This Week / This Month / Custom
 * quick chips, plus inline Start/End date pickers when "Custom" is
 * selected. Meant to be shared across Dashboard, Production, Purchase,
 * Sales, and Statistics screens — each screen owns its own
 * `{ rangeKey, startDate, endDate }` state and just renders this on top.
 *
 * Usage:
 *   const [range, setRange] = useState(() => ({
 *     rangeKey: RANGE_KEYS.THIS_MONTH,
 *     ...getDateRangeForKey(RANGE_KEYS.THIS_MONTH),
 *   }));
 *
 *   <DateRangeFilter value={range} onChange={setRange} />
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppDatePicker from './AppDatePicker';
import QuickRangeChips from './QuickRangeChips';
import { spacing } from '../constants/appConstants';
import { RANGE_KEYS, getDateRangeForKey } from '../utils/dateRanges';

const DateRangeFilter = ({ value, onChange, style }) => {
  const handleQuickSelect = key => {
    if (key === RANGE_KEYS.CUSTOM) {
      onChange({ ...value, rangeKey: key });
      return;
    }
    const { startDate, endDate } = getDateRangeForKey(key);
    onChange({ rangeKey: key, startDate, endDate });
  };

  const isCustom = value.rangeKey === RANGE_KEYS.CUSTOM;

  return (
    <View style={style}>
      <QuickRangeChips activeKey={value.rangeKey} onSelect={handleQuickSelect} />

      {isCustom ? (
        <View style={styles.customRow}>
          <AppDatePicker
            label="Start Date"
            value={value.startDate}
            onChange={date => onChange({ ...value, startDate: date })}
            maximumDate={value.endDate || new Date()}
            containerStyle={styles.customField}
          />
          <AppDatePicker
            label="End Date"
            value={value.endDate}
            onChange={date => onChange({ ...value, endDate: date })}
            minimumDate={value.startDate}
            maximumDate={new Date()}
            containerStyle={styles.customField}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  customRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  customField: {
    flex: 1,
    marginRight: spacing.sm,
  },
});

export default DateRangeFilter;
