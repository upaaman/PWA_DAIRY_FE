/**
 * SectionTabs
 *
 * Simple underline-style tab switcher (e.g. "Overview" / "Production
 * History"). Distinct from FilterChip (pill chips) — this matches the
 * underlined-tab pattern used on the Animal Details screen.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';

const SectionTabs = ({ tabs, activeKey, onSelect }) => {
  return (
    <View style={styles.row}>
      {tabs.map(tab => {
        const isActive = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={styles.tab}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            <View style={[styles.underline, isActive && styles.underlineActive]} />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    marginRight: spacing.xl,
    paddingBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  underline: {
    height: 2,
    marginTop: spacing.xs,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: colors.primary,
  },
});

export default SectionTabs;
