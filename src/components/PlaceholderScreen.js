/**
 * PlaceholderScreen
 *
 * Generic "coming soon" screen used for routes that exist in the
 * navigation structure but don't have real business logic/UI yet.
 * Swap these out for real screens as each feature gets built.
 *
 * Usage:
 *   const AddAnimalScreen = () => (
 *     <PlaceholderScreen title="Add Animal" description="Form goes here." />
 *   );
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../constants/colors';
import { fontSize, fontWeight, spacing } from '../constants/appConstants';

const PlaceholderScreen = ({ title, description }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default PlaceholderScreen;
