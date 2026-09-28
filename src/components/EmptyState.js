/**
 * EmptyState
 *
 * Shown when a list/screen has no data yet (e.g. no animals added,
 * no production records for the selected filter).
 *
 * Usage:
 *   <EmptyState
 *     title="No animals yet"
 *     message="Add your first animal to get started."
 *   />
 *
 *   <EmptyState
 *     title="No records found"
 *     message="Try changing your filters."
 *     actionLabel="Clear Filters"
 *     onActionPress={clearFilters}
 *   />
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppButton from './AppButton';
import colors from '../constants/colors';
import { shadows } from '../constants/appConstants';
import { fontSize, fontWeight, spacing } from '../constants/appConstants';

const EmptyState = ({
  icon = '🐄',
  title,
  message,
  actionLabel,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel ? (
        <AppButton
          title={actionLabel}
          onPress={onActionPress}
          style={styles.action}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: '#FFE8AB',
    transform: [{ rotate: '-6deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});

export default EmptyState;
