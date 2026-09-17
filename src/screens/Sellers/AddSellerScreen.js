/**
 * AddSellerScreen
 *
 * Form to create a new seller.
 *
 * Backend endpoint:
 *   POST /seller/create
 *
 * Request:
 *   {
 *     name,
 *     contact,
 *     address
 *   }
 */

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { post } from '../../api/decentralizedWrapper';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import colors from '../../constants/colors';
import {
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from '../../constants/appConstants';

const initialForm = {
  name: '',
  contact: '',
  address: '',
};

const AddSellerScreen = ({ navigation }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));

    setErrors(prev => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Please enter the seller name.';
    }

    if (!form.contact.trim()) {
      nextErrors.contact = 'Please enter the seller contact number.';
    } else if (!/^\d{10}$/.test(form.contact.trim())) {
      nextErrors.contact = 'Please enter a valid 10-digit contact number.';
    }

    if (!form.address.trim()) {
      nextErrors.address = 'Please enter the seller address.';
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
      contact: form.contact.trim(),
      address: form.address.trim(),
    };

    try {
      setSubmitting(true);

      await post('/seller/create', payload);

      Alert.alert(
        'Success',
        'Seller added successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (err) {
      Alert.alert(
        'Could not add seller',
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
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>👨‍🌾</Text>
          </View>

          <Text style={styles.title}>Add Seller</Text>

          <Text style={styles.subtitle}>
            Add a milk seller to your dairy records.
          </Text>
        </View>

        <AppInput
          label="Seller Name *"
          placeholder="E.g. Pawan Seller"
          value={form.name}
          onChangeText={value => setField('name', value)}
          error={errors.name}
        />

        <AppInput
          label="Contact Number *"
          placeholder="E.g. 9898989898"
          value={form.contact}
          onChangeText={value => setField('contact', value)}
          keyboardType="phone-pad"
          maxLength={10}
          error={errors.contact}
        />

        <AppInput
          label="Address *"
          placeholder="E.g. Bakhar, 487551, Khurshipar"
          value={form.address}
          onChangeText={value => setField('address', value)}
          multiline
          numberOfLines={3}
          error={errors.address}
        />

        <AppButton
          title="Save Seller"
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

  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  icon: {
    fontSize: 32,
  },

  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },

  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  saveButton: {
    marginTop: spacing.md,
  },
});

export default AddSellerScreen;