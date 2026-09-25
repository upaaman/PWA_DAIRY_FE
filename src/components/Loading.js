/**
 * Loading
 *
 * Branded full-space loading indicator with an optional message.
 * Drop it in place of a screen's content while data is being fetched.
 *
 * Usage:
 *   if (isLoading) return <Loading />;
 *   if (isLoading) return <Loading message="Fetching animals..." />;
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import colors from '../constants/colors';
import { shadows } from '../constants/appConstants';
import { fontSize, spacing } from '../constants/appConstants';

const Loading = ({ message }) => {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <View style={styles.badgeInner}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  badgeInner: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: spacing.lg,
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

export default Loading;