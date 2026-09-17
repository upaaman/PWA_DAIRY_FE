/**
 * AddMilkProductionScreen
 *
 * Form to record a new milk production entry. Submits to the real
 * backend endpoint:
 *   POST /milkProduction/create   (MilkProductionController.addMilkProdiction)
 * using the exact request shape of MilkProductionRequestDTO:
 *   { animalId, quantity, shift, productionDate }
 *
 * Backend validation (mirrored client-side):
 *   quantity: @NotNull @Positive
 *   shift: @NotNull
 *   animalId: @NotNull
 *   productionDate: @NotNull
 *
 * The animal picker is populated from the real GET /animal/getAll
 * endpoint (same one used by the Animal List screen).
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
import { getCurrentShift, SHIFT_OPTIONS } from '../../constants/enums';
import { toISODateString } from '../../utils/date';

const initialForm = {
  animalId: null,
  quantity: '',
  shift: getCurrentShift(),
  productionDate: new Date(),
};

const AddMilkProductionScreen = ({ navigation }) => {
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
    if (!validate()) {
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
      await post('/milkProduction/create', payload);
      Alert.alert('Success', 'Milk production recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not save production',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

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

  if (animals.length === 0) {
    return (
      <EmptyState
        title="No animals yet"
        message="Add an animal first before recording milk production."
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
          title="Save"
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

export default AddMilkProductionScreen;
