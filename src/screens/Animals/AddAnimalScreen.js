/**
 * AddAnimalScreen
 *
 * Form to create a new animal. Submits to the real backend endpoint:
 *   POST /animal/create   (AnimalController.addAnimalController)
 * using the exact request shape of AnimalCreateReqDTO:
 *   { name, type, gender, breed, purchasePrice, status, dateOfBirth?, dateOfPurchase? }
 *
 * Required by the backend (validated client-side to match):
 *   name, type, gender, breed, status
 * Optional (backend allows null):
 *   purchasePrice (positive when provided), dateOfBirth, dateOfPurchase
 *
 * Optional photo uploads to POST /upload; its URL is saved as imageUrl.
 */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { post } from '../../api/decentralizedWrapper';
import AnimalPhotoPicker from '../../components/AnimalPhotoPicker';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AppSelect from '../../components/AppSelect';
import AppDatePicker from '../../components/AppDatePicker';
import colors from '../../constants/colors';
import { spacing } from '../../constants/appConstants';
import { toISODateString } from '../../utils/date';
import { GENDER_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS } from './animalMeta';

const initialForm = {
  name: '',
  type: null,
  gender: null,
  breed: '',
  purchasePrice: '',
  status: null,
  dateOfBirth: null,
  dateOfPurchase: null,
  imageUrl: null,
};

const AddAnimalScreen = ({ navigation }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Please enter the animal name.';
    }
    if (!form.type) {
      nextErrors.type = 'Please select either cow or buffalo.';
    }
    if (!form.gender) {
      nextErrors.gender = 'Please select the animal gender.';
    }
    if (!form.breed.trim()) {
      nextErrors.breed = 'Please enter the animal breed.';
    }
    if (!form.status) {
      nextErrors.status = 'Please select the animal current status.';
    }

    const priceValue = Number(form.purchasePrice);
    if (form.purchasePrice.trim() && (!Number.isFinite(priceValue) || priceValue <= 0)) {
      nextErrors.purchasePrice = 'Please enter a valid purchase price.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (photoBusy || submitting || !validate()) {
      return;
    }

    const payload = {
      imageUrl: form.imageUrl,
      name: form.name.trim(),
      type: form.type,
      gender: form.gender,
      breed: form.breed.trim(),
      status: form.status,
      purchasePrice: form.purchasePrice.trim() ? Number(form.purchasePrice) : null,
      dateOfBirth: toISODateString(form.dateOfBirth),
      dateOfPurchase: toISODateString(form.dateOfPurchase),
    };

    try {
      setSubmitting(true);
      await post('/animal/create', payload);
      // The Animal List screen re-fetches on focus (see its useFocusEffect),
      // so simply navigating back is enough to show the new animal.
      Alert.alert('Success', 'Animal added successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not add animal',
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
        <AnimalPhotoPicker imageUrl={form.imageUrl} type={form.type}
          onChange={url => setField('imageUrl', url)} onBusyChange={setPhotoBusy}
          disabled={submitting} />

        <AppInput
          label="Name *"
          placeholder="E.g. Lakshmi"
          value={form.name}
          onChangeText={value => setField('name', value)}
          error={errors.name}
        />

        <AppSelect
          label="Animal Type *"
          placeholder="Select type"
          value={form.type}
          options={TYPE_OPTIONS}
          onSelect={value => setField('type', value)}
          error={errors.type}
        />

        <AppSelect
          label="Gender *"
          placeholder="Select gender"
          value={form.gender}
          options={GENDER_OPTIONS}
          onSelect={value => setField('gender', value)}
          error={errors.gender}
        />

        <AppInput
          label="Breed *"
          placeholder="E.g. Holstein"
          value={form.breed}
          onChangeText={value => setField('breed', value)}
          error={errors.breed}
        />

        <AppSelect
          label="Status *"
          placeholder="Select status"
          value={form.status}
          options={STATUS_OPTIONS}
          onSelect={value => setField('status', value)}
          error={errors.status}
        />

        <AppDatePicker
          label="Date of Birth"
          placeholder="Select date"
          value={form.dateOfBirth}
          onChange={value => setField('dateOfBirth', value)}
          maximumDate={new Date()}
        />

        <AppDatePicker
          label="Purchase Date"
          placeholder="Select date"
          value={form.dateOfPurchase}
          onChange={value => setField('dateOfPurchase', value)}
          maximumDate={new Date()}
        />

        <AppInput
          label="Purchase Price (optional)"
          placeholder="E.g. 45000"
          value={form.purchasePrice}
          onChangeText={value => setField('purchasePrice', value)}
          keyboardType="numeric"
          error={errors.purchasePrice}
        />

        <AppButton
          title="Save"
          onPress={handleSave}
          loading={submitting}
          disabled={photoBusy}
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
    paddingBottom: 112,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});

export default AddAnimalScreen;
