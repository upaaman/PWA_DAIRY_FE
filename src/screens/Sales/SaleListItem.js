/**
 * SaleListItem
 *
 * Single row in the Milk Sales list: date + buyer on the left,
 * quantity/amount on the right, chevron to view details.
 *
 * Note: the backend MilkSale entity has no "payment method" field, so
 * it is intentionally not shown here (see MilkSalesListScreen header
 * comment for details) rather than inventing one.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { formatDateString } from '../../utils/date';
import { formatCurrency, formatLiters } from '../../utils/format';

const SaleListItem = ({ sale, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.info}>
        <Text style={styles.date}>{formatDateString(sale.saleDate) || '—'}</Text>
        <Text style={styles.buyer} numberOfLines={1}>
          {sale.customer?.name || 'Unknown buyer'} · {formatLiters(sale.quantity)}
        </Text>
      </View>

      <View style={styles.amountBlock}>
        <Text style={styles.amount}>{formatCurrency(sale.amount) || '—'}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.primaryLight,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  date: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  buyer: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  amountBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
  },
});

export default SaleListItem;
