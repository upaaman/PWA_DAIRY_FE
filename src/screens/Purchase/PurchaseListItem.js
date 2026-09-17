/**
 * PurchaseListItem
 *
 * Single row in the Milk Purchase list: date + seller on the left,
 * quantity/amount on the right.
 *
 * Not pressable — the backend MilkPurchaseController has no get-by-id
 * endpoint for purchases (only create/getAll), so there's nothing to
 * navigate to.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { formatDateString } from '../../utils/date';
import { formatCurrency, formatLiters } from '../../utils/format';
import { getShiftLabel } from '../../constants/enums';
import { getAnimalTypeLabel } from '../Animals/animalMeta';

const PurchaseListItem = ({ purchase }) => {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.date}>{formatDateString(purchase.purchaseDate) || '—'}</Text>
        <Text style={styles.seller} numberOfLines={1}>
          {purchase.seller?.name || 'Unknown seller'} · {getAnimalTypeLabel(purchase.animalType)}{' '}
          · {getShiftLabel(purchase.shift)}
        </Text>
      </View>

      <View style={styles.amountBlock}>
        <Text style={styles.amount}>{formatCurrency(purchase.amount) || '—'}</Text>
        <Text style={styles.quantity}>{formatLiters(purchase.quantity)}</Text>
      </View>
    </View>
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
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  date: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  seller: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  amountBlock: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.info,
  },
  quantity: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
});

export default PurchaseListItem;
