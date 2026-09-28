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
    <View style={[styles.card, { borderColor: backgroundColor }]}>
      <View style={styles.topRow}>
        <View style={[styles.emojiWrap, { backgroundColor }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderBottomWidth: 4,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  changePill: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs / 2,
  },
  changeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.xs / 2,
  },
});

export default DashboardStatCard;
