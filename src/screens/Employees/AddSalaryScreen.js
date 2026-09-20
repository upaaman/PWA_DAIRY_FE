/**
 * AddSalaryScreen
 *
 * Form to record a monthly salary slab for an employee.
 *
 * Backend endpoint:
 *   POST /salary/create
 *   {
 *     employeeId,
 *     effectiveFrom,    // "yyyy-MM-dd"
 *     effectiveTo,      // "yyyy-MM-dd"
 *     monthlySalary     // number
 *   }
 *
 * Opened from the Employee screen with the chosen employee (employeeId +
 * employeeName). The employee is shown read-only — you cannot change it here,
 * and this screen never fetches the employee list.
 */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { post } from '../../api/decentralizedWrapper';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AppDatePicker from '../../components/AppDatePicker';
import AppCard from '../../components/AppCard';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { toISODateString } from '../../utils/date';

const AddSalaryScreen = ({ navigation, route }) => {
  const { employeeId, employeeName } = route.params || {};

  const [form, setForm] = useState({
    employeeId: employeeId ?? null,
    effectiveFrom: new Date(),
    effectiveTo: new Date(),
    monthlySalary: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.employeeId) {
      nextErrors.employeeId = 'Please select an employee.';
    }
    if (!form.effectiveFrom) {
      nextErrors.effectiveFrom = 'Please select a start date.';
    }
    if (!form.effectiveTo) {
      nextErrors.effectiveTo = 'Please select an end date.';
    }
    if (
      form.effectiveFrom &&
      form.effectiveTo &&
      form.effectiveFrom > form.effectiveTo
    ) {
      nextErrors.effectiveTo = 'End date cannot be before start date.';
    }
    const salaryValue = Number(form.monthlySalary);
    if (
      !form.monthlySalary.trim() ||
      Number.isNaN(salaryValue) ||
      salaryValue <= 0
    ) {
      nextErrors.monthlySalary = 'Please enter a valid positive salary.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      employeeId: form.employeeId,
      effectiveFrom: toISODateString(form.effectiveFrom),
      effectiveTo: toISODateString(form.effectiveTo),
      monthlySalary: Number(form.monthlySalary),
    };

    try {
      setSubmitting(true);
      await post('/salary/create', payload);
      Alert.alert('Success', 'Salary recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not save salary',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>💰</Text>
          </View>
          <Text style={styles.title}>Add Salary</Text>
          <Text style={styles.subtitle}>
            Record the monthly salary for an employee.
          </Text>
        </View>

        <AppCard style={styles.employeeCard}>
          <View style={styles.employeeCardAvatar}>
            <Text style={styles.employeeCardAvatarEmoji}>👷</Text>
          </View>
          <View style={styles.employeeCardInfo}>
            <Text style={styles.employeeCardLabel}>Employee</Text>
            <Text style={styles.employeeCardName}>
              {employeeName || 'Employee'}
            </Text>
          </View>
        </AppCard>

        <AppDatePicker
          label="Effective From *"
          value={form.effectiveFrom}
          onChange={value => setField('effectiveFrom', value)}
          maximumDate={form.effectiveTo || new Date()}
          error={errors.effectiveFrom}
        />

        <AppDatePicker
          label="Effective To *"
          value={form.effectiveTo}
          onChange={value => setField('effectiveTo', value)}
          minimumDate={form.effectiveFrom}
          maximumDate={new Date()}
          error={errors.effectiveTo}
        />

        <AppInput
          label="Monthly Salary (₹) *"
          placeholder="E.g. 7500"
          value={form.monthlySalary}
          onChangeText={value => setField('monthlySalary', value)}
          keyboardType="decimal-pad"
          error={errors.monthlySalary}
        />

        <AppButton
          title="Save Salary"
          onPress={handleSave}
          loading={submitting}
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  employeeCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  employeeCardAvatarEmoji: {
    fontSize: 22,
  },
  employeeCardInfo: {
    flex: 1,
  },
  employeeCardLabel: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  employeeCardName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: 2,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});

export default AddSalaryScreen;