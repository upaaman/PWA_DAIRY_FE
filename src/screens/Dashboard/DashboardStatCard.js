/**
 * DashboardStatCard
 *
 * Colorful stat tile for the dashboard grid (Purchase Qty/Amount,
 * Sale Qty/Amount). Each card gets its own background color + emoji
 * so the grid reads as distinct at a glance, plus a directional
 * (↑/↓) percentage-change indicator straight from the /dashboard
 * response.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';

const DashboardStatCard = ({ emoji, label, value, changePercent, backgroundColor }) => {
  const hasChange = typeof changePercent === 'number' && !Number.isNaN(changePercent);
  const isPositive = hasChange && changePercent >= 0;

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.topRow}>
        <Text style={styles.emoji}>{emoji}</Text>
        {hasChange ? (
          <View style={styles.changePill}>
            <Text style={styles.changeText}>
              {isPositive ? '↑' : '↓'} {Math.abs(changePercent)}%
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 24,
  },
  changePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs / 2,
  },
  changeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.sm,
  },
  label: {
    fontSize: fontSize.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: spacing.xs / 2,
  },
});

export default DashboardStatCard;
