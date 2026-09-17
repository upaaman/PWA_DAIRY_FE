/**
 * AddSaleScreen
 *
 * Form to record a new milk sale. Submits to the real backend endpoint:
 *   POST /milkSale/create   (MilkSaleController.createMilkSale)
 * using the exact request shape of MilkSaleRequstDTO:
 *   { saleDate, quantity, rate, customerId, animalType, shift }
 *
 * `amount` is NOT sent — the backend computes it itself
 * (quantity * rate, see MilkSaleService.createMilkSale). It's shown
 * here only as a live read-only preview for the user's confidence.
 *
 * Note: MilkSaleRequstDTO has no @NotNull/@Valid validation on the
 * backend, but we still validate client-side for a sane UX.
 *
 * The customer picker is populated from the real GET /customer/getAll
 * endpoint.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { get, post } from '../../api/decentralizedWrapper';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AppSelect from '../../components/AppSelect';
import AppDatePicker from '../../components/AppDatePicker';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { SHIFT_OPTIONS } from '../../constants/enums';
import { TYPE_OPTIONS } from '../Animals/animalMeta';
import { toISODateString } from '../../utils/date';
import { formatCurrency } from '../../utils/format';

const initialForm = {
  customerId: null,
  animalType: null,
  shift: null,
  saleDate: new Date(),
  quantity: '',
  rate: '',
};

const AddSaleScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      setCustomersError(null);
      const response = await get('/customer/getAll');
      setCustomers(Array.isArray(response) ? response : []);
    } catch (err) {
      setCustomersError(err);
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.customerId) {
      nextErrors.customerId = 'Please select a customer.';
    }
    if (!form.animalType) {
      nextErrors.animalType = 'Please select an animal type.';
    }
    if (!form.shift) {
      nextErrors.shift = 'Please select a shift.';
    }
    if (!form.saleDate) {
      nextErrors.saleDate = 'Please select a date.';
    }
    const quantityValue = Number(form.quantity);
    if (!form.quantity.trim() || Number.isNaN(quantityValue) || quantityValue <= 0) {
      nextErrors.quantity = 'Please enter a valid positive quantity.';
    }
    const rateValue = Number(form.rate);
    if (!form.rate.trim() || Number.isNaN(rateValue) || rateValue <= 0) {
      nextErrors.rate = 'Please enter a valid positive rate.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      customerId: form.customerId,
      animalType: form.animalType,
      shift: form.shift,
      saleDate: toISODateString(form.saleDate),
      quantity: Number(form.quantity),
      rate: Number(form.rate),
    };

    try {
      setSubmitting(true);
      await post('/milkSale/create', payload);
      Alert.alert('Success', 'Sale recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not save sale',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const customerOptions = customers.map(customer => ({
    label: customer.name,
    value: customer.id,
  }));

  const previewAmount =
    form.quantity && form.rate
      ? formatCurrency(Number(form.quantity) * Number(form.rate))
      : null;

  if (customersLoading) {
    return <Loading message="Loading customers..." />;
  }

  if (customersError) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load customers"
        message={customersError.message || 'Please try again.'}
        actionLabel="Retry"
        onActionPress={loadCustomers}
      />
    );
  }

  if (customers.length === 0) {
    return (
      <EmptyState
        title="No customer yet"
        message="Add a customer on the backend before recording a sale."
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
          label="Customer *"
          placeholder="Select customer"
          value={form.customerId}
          options={customerOptions}
          onSelect={value => setField('customerId', value)}
          error={errors.customerId}
        />

        <AppSelect
          label="Animal Type *"
          placeholder="Select type"
          value={form.animalType}
          options={TYPE_OPTIONS}
          onSelect={value => setField('animalType', value)}
          error={errors.animalType}
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
          label="Sale Date *"
          value={form.saleDate}
          onChange={value => setField('saleDate', value)}
          maximumDate={new Date()}
          error={errors.saleDate}
        />

        <AppInput
          label="Quantity (Liters) *"
          placeholder="E.g. 10"
          value={form.quantity}
          onChangeText={value => setField('quantity', value)}
          keyboardType="numeric"
          error={errors.quantity}
        />

        <AppInput
          label="Rate (₹ per Liter) *"
          placeholder="E.g. 120"
          value={form.rate}
          onChangeText={value => setField('rate', value)}
          keyboardType="numeric"
          error={errors.rate}
        />

        {previewAmount ? (
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Amount</Text>
            <Text style={styles.previewValue}>{previewAmount}</Text>
          </View>
        ) : null}

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
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  previewLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  previewValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});

export default AddSaleScreen;
