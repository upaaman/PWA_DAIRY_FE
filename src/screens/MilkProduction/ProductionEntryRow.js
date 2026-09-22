/**
 * ProductionEntryRow
 *
 * Single milk production record row: animal + type icon on the left,
 * shift as a small label, quantity on the right. Tapping the row
 * (when onPress is provided) opens the record's detail view.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing, borderRadius } from '../../constants/appConstants';
import { getShiftLabel } from '../../constants/enums';
import { formatLiters } from '../../utils/format';
import { getAnimalIcon, getAnimalTypeLabel } from '../Animals/animalMeta';

const ProductionEntryRow = ({ record, onPress }) => {
  const animal = record.animal || {};

  const content = (
    <>
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
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() => onPress(record)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
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
  rowPressed: {
    backgroundColor: colors.primaryLight,
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
  chevron: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
});

export default ProductionEntryRow;