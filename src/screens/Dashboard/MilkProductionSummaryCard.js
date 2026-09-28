/**
 * MilkProductionSummaryCard
 *
 * The big dark-green hero card showing today's total milk production
 * and an optional percentage comparison vs. a previous period.
 * `percentChange` is optional — pass `null`/`undefined` to hide it
 * if the backend doesn't provide it yet.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';

const MilkProductionSummaryCard = ({ totalLiters, percentChange, comparisonLabel }) => {
  const hasComparison = typeof percentChange === 'number';
  const isPositive = hasComparison && percentChange >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.label}>Total Milk Production</Text>
        <Text style={styles.value}>{totalLiters} L</Text>

        {hasComparison ? (
          <Text style={styles.change}>
            {isPositive ? '↑' : '↓'} {Math.abs(percentChange)}%{' '}
            <Text style={styles.changeMuted}>{comparisonLabel}</Text>
          </Text>
        ) : null}
      </View>

      <View style={styles.iconCircle}>
        <Text style={styles.icon}>🥛</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryDeep,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    minHeight: 132,
    borderBottomWidth: 5,
    borderBottomColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textBlock: {
    flex: 1,
  },
  label: {
    color: colors.primaryLight,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  value: {
    color: colors.white,
    fontSize: 36,
    letterSpacing: -1,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  change: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.sm,
  },
  changeMuted: {
    color: colors.primaryLight,
    fontWeight: fontWeight.regular,
  },
  iconCircle: {
    width: 68,
    height: 76,
    borderRadius: 24,
    transform: [{ rotate: '10deg' }],
    backgroundColor: '#FFE8AB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  icon: {
    fontSize: 36,
  },
});

export default MilkProductionSummaryCard;
