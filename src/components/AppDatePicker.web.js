import React, { useId } from 'react';
import { View, StyleSheet } from 'react-native';
import { toISODateString } from '../utils/date';
const dateValue = value =>
  value instanceof Date && !Number.isNaN(value.getTime())
    ? toISODateString(value)
    : '';
export default function AppDatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  minimumDate,
  maximumDate,
  containerStyle,
}) {
  const id = useId();
  const handleDateChange = event => {
    const input = event.target;
    if (!input.value || !input.validity.valid) return;
    const [year, month, day] = input.value.split('-').map(Number);
    onChange(new Date(year, month - 1, day));
  };
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <label
          htmlFor={id}
          style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        aria-label={label || placeholder}
        type="date"
        value={dateValue(value)}
        min={dateValue(minimumDate)}
        max={dateValue(maximumDate)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        style={{
          width: '100%',
          minWidth: 0,
          minHeight: 50,
          padding: 12,
          background: 'white',
          color: '#203729',
          border: `1px solid ${error ? '#c53f51' : '#dfe8d8'}`,
          borderRadius: 16,
        }}
        onChange={handleDateChange}
        onInput={handleDateChange}
      />
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          style={{ color: '#c53f51', marginTop: 4 }}
        >
          {error}
        </span>
      )}
    </View>
  );
}
const styles = StyleSheet.create({ container: { marginBottom: 16 } });
