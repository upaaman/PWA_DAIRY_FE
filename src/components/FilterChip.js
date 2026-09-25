/**
 * FilterChip
 *
 * Selectable pill used for filter rows across the app (Animal type
 * filters, quick date-range chips, etc). `count` is optional — pass it
 * to show "(N)" after the label, or omit it for a plain chip.
 */
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import colors from '../constants/colors';
import { borderRadius, fontSize, fontWeight, shadows, spacing } from '../constants/appConstants';

const FilterChip = ({ label, count, active, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && !active && styles.chipPressed,
      ]}
    >
      <Text style={[styles.label, active && styles.labelActive]}>
        {label}
        {count !== undefined ? ` (${count})` : ''}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    ...shadows.subtle,
  },
  chipPressed: {
    transform: [{ scale: 0.97 }],
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
});

export default FilterChip;
