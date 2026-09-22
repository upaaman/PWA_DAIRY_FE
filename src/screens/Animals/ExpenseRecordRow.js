/**
 * ExpenseRecordRow
 *
 * Single row in the "Expense Records" list: date + expense type on the
 * left, amount on the right.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { formatDateString } from '../../utils/date';
import { formatCurrency } from '../../utils/format';

const EXPENSE_TYPE_LABELS = {
  MISC: 'Miscellaneous',
  MEDICINE: 'Medicine',
  FEED: 'Feed',
  LABOR: 'Labor',
};

const ExpenseRecordRow = ({ expense }) => {
  const dateLabel = formatDateString(expense.expenseDate) || '—';
  const typeLabel =
    EXPENSE_TYPE_LABELS[expense.type] || expense.type || 'Expense';

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.type}>{typeLabel}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>
          {formatCurrency(expense.amount) || '—'}
        </Text>
        {expense.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {expense.notes}
          </Text>
        ) : null}
      </View>
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
  left: {
    flex: 1,
    marginRight: spacing.sm,
  },
  type: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  notes: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
    maxWidth: 140,
  },
});

export default ExpenseRecordRow;