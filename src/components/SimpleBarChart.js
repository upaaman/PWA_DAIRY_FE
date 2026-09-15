/**
 * SimpleBarChart
 *
 * Minimal vertical bar chart built with plain Views — no charting
 * library needed for a handful of bars. Bar heights are proportional
 * to `value` relative to the largest value in `data`.
 *
 * Usage:
 *   <SimpleBarChart
 *     data={[{ label: 'Mon', value: 12 }, { label: 'Tue', value: 18 }]}
 *   />
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import colors from '../constants/colors';
import { borderRadius, fontSize, spacing } from '../constants/appConstants';

const MAX_BAR_HEIGHT = 100;

const SimpleBarChart = ({ data, barColor = colors.primary }) => {
  const maxValue = Math.max(1, ...data.map(item => item.value || 0));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {data.map((item, index) => {
        const height = Math.max(
          4,
          (item.value / maxValue) * MAX_BAR_HEIGHT,
        );
        return (
          <View key={item.label + index} style={styles.column}>
            <Text style={styles.value}>
              {item.value > 0 ? item.value : ''}
            </Text>
            <View style={styles.trackWrap}>
              <View
                style={[
                  styles.bar,
                  { height, backgroundColor: barColor },
                ]}
              />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: spacing.sm,
  },
  column: {
    alignItems: 'center',
    width: 40,
    marginRight: spacing.sm,
  },
  value: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
    height: 14,
  },
  trackWrap: {
    height: MAX_BAR_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: borderRadius.sm,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default SimpleBarChart;
