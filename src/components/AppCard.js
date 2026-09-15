/**
 * AppCard
 *
 * Simple rounded, white card container with a subtle border/shadow.
 * Used as the base building block for list rows, stat tiles, sections, etc.
 *
 * Usage:
 *   <AppCard>
 *     <Text>Total Milk Production: 86.5 L</Text>
 *   </AppCard>
 */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import colors from '../constants/colors';
import { borderRadius, spacing } from '../constants/appConstants';

const AppCard = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

export default AppCard;
