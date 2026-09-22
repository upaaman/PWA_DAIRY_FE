/**
 * AddExpenseScreen
 *
 * Form to record a new expense. Submits to the real backend endpoint:
 *   POST /expense/create   (ExpenseController.createExpense)
 * using the exact request shape:
 *   { amount, notes, expenseDate, type, animalId? }
 *
 * `animalId` is optional — leave "Animal" as None and it is omitted from
 * the payload. The animal picker is populated from GET /animal/getAll.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { get, post } from '../../api/decentralizedWrapper';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AppSelect from '../../components/AppSelect';
import AppDatePicker from '../../components/AppDatePicker';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import colors from '../../constants/colors';
import { spacing } from '../../constants/appConstants';
import { EXPENSE_TYPE_OPTIONS } from '../../constants/expenseEnums';
import { toISODateString } from '../../utils/date';

const initialForm = {
  type: null,
  amount: '',
  expenseDate: new Date(),
  notes: '',
  animalId: null,
};

const animalOptions = animals => [
  { label: 'None', value: null },
  ...animals.map(animal => ({
    label: `#${animal.id}${animal.name ? `  ${animal.name}` : ''}`,
    value: animal.id,
  })),
];

const AddExpenseScreen = ({ navigation }) => {
  const [animals, setAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadAnimals = useCallback(async () => {
    try {
      setAnimalsLoading(true);
      setAnimalsError(null);
      const response = await get('/animal/getAll');
      setAnimals(Array.isArray(response) ? response : []);
    } catch (err) {
      setAnimalsError(err);
    } finally {
      setAnimalsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnimals();
  }, [loadAnimals]);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.type) {
      nextErrors.type = 'Please select an expense type.';
    }
    const amountValue = Number(form.amount);
    if (!form.amount.trim() || Number.isNaN(amountValue) || amountValue <= 0) {
      nextErrors.amount = 'Please enter a valid positive amount.';
    }
    if (!form.expenseDate) {
      nextErrors.expenseDate = 'Please select a date.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      amount: Number(form.amount),
      notes: form.notes.trim() || null,
      expenseDate: toISODateString(form.expenseDate),
      type: form.type,
      ...(form.animalId ? { animalId: form.animalId } : {}),
    };

    try {
      setSubmitting(true);
      await post('/expense/create', payload);
      Alert.alert('Success', 'Expense recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not save expense',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (animalsLoading) {
    return <Loading message="Loading..." />;
  }

  if (animalsError) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load animals"
        message={animalsError.message || 'Please try again.'}
        actionLabel="Retry"
        onActionPress={loadAnimals}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppSelect
          label="Type *"
          placeholder="Select type"
          value={form.type}
          options={EXPENSE_TYPE_OPTIONS}
          onSelect={value => setField('type', value)}
          error={errors.type}
        />

        <AppInput
          label="Amount (₹) *"
          placeholder="E.g. 500"
          value={form.amount}
          onChangeText={value => setField('amount', value)}
          keyboardType="numeric"
          error={errors.amount}
        />

        <AppDatePicker
          label="Expense Date *"
          value={form.expenseDate}
          onChange={value => setField('expenseDate', value)}
          maximumDate={new Date()}
          error={errors.expenseDate}
        />

        <AppSelect
          label="Animal (optional)"
          placeholder="Select animal"
          value={form.animalId}
          options={animalOptions(animals)}
          onSelect={value => setField('animalId', value)}
        />

        <AppInput
          label="Notes"
          placeholder="Any remarks about this expense"
          value={form.notes}
          onChangeText={value => setField('notes', value)}
          multiline
          numberOfLines={3}
        />

        <AppButton
          title="Save Expense"
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
  saveButton: {
    marginTop: spacing.md,
  },
});

export default AddExpenseScreen;