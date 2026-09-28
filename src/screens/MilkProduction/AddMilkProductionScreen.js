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
 * The animal picker is populated from the real
 *   GET /animal/getAllMilkProductionAnimals?productionDate={date}&shift={shift}
 * endpoint (same one used by the Animal List screen).
 *
 * The list is date+shift specific, so it is re-fetched whenever the
 * selected production date or shift changes, and the currently chosen
 * animal is cleared if it is no longer eligible for the new selection.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

const AddMilkProductionScreen = () => {
  const [animals, setAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState(null);
  // Distinguishes the first load (full-screen loader allowed) from a
  // background refresh after the user changes the date/shift.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const productionDate = toISODateString(form.productionDate);
  const shift = form.shift;

  const loadAnimals = useCallback(async () => {
    try {
      setAnimalsLoading(true);
      setAnimalsError(null);
      const response = await get(
        `/animal/getAllMilkProductionAnimals?productionDate=${productionDate}&shift=${shift}`,
      );
      const list = Array.isArray(response) ? response : [];
      setAnimals(list);
      // The picked animal may not be eligible for the new date/shift — if
      // so, clear the selection so the form doesn't silently submit a
      // stale animalId.
      setForm(prev =>
        prev.animalId && !list.some(animal => animal.id === prev.animalId)
          ? { ...prev, animalId: null }
          : prev,
      );
      setHasLoadedOnce(true);
    } catch (err) {
      setAnimalsError(err);
    } finally {
      setAnimalsLoading(false);
    }
  }, [productionDate, shift]);

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
      // Stay ready for the next animal, keeping the selected date and shift.
      setForm(prev => ({ ...prev, animalId: null, quantity: '' }));
      setErrors({});
      await loadAnimals();
      Alert.alert('Success', 'Milk production recorded successfully.', [
        { text: 'OK' },
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

  if (!hasLoadedOnce) {
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
          title="No animals available"
          message="No animals are eligible for milk production on the selected date and shift."
        />
      );
    }
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
        {animalsLoading ? (
          <View style={styles.refreshingBar}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.refreshingText}>Updating list…</Text>
          </View>
        ) : null}

        {animalsError ? (
          <Pressable style={styles.errorBar} onPress={loadAnimals}>
            <Text style={styles.errorBarText}>
              Couldn't refresh animals for this date & shift — tap to retry.
            </Text>
          </Pressable>
        ) : null}

        {!animalsLoading && !animalsError && animals.length === 0 ? (
          <View style={styles.emptyBar}>
            <Text style={styles.emptyBarText}>
              No animals are eligible for milk production on this date and
              shift.
            </Text>
          </View>
        ) : null}

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
  refreshingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  refreshingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  errorBar: {
    backgroundColor: '#FDECEC',
    padding: spacing.md,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  errorBarText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.danger,
  },
  emptyBar: {
    backgroundColor: '#FFF6E5',
    padding: spacing.md,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  emptyBarText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A5A00',
  },
});

export default AddMilkProductionScreen;
