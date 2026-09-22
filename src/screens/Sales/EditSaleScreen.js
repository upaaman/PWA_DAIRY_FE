/**
 * EditSaleScreen
 *
 * Form to update an existing milk sale. The sale object is passed from
 * the detail view (the backend has no get-by-id endpoint for MilkSale).
 * Submits to the real backend endpoint:
 *   PATCH /milkSale/update/{id}   (MilkSaleController.updateMilkSale)
 * using the exact request shape of the update DTO:
 *   { quantity, shift, amount, customerId, saleDate, rate, animalType }
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { get, patch } from '../../api/decentralizedWrapper';
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
import { getMilkRateForType } from '../../utils/milkRates';

// Backend returns "yyyy-MM-dd" (UTC); parse the parts directly so the
// local Date used by the picker/`toISODateString` stays on the same day.
const parseDateString = dateString => {
  if (!dateString) {
    return new Date();
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const EditSaleScreen = ({ navigation, route }) => {
  const sale = route.params?.sale;

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState(null);

  const [form, setForm] = useState({
    customerId: sale?.customer?.id ?? null,
    animalType: sale?.animalType ?? null,
    shift: sale?.shift ?? '',
    saleDate: sale ? parseDateString(sale.saleDate) : new Date(),
    quantity: sale ? String(sale.quantity) : '',
    rate: sale ? String(sale.rate) : '',
    amount: sale ? String(sale.amount) : '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [rateTouched, setRateTouched] = useState(false);

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

  const handleSelectCustomer = value => {
    const customer = customers.find(c => c.id === value);
    setForm(prev => {
      const next = { ...prev, customerId: value };
      if (!rateTouched && next.animalType) {
        const autoRate = getMilkRateForType(customer, next.animalType);
        next.rate = autoRate != null ? String(autoRate) : '';
      }
      return next;
    });
    setErrors(prev => ({ ...prev, customerId: undefined }));
  };

  const handleSelectAnimalType = value => {
    const customer = customers.find(c => c.id === form.customerId);
    setForm(prev => {
      const next = { ...prev, animalType: value };
      if (!rateTouched) {
        const autoRate = customer ? getMilkRateForType(customer, value) : null;
        next.rate = autoRate != null ? String(autoRate) : '';
      }
      return next;
    });
    setErrors(prev => ({ ...prev, animalType: undefined }));
  };

  const handleChangeRate = value => {
    setField('rate', value);
    setRateTouched(true);
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
    const amountValue = Number(form.amount);
    if (!form.amount.trim() || Number.isNaN(amountValue) || amountValue <= 0) {
      nextErrors.amount = 'Please enter a valid positive amount.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !sale) {
      return;
    }

    const payload = {
      quantity: Number(form.quantity),
      shift: form.shift,
      amount: Number(form.amount),
      customerId: form.customerId,
      saleDate: toISODateString(form.saleDate),
      rate: Number(form.rate),
      animalType: form.animalType,
    };

    try {
      setSubmitting(true);
      await patch(`/milkSale/update/${sale.id}`, payload);
      // Pop past the detail screen (which still holds the stale sale) so
      // the updated data is shown — the list reloads on next focus.
      Alert.alert('Success', 'Sale updated successfully.', [
        { text: 'OK', onPress: () => navigation.pop(2) },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not update sale',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!sale) {
    return (
      <EmptyState
        icon="⚠️"
        title="Sale not found"
        message="This sale's details are no longer available."
      />
    );
  }

  const customerOptions = customers.map(customer => ({
    label: customer.name,
    value: customer.id,
  }));

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

  const previewAmount =
    form.quantity && form.rate
      ? formatCurrency(Number(form.quantity) * Number(form.rate))
      : null;

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
          onSelect={handleSelectCustomer}
          error={errors.customerId}
        />

        <AppSelect
          label="Animal Type *"
          placeholder="Select type"
          value={form.animalType}
          options={TYPE_OPTIONS}
          onSelect={handleSelectAnimalType}
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
          onChangeText={handleChangeRate}
          keyboardType="numeric"
          error={errors.rate}
        />

        <AppInput
          label="Amount (₹) *"
          placeholder="E.g. 169"
          value={form.amount}
          onChangeText={value => setField('amount', value)}
          keyboardType="numeric"
          error={errors.amount}
        />

        {previewAmount ? (
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Computed Amount</Text>
            <Text style={styles.previewValue}>{previewAmount}</Text>
          </View>
        ) : null}

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

export default EditSaleScreen;