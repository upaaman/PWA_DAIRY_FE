/**
 * AddEmployeeScreen
 *
 * Form to create a new employee.
 *
 * Backend endpoint:
 *   POST /employee/create
 *   {
 *     name,
 *     status,           // boolean: true = Active, false = Inactive
 *     contact,
 *     address,
 *     dateOfJoining,    // "yyyy-MM-dd"
 *     notes             // mandatory
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
import AppSelect from '../../components/AppSelect';
import AppDatePicker from '../../components/AppDatePicker';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { EMPLOYEE_STATUS_OPTIONS } from '../../constants/employeeEnums';
import { toISODateString } from '../../utils/date';

const initialForm = {
  name: '',
  status: true,
  contact: '',
  address: '',
  dateOfJoining: new Date(),
  notes: '',
};

const AddEmployeeScreen = ({ navigation }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Please enter the employee name.';
    }
    if (!form.contact.trim()) {
      nextErrors.contact = 'Please enter the contact number.';
    } else if (!/^\d{8,10}$/.test(form.contact.trim())) {
      nextErrors.contact = 'Please enter a valid contact number.';
    }
    if (!form.address.trim()) {
      nextErrors.address = 'Please enter the employee address.';
    }
    if (!form.dateOfJoining) {
      nextErrors.dateOfJoining = 'Please select a date of joining.';
    }
    if (!form.notes.trim()) {
      nextErrors.notes = 'Please enter a note for this employee.';
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
      status: form.status,
      contact: form.contact.trim(),
      address: form.address.trim(),
      dateOfJoining: toISODateString(form.dateOfJoining),
      notes: form.notes.trim(),
    };

    try {
      setSubmitting(true);
      await post('/employee/create', payload);
      Alert.alert('Success', 'Employee added successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not add employee',
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
            <Text style={styles.icon}>👷</Text>
          </View>
          <Text style={styles.title}>Add Employee</Text>
          <Text style={styles.subtitle}>
            Register a new employee to your dairy records.
          </Text>
        </View>

        <AppInput
          label="Employee Name *"
          placeholder="E.g. Ramesh Yadav"
          value={form.name}
          onChangeText={value => setField('name', value)}
          error={errors.name}
        />

        <AppSelect
          label="Status *"
          placeholder="Select status"
          value={form.status}
          options={EMPLOYEE_STATUS_OPTIONS}
          onSelect={value => setField('status', value)}
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

        <AppDatePicker
          label="Date of Joining *"
          value={form.dateOfJoining}
          onChange={value => setField('dateOfJoining', value)}
          maximumDate={new Date()}
          error={errors.dateOfJoining}
        />

        <AppInput
          label="Notes *"
          placeholder="E.g. Notes about the employee"
          value={form.notes}
          onChangeText={value => setField('notes', value)}
          multiline
          numberOfLines={3}
          error={errors.notes}
        />

        <AppButton
          title="Save Employee"
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

export default AddEmployeeScreen;