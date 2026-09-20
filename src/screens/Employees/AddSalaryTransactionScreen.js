/**
 * AddSalaryTransactionScreen
 *
 * Form to record a salary ledger transaction for an employee.
 *
 * Backend endpoint:
 *   POST /salaryTransaction/create
 *   {
 *     type,             // e.g. SALARY_CREDIT
 *     amount,           // number
 *     employeeId,
 *     transactionDate,  // "yyyy-MM-dd"
 *     salaryMonth,      // "yyyy-MM"
 *     notes
 *   }
 *
 * Opened from the Employee screen with the chosen employee (employeeId +
 * employeeName). The employee is shown read-only — you cannot change it here,
 * and this screen never fetches the employee list. `salaryMonth` defaults to
 * the transaction date's month and stays editable.
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
import AppSelect from '../../components/AppSelect';
import AppDatePicker from '../../components/AppDatePicker';
import AppCard from '../../components/AppCard';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { SALARY_TRANSACTION_TYPE_OPTIONS } from '../../constants/employeeEnums';
import { toISODateString } from '../../utils/date';

const toYearMonth = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const AddSalaryTransactionScreen = ({ navigation, route }) => {
  const { employeeId, employeeName } = route.params || {};

  const [form, setForm] = useState({
    employeeId: employeeId ?? null,
    type: 'PAYMENT',
    amount: '',
    transactionDate: new Date(),
    salaryMonth: toYearMonth(new Date()),
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [salaryMonthTouched, setSalaryMonthTouched] = useState(false);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleTransactionDateChange = value => {
    setForm(prev => ({
      ...prev,
      transactionDate: value,
      salaryMonth: salaryMonthTouched ? prev.salaryMonth : toYearMonth(value),
    }));
    setErrors(prev => ({ ...prev, transactionDate: undefined }));
  };

  const handleSalaryMonthChange = value => {
    setSalaryMonthTouched(true);
    setField('salaryMonth', value);
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.employeeId) {
      nextErrors.employeeId = 'Please select an employee.';
    }
    if (!form.type) {
      nextErrors.type = 'Please select a transaction type.';
    }
    const amountValue = Number(form.amount);
    if (!form.amount.trim() || Number.isNaN(amountValue) || amountValue <= 0) {
      nextErrors.amount = 'Please enter a valid positive amount.';
    }
    if (!form.transactionDate) {
      nextErrors.transactionDate = 'Please select a date.';
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(form.salaryMonth.trim())) {
      nextErrors.salaryMonth = 'Please enter a valid month (e.g. 2026-09).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      type: form.type,
      amount: Number(form.amount),
      employeeId: form.employeeId,
      transactionDate: toISODateString(form.transactionDate),
      salaryMonth: form.salaryMonth.trim(),
      notes: form.notes.trim() || null,
    };

    try {
      setSubmitting(true);
      await post('/salaryTransaction/create', payload);
      Alert.alert('Success', 'Salary transaction recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not save transaction',
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
            <Text style={styles.icon}>🧾</Text>
          </View>
          <Text style={styles.title}>Add Salary Transaction</Text>
          <Text style={styles.subtitle}>
            Record a credit/payment to an employee's salary ledger.
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

        <AppSelect
          label="Type *"
          placeholder="Select type"
          value={form.type}
          options={SALARY_TRANSACTION_TYPE_OPTIONS}
          onSelect={value => setField('type', value)}
          error={errors.type}
        />

        <AppInput
          label="Amount (₹) *"
          placeholder="E.g. 200"
          value={form.amount}
          onChangeText={value => setField('amount', value)}
          keyboardType="decimal-pad"
          error={errors.amount}
        />

        <AppDatePicker
          label="Transaction Date *"
          value={form.transactionDate}
          onChange={handleTransactionDateChange}
          maximumDate={new Date()}
          error={errors.transactionDate}
        />

        <AppInput
          label="Salary Month *"
          placeholder="E.g. 2026-09"
          value={form.salaryMonth}
          onChangeText={handleSalaryMonthChange}
          keyboardType="numbers-and-punctuation"
          maxLength={7}
          error={errors.salaryMonth}
        />

        <AppInput
          label="Notes"
          placeholder="Any remarks about this transaction"
          value={form.notes}
          onChangeText={value => setField('notes', value)}
          multiline
          numberOfLines={3}
        />

        <AppButton
          title="Save Transaction"
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

export default AddSalaryTransactionScreen;