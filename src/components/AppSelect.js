/**
 * AppSelect
 *
 * Simple dropdown/select field. Tapping it opens a modal with a list
 * of options; tapping an option selects it and closes the modal.
 *
 * React Native has no built-in "Picker" in core anymore, and this app
 * intentionally avoids adding `@react-native-picker/picker` just for
 * a handful of short option lists — a plain Modal + FlatList covers it
 * without an extra native dependency.
 *
 * Usage:
 *   <AppSelect
 *     label="Animal Type"
 *     placeholder="Select type"
 *     value={type}
 *     options={[{ label: 'Cow', value: 'COW' }, { label: 'Buffalo', value: 'BUFFALO' }]}
 *     onSelect={setType}
 *     error={errors.type}
 *   />
 */
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../constants/appConstants';

const AppSelect = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  error,
  containerStyle,
}) => {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = option => {
    onSelect(option.value);
    setVisible(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        style={[styles.field, error && styles.fieldError]}
        onPress={() => setVisible(true)}
      >
        <Text style={selectedOption ? styles.valueText : styles.placeholderText}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
            <FlatList
              data={options}
              keyExtractor={item => String(item.value)}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    style={styles.option}
                    onPress={() => handleSelect(item)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
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
  chevron: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.danger,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    maxHeight: '60%',
  },
  sheetTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  check: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});

export default AppSelect;
