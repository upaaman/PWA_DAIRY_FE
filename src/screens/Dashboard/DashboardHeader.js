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
      <View style={styles.heading}>
        <Text style={styles.greeting}>Good Morning,</Text>
        <Text style={styles.title}>Mr Akash Ji</Text>
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
  heading: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.8,
    marginTop: 4,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  bellButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    transform: [{ rotate: '8deg' }],
    backgroundColor: '#FFE8AB',
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
