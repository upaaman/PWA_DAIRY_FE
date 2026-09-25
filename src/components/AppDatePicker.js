/**
 * AppDatePicker
 *
 * Text-field-like control that opens the native date picker
 * (@react-native-community/datetimepicker) on tap.
 *
 * `value` / `onChange` work with plain JS `Date` objects — convert
 * to/from the backend's "yyyy-MM-dd" string format at the call site
 * (see src/utils/date.js).
 *
 * Usage:
 *   <AppDatePicker
 *     label="Date of Birth"
 *     value={dateOfBirth}
 *     onChange={setDateOfBirth}
 *     maximumDate={new Date()}
 *   />
 */
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../constants/appConstants';

const formatDisplayDate = date => {
  if (!date) {
    return null;
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const AppDatePicker = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  maximumDate,
  minimumDate,
  containerStyle,
}) => {
  const [visible, setVisible] = useState(false);

  const handleChange = (event, selectedDate) => {
    // On Android the picker dialog closes itself; on iOS it stays inline
    // until the user taps outside/confirms, so only auto-close on Android.
    if (Platform.OS === 'android') {
      setVisible(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.labelDot}>●</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.field, error && styles.fieldError]}
        onPress={() => setVisible(true)}
      >
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>📅</Text>
        </View>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {visible ? (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  labelDot: {
    fontSize: 6,
    color: colors.primary,
    marginLeft: spacing.xs,
    marginBottom: 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    backgroundColor: colors.white,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  valueText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  placeholderText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: fontSize.xs,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.danger,
  },
});

export default AppDatePicker;
