/**
 * appConstants.js
 *
 * Shared design tokens: spacing, border radius, font sizes, and font weights.
 * Using a fixed scale (instead of random numbers per screen) keeps spacing
 * and typography consistent across the whole app.
 */

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

export default {
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
};
