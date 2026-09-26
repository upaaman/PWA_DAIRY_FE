/**
 * EditPurchaseScreen
 *
 * Updates an existing milk purchase using:
 *   PATCH /purchase/update/{id}
 *
 * The request body matches MilkPurchaseRequestDTO exactly:
 *   { purchaseDate, shift, quantity, rate, sellerId, animalType }
 *
 * The backend calculates amount from quantity and rate, so amount is shown
 * as a live preview but is not included in the PATCH body.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { get, patch } from '../../api/decentralizedWrapper';
import AppButton from '../../components/AppButton';
import AppDatePicker from '../../components/AppDatePicker';
import AppInput from '../../components/AppInput';
import AppSelect from '../../components/AppSelect';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { SHIFT_OPTIONS } from '../../constants/enums';
import { toISODateString } from '../../utils/date';
import { formatCurrency } from '../../utils/format';
import { getMilkRateForType } from '../../utils/milkRates';
import { TYPE_OPTIONS } from '../Animals/animalMeta';

// Backend dates are "yyyy-MM-dd". Parse the parts directly so the local
// Date passed to the picker remains on the same calendar day.
const parseDateString = dateString => {
  if (!dateString) {
    return new Date();
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const EditPurchaseScreen = ({ navigation, route }) => {
  const purchase = route.params?.purchase;

  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [sellersError, setSellersError] = useState(null);

  const [form, setForm] = useState({
    sellerId: purchase?.seller?.id ?? purchase?.sellerId ?? null,
    animalType: purchase?.animalType ?? null,
    shift: purchase?.shift ?? '',
    purchaseDate: purchase
      ? parseDateString(purchase.purchaseDate)
      : new Date(),
    quantity: purchase ? String(purchase.quantity) : '',
    rate: purchase ? String(purchase.rate) : '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [rateTouched, setRateTouched] = useState(false);

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

  const handleSelectSeller = value => {
    const seller = sellers.find(item => item.id === value);
    setForm(prev => {
      const next = { ...prev, sellerId: value };
      if (!rateTouched && next.animalType) {
        const autoRate = getMilkRateForType(seller, next.animalType);
        next.rate = autoRate != null ? String(autoRate) : '';
      }
      return next;
    });
    setErrors(prev => ({ ...prev, sellerId: undefined }));
  };

  const handleSelectAnimalType = value => {
    const seller = sellers.find(item => item.id === form.sellerId);
    setForm(prev => {
      const next = { ...prev, animalType: value };
      if (!rateTouched) {
        const autoRate = seller ? getMilkRateForType(seller, value) : null;
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
    if (
      !form.quantity.trim() ||
      Number.isNaN(quantityValue) ||
      quantityValue <= 0
    ) {
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
    if (!purchase || !validate()) {
      return;
    }

    const payload = {
      purchaseDate: toISODateString(form.purchaseDate),
      shift: form.shift,
      quantity: Number(form.quantity),
      rate: Number(form.rate),
      sellerId: form.sellerId,
      animalType: form.animalType,
    };

    try {
      setSubmitting(true);
      await patch(`/purchase/update/${purchase.id}`, payload);
      // Pop past the details screen, which still holds the old purchase.
      // Returning to the list triggers its focus reload with fresh data.
      Alert.alert('Success', 'Purchase updated successfully.', [
        { text: 'OK', onPress: () => navigation.pop(2) },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not update purchase',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!purchase) {
    return (
      <EmptyState
        icon="⚠️"
        title="Purchase not found"
        message="This purchase's details are no longer available."
      />
    );
  }

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
        title="No sellers found"
        message="A seller must be available before this purchase can be edited."
        actionLabel="Retry"
        onActionPress={loadSellers}
      />
    );
  }

  const sellerOptions = sellers.map(seller => ({
    label: seller.name,
    value: seller.id,
  }));

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
          label="Seller *"
          placeholder="Select seller"
          value={form.sellerId}
          options={sellerOptions}
          onSelect={handleSelectSeller}
          error={errors.sellerId}
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
          placeholder="E.g. 50"
          value={form.rate}
          onChangeText={handleChangeRate}
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
    color: colors.info,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});

export default EditPurchaseScreen;
