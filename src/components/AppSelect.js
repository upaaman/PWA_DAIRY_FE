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
import { borderRadius, fontSize, fontWeight, shadows, spacing } from '../constants/appConstants';

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
        <Text style={selectedOption ? styles.valueText : styles.placeholderText}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <View style={styles.chevronWrap}>
          <Text style={styles.chevron}>⌄</Text>
        </View>
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
            <View style={styles.sheetHeader}>
              {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
              <Pressable onPress={() => setVisible(false)} hitSlop={8}>
                <Text style={styles.sheetClose}>✕</Text>
              </Pressable>
            </View>
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
                    {isSelected ? (
                      <View style={styles.checkWrap}>
                        <Text style={styles.check}>✓</Text>
                      </View>
                    ) : null}
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
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: -2,
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
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    maxHeight: '62%',
    ...shadows.floating,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  sheetClose: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
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
  checkWrap: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xs,
  },
});

export default AppSelect;
