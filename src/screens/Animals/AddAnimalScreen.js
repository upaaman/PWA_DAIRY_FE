/**
 * AddAnimalScreen
 *
 * Form to create a new animal. Submits to the real backend endpoint:
 *   POST /animal/create   (AnimalController.addAnimalController)
 * using the exact request shape of AnimalCreateReqDTO:
 *   { name, type, gender, breed, purchasePrice, status, dateOfBirth?, dateOfPurchase? }
 *
 * Required by the backend (validated client-side to match):
 *   name, type, gender, breed, status, purchasePrice (> 0)
 * Optional (backend allows null):
 *   dateOfBirth, dateOfPurchase
 *
 * Photo is NOT supported by the backend (Animal entity has no image
 * field) — it's kept as a visual-only placeholder and is never included
 * in the submitted payload.
 */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
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
};

const AddAnimalScreen = ({ navigation }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // Photo is UI-only for now — the backend doesn't support it yet, so this
  // is intentionally kept out of `form`/the request payload.
  const [photoPlaceholder, setPhotoPlaceholder] = useState(false);

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
    if (!form.purchasePrice.trim() || Number.isNaN(priceValue) || priceValue <= 0) {
      nextErrors.purchasePrice = 'Please enter a valid purchase price.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      gender: form.gender,
      breed: form.breed.trim(),
      status: form.status,
      purchasePrice: Number(form.purchasePrice),
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
        <View style={styles.photoSection}>
          <Pressable
            style={styles.photoCircle}
            onPress={() =>
              // Placeholder only — no backend field to store this yet.
              setPhotoPlaceholder(prev => !prev)
            }
          >
            <Text style={styles.photoIcon}>{photoPlaceholder ? '🐄' : '📷'}</Text>
          </Pressable>
          <Text style={styles.photoLabel}>Add Photo</Text>
          <Text style={styles.photoNote}>(Not saved yet — coming soon)</Text>
        </View>

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
          label="Purchase Price *"
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
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoCircle: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 32,
  },
  photoLabel: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  photoNote: {
    marginTop: spacing.xs / 2,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});

export default AddAnimalScreen;
