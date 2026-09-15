/**
 * ProductionRecordRow
 *
 * Single row in the "Recent Production" list: date + shift on the left,
 * quantity on the right.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { formatDateString } from '../../utils/date';
import { formatLiters } from '../../utils/format';

const SHIFT_LABELS = {
  MORNING: 'Morning',
  EVENING: 'Evening',
};

const ProductionRecordRow = ({ record }) => {
  const dateLabel = formatDateString(record.productionDate) || '—';
  const shiftLabel = SHIFT_LABELS[record.productionShift] || record.productionShift;

  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.date}>{dateLabel}</Text>
        <Text style={styles.shift}>{shiftLabel}</Text>
      </View>
      <Text style={styles.quantity}>{formatLiters(record.quantity)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  date: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  shift: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  quantity: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});

export default ProductionRecordRow;
