/**
 * AddCustomerScreen
 *
 * Form to create a new customer.
 *
 * Backend endpoint:
 *   POST /customer/create
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
  buffaloMilkRate: '',
  cowMilkRate: '',
};

const AddCustomerScreen = ({ navigation }) => {
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
      nextErrors.name = 'Please enter the customer name.';
    }

    if (!form.contact.trim()) {
      nextErrors.contact = 'Please enter the customer contact number.';
    } else if (!/^\d{8,10}$/.test(form.contact.trim())) {
      nextErrors.contact =
        'Please enter a valid contact number.';
    }

    if (!form.address.trim()) {
      nextErrors.address = 'Please enter the customer address.';
    }

    ['buffaloMilkRate', 'cowMilkRate'].forEach(field => {
      if (form[field].trim()) {
        const rateValue = Number(form[field]);
        if (Number.isNaN(rateValue) || rateValue <= 0) {
          nextErrors[field] = 'Please enter a valid positive rate.';
        }
      }
    });

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

    const milkRates = {};
    if (form.buffaloMilkRate.trim()) {
      milkRates.buffaloMilkRate = Number(form.buffaloMilkRate.trim());
    }
    if (form.cowMilkRate.trim()) {
      milkRates.cowMilkRate = Number(form.cowMilkRate.trim());
    }
    if (Object.keys(milkRates).length > 0) {
      payload.milkRates = milkRates;
    }

    try {
      setSubmitting(true);

      await post('/customer/create', payload);

      Alert.alert(
        'Success',
        'Customer added successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (err) {
      Alert.alert(
        'Could not add customer',
        err.message ||
          'Something went wrong. Please try again.',
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
            <Text style={styles.icon}>👤</Text>
          </View>

          <Text style={styles.title}>Add Customer</Text>

          <Text style={styles.subtitle}>
            Add a milk customer to your dairy records.
          </Text>
        </View>

        <AppInput
          label="Customer Name *"
          placeholder="E.g. Amul Customer"
          value={form.name}
          onChangeText={value => setField('name', value)}
          error={errors.name}
        />

        <AppInput
          label="Contact Number *"
          placeholder="E.g. 23123234"
          value={form.contact}
          onChangeText={value => setField('contact', value)}
          keyboardType="phone-pad"
          maxLength={10}
          error={errors.contact}
        />

        <AppInput
          label="Address *"
          placeholder="E.g. Near Sakar Nadi Pull, 487551, Gadarwara"
          value={form.address}
          onChangeText={value => setField('address', value)}
          multiline
          numberOfLines={3}
          error={errors.address}
        />

        <AppInput
          label="Buffalo Milk Rate (₹/L)"
          placeholder="E.g. 55"
          value={form.buffaloMilkRate}
          onChangeText={value => setField('buffaloMilkRate', value)}
          keyboardType="decimal-pad"
          error={errors.buffaloMilkRate}
        />

        <AppInput
          label="Cow Milk Rate (₹/L)"
          placeholder="E.g. 50"
          value={form.cowMilkRate}
          onChangeText={value => setField('cowMilkRate', value)}
          keyboardType="decimal-pad"
          error={errors.cowMilkRate}
        />

        <AppButton
          title="Save Customer"
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

export default AddCustomerScreen;