/**
 * StatBreakdownRow
 *
 * One row in a simple horizontal breakdown (e.g. "By Animal Type",
 * "By Shift"): label + value on top, a proportional filled bar below,
 * with the percentage on the right. Used instead of a pie/donut chart
 * to avoid pulling in an SVG charting library for Phase 1.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { formatLiters } from '../../utils/format';

const StatBreakdownRow = ({ label, value, percent, color = colors.primary }) => {
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.value}>
          {formatLiters(value)} · {percent}%
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(100, percent)}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  value: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  track: {
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});

export default StatBreakdownRow;
