/**
 * PurchaseListItem
 *
 * Single row in the Milk Purchase list: date + seller on the left,
 * quantity/amount on the right and a chevron to open its details.
 *
 * The backend has no get-by-id endpoint for purchases, so the selected
 * object from GET /purchase/getAll is passed to the details screen through
 * navigation params.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { formatDateString } from '../../utils/date';
import { formatCurrency, formatLiters } from '../../utils/format';
import { getShiftLabel } from '../../constants/enums';
import { getAnimalTypeLabel } from '../Animals/animalMeta';

const PurchaseListItem = ({ purchase, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.info}>
        <Text style={styles.date}>
          {formatDateString(purchase.purchaseDate) || '—'}
        </Text>
        <Text style={styles.seller} numberOfLines={1}>
          {purchase.seller?.name || 'Unknown seller'} ·{' '}
          {getAnimalTypeLabel(purchase.animalType)} ·{' '}
          {getShiftLabel(purchase.shift)}
        </Text>
      </View>

      <View style={styles.amountBlock}>
        <Text style={styles.amount}>
          {formatCurrency(purchase.amount) || '—'}
        </Text>
        <Text style={styles.quantity}>{formatLiters(purchase.quantity)}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
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
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});

export default PurchaseListItem;
