/**
 * AddPurchaseScreen
 *
 * Form to record a new milk purchase (from a seller). Submits to the
 * real backend endpoint:
 *   POST /purchase/create   (MilkPurchaseController.createMilkPurchase)
 * using the exact request shape of MilkPurchaseRequestDTO:
 *   { purchaseDate, shift, quantity, rate, sellerId, animalType }
 *
 * `amount` is NOT sent — the backend computes it itself
 * (quantity * rate, see MilkPurchaseService.createMilkPurchase). Shown
 * here only as a live read-only preview.
 *
 * The seller picker is populated from the real GET /seller/getAll
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
  sellerId: null,
  animalType: null,
  shift: null,
  purchaseDate: new Date(),
  quantity: '',
  rate: '',
};

const AddPurchaseScreen = ({ navigation }) => {
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [sellersError, setSellersError] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadSellers = useCallback(async () => {
    try {
      setSellersLoading(true);
      setSellersError(null);
      const response = await get('/seller/getAll');
      setSellers(Array.isArray(response) ? response : []);
    } catch (err) {
      setSellersError(err);
    } finally {
      setSellersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSellers();
  }, [loadSellers]);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.sellerId) {
      nextErrors.sellerId = 'Please select a seller.';
    }
    if (!form.animalType) {
      nextErrors.animalType = 'Please select an animal type.';
    }
    if (!form.shift) {
      nextErrors.shift = 'Please select a shift.';
    }
    if (!form.purchaseDate) {
      nextErrors.purchaseDate = 'Please select a date.';
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
      sellerId: form.sellerId,
      animalType: form.animalType,
      shift: form.shift,
      purchaseDate: toISODateString(form.purchaseDate),
      quantity: Number(form.quantity),
      rate: Number(form.rate),
    };

    try {
      setSubmitting(true);
      await post('/purchase/create', payload);
      Alert.alert('Success', 'Purchase recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not save purchase',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const sellerOptions = sellers.map(seller => ({
    label: seller.name,
    value: seller.id,
  }));

  const previewAmount =
    form.quantity && form.rate
      ? formatCurrency(Number(form.quantity) * Number(form.rate))
      : null;

  if (sellersLoading) {
    return <Loading message="Loading sellers..." />;
  }

  if (sellersError) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load sellers"
        message={sellersError.message || 'Please try again.'}
        actionLabel="Retry"
        onActionPress={loadSellers}
      />
    );
  }

  if (sellers.length === 0) {
    return (
      <EmptyState
        title="No sellers yet"
        message="Add a seller on the backend before recording a purchase."
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
          label="Seller *"
          placeholder="Select seller"
          value={form.sellerId}
          options={sellerOptions}
          onSelect={value => setField('sellerId', value)}
          error={errors.sellerId}
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
          label="Purchase Date *"
          value={form.purchaseDate}
          onChange={value => setField('purchaseDate', value)}
          maximumDate={new Date()}
          error={errors.purchaseDate}
        />

        <AppInput
          label="Quantity (Liters) *"
          placeholder="E.g. 5.4"
          value={form.quantity}
          onChangeText={value => setField('quantity', value)}
          keyboardType="numeric"
          error={errors.quantity}
        />

        <AppInput
          label="Rate (₹ per Liter) *"
          placeholder="E.g. 52"
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
    color: colors.info,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});

export default AddPurchaseScreen;
