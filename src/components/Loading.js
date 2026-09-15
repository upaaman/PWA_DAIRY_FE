/**
 * Loading
 *
 * Simple full-space loading indicator with an optional message.
 * Drop it in place of a screen's content while data is being fetched.
 *
 * Usage:
 *   if (isLoading) return <Loading />;
 *   if (isLoading) return <Loading message="Fetching animals..." />;
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import colors from '../constants/colors';
import { fontSize, spacing } from '../constants/appConstants';

const Loading = ({ message }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

export default Loading;
