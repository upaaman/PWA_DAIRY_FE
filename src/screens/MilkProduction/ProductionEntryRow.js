/**
 * ProductionEntryRow
 *
 * Single milk production record row: animal + type icon on the left,
 * shift as a small label, quantity on the right.
 *
 * Note: the backend's MilkProductionController has no get-by-id or
 * delete endpoint for production records, so these rows are NOT
 * pressable / have no details navigation (nothing to navigate to).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing, borderRadius } from '../../constants/appConstants';
import { getShiftLabel } from '../../constants/enums';
import { formatLiters } from '../../utils/format';
import { getAnimalIcon, getAnimalTypeLabel } from '../Animals/animalMeta';

const ProductionEntryRow = ({ record }) => {
  const animal = record.animal || {};

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarIcon}>{getAnimalIcon(animal.type)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {animal.name ? `${animal.name} ` : ''}
          {animal.id ? `#${animal.id}` : ''}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {getAnimalTypeLabel(animal.type)} · {getShiftLabel(record.productionShift)}
        </Text>
      </View>

      <Text style={styles.quantity}>{formatLiters(record.quantity)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarIcon: {
    fontSize: fontSize.md,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  subtitle: {
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

export default ProductionEntryRow;
