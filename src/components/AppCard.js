/**
 * AppCard
 *
 * Rounded, white card container with a soft green-tinted shadow.
 * Used as the base building block for list rows, stat tiles, sections, etc.
 *
 * Variants:
 *   - "default": white surface, soft shadow (list rows, stat tiles)
 *   - "raised":   slightly stronger, floats above the background (hero/summary cards)
 *   - "green":    soft green-tinted background, no border (highlights/quick actions)
 *   - "outline":  transparent, thin green border (secondary content)
 *
 * Usage:
 *   <AppCard>
 *     <Text>Total Milk Production: 86.5 L</Text>
 *   </AppCard>
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import colors from '../constants/colors';
import { borderRadius, shadows, spacing } from '../constants/appConstants';

const AppCard = ({ children, style, variant = 'default' }) => {
  return <View style={[styles.base, styles[variant], style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  raised: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  green: {
    backgroundColor: colors.primaryLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.green300,
  },
});

export default AppCard;