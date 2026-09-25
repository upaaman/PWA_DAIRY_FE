/**
 * appConstants.js
 *
 * Shared design tokens: spacing, border radius, font sizes, font weights,
 * and reusable shadows. Using a fixed scale (instead of random numbers per
 * screen) keeps spacing and typography consistent across the whole app.
 */
import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999, // fully rounded, e.g. pill buttons / avatars
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Reusable elevation/shadow recipes (deep, tab, none).
export const shadows = {
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#173B28',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  floating: {
    ...Platform.select({
      ios: {
        shadowColor: '#113D24',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  subtle: {
    ...Platform.select({
      ios: {
        shadowColor: '#113D24',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
};

export default {
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};
