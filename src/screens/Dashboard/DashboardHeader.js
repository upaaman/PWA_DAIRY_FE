/**
 * DashboardHeader
 *
 * Simple greeting header. No user profile/auth backend exists yet, so
 * this no longer shows a fake name or a fake notification count —
 * just a static greeting and a decorative (non-functional) bell icon.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import { fontSize, fontWeight } from '../../constants/appConstants';

const DashboardHeader = () => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.greeting}>Good Morning</Text>
        <Text style={styles.title}>Dairy Farm Overview</Text>
      </View>

      <View style={styles.bellButton}>
        <Text style={styles.bellIcon}>🔔</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: fontSize.lg,
  },
});

export default DashboardHeader;
