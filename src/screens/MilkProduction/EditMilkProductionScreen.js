/**
 * EditMilkProductionScreen
 *
 * Form to update an existing milk production entry. The record is
 * passed from the detail view (the backend has no get-by-id endpoint
 * for production records). Submits to the real backend endpoint:
 *   PATCH /milkProduction/update/{id}   (MilkProductionController.updateMilkProduction)
 * using the exact request shape of the update DTO:
 *   { animalId, quantity, shift, productionDate }
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { get, patch } from '../../api/decentralizedWrapper';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AppSelect from '../../components/AppSelect';
import AppDatePicker from '../../components/AppDatePicker';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import colors from '../../constants/colors';
import { spacing } from '../../constants/appConstants';
import { SHIFT_OPTIONS } from '../../constants/enums';
import { toISODateString } from '../../utils/date';

// Backend returns "yyyy-MM-dd" (UTC); parse the parts directly so the
// local Date used by the picker/`toISODateString` stays on the same day.
const parseDateString = dateString => {
  if (!dateString) {
    return new Date();
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const EditMilkProductionScreen = ({ navigation, route }) => {
  const record = route.params?.record;

  const [animals, setAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState(null);

  const [form, setForm] = useState({
    animalId: record?.animal?.id ?? null,
    quantity: record ? String(record.quantity) : '',
    shift: record?.productionShift ?? '',
    productionDate: record ? parseDateString(record.productionDate) : new Date(),
  });
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
    if (!form.animalId) {
      nextErrors.animalId = 'Please select an animal.';
    }
    const quantityValue = Number(form.quantity);
    if (!form.quantity.trim() || Number.isNaN(quantityValue) || quantityValue <= 0) {
      nextErrors.quantity = 'Please enter a valid positive quantity.';
    }
    if (!form.shift) {
      nextErrors.shift = 'Please select a shift.';
    }
    if (!form.productionDate) {
      nextErrors.productionDate = 'Please select a date.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !record) {
      return;
    }

    const payload = {
      animalId: form.animalId,
      quantity: Number(form.quantity),
      shift: form.shift,
      productionDate: toISODateString(form.productionDate),
    };

    try {
      setSubmitting(true);
      await patch(`/milkProduction/update/${record.id}`, payload);
      // Pop past the detail screen (which still holds the stale record) so
      // the updated data is shown — the list reloads on next focus.
      Alert.alert('Success', 'Milk production updated successfully.', [
        { text: 'OK', onPress: () => navigation.pop(2) },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not update production',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!record) {
    return (
      <EmptyState
        icon="⚠️"
        title="Record unavailable"
        message="This production record could not be found."
      />
    );
  }

  const animalOptions = animals.map(animal => ({
    label: `#${animal.id}${animal.name ? `  ${animal.name}` : ''}`,
    value: animal.id,
  }));

  if (animalsLoading) {
    return <Loading message="Loading animals..." />;
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
          label="Animal *"
          placeholder="Select animal"
          value={form.animalId}
          options={animalOptions}
          onSelect={value => setField('animalId', value)}
          error={errors.animalId}
        />

        <AppInput
          label="Quantity (Liters) *"
          placeholder="E.g. 12.5"
          value={form.quantity}
          onChangeText={value => setField('quantity', value)}
          keyboardType="numeric"
          error={errors.quantity}
        />

        <AppSelect
          label="Shift *"
          placeholder="Select shift"
          value={form.shift}
          options={SHIFT_OPTIONS}
          onSelect={value => setField('shift', value)}
          error={errors.shift}
        />

        <AppDatePicker
          label="Production Date *"
          value={form.productionDate}
          onChange={value => setField('productionDate', value)}
          maximumDate={new Date()}
          error={errors.productionDate}
        />

        <AppButton
          title="Save Changes"
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

export default EditMilkProductionScreen;