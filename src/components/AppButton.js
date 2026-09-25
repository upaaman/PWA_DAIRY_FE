/**
 * AppButton
 *
 * Reusable button with variants + sizes:
 * - "primary"  -> solid green background (default)
 * - "outline"  -> green border, transparent background
 * - "secondary"-> light green background, dark green text
 * - "danger"   -> solid red background (destructive actions)
 *
 * Sizes:
 * - "small":  compact (filter rows / inline actions)   [32px tall]
 * - "medium": standard form button                       [44px tall]
 * - "large":  hero / full-width primary calls-to-action [52px tall]
 *
 * Usage:
 *   <AppButton title="Save" onPress={handleSave} />
 *   <AppButton title="Cancel" variant="outline" onPress={handleCancel} />
 *   <AppButton title="Retry" size="small" onPress={retry} />
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import colors from '../constants/colors';
import {
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '../constants/appConstants';

const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
}) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary}
        />
      ) : (
        <Text style={[styles.text, styles[`${size}Text`], styles[`${variant}Text`]]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    minHeight: 32,
    borderRadius: borderRadius.full,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 44,
  },
  large: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xxl,
    minHeight: 52,
    borderRadius: borderRadius.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primaryLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: fontWeight.semibold,
  },
  smallText: {
    fontSize: fontSize.xs,
  },
  mediumText: {
    fontSize: fontSize.md,
  },
  largeText: {
    fontSize: fontSize.lg,
  },
  primaryText: {
    color: colors.textOnPrimary,
  },
  dangerText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.primaryDark,
  },
  outlineText: {
    color: colors.primary,
  },
});

export default AppButton;