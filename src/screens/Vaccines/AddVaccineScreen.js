/**
 * AddVaccineScreen
 *
 * Form to record a vaccination for an animal. Submits to the real
 * backend endpoint:
 *   POST /vaccine/create   (VaccineController)
 * using the exact request shape:
 *   { vaccineName, vaccineDate, animalId, notes? }
 *
 * `notes` is optional — an empty value is sent as null, the same way the
 * expense form handles its optional notes field.
 *
 * The animal picker is populated from GET /animal/getAll.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { get, post } from '../../api/decentralizedWrapper';
import AppButton from '../../components/AppButton';
import AppDatePicker from '../../components/AppDatePicker';
import AppInput from '../../components/AppInput';
import AppSelect from '../../components/AppSelect';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import colors from '../../constants/colors';
import {
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from '../../constants/appConstants';
import { toISODateString } from '../../utils/date';
import {
  getAnimalIcon,
  getAnimalTypeLabel,
  getGenderLabel,
  getStatusLabel,
} from '../Animals/animalMeta';

const initialForm = {
  animalId: null,
  vaccineName: '',
  vaccineDate: new Date(),
  notes: '',
};

const AddVaccineScreen = ({ navigation }) => {
  const [animals, setAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadAnimals = useCallback(async () => {
    try {
      setAnimalsLoading(true);
      setAnimalsError(null);
      const response = await get('/animal/getAll');
      setAnimals(Array.isArray(response) ? response : []);
    } catch (err) {
      setAnimalsError(err);
    } finally {
      setAnimalsLoading(false);
    }
  }, []);

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
    if (!form.vaccineName.trim()) {
      nextErrors.vaccineName = 'Please enter the vaccine name.';
    }
    if (!form.vaccineDate) {
      nextErrors.vaccineDate = 'Please select the vaccination date.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      vaccineName: form.vaccineName.trim(),
      vaccineDate: toISODateString(form.vaccineDate),
      animalId: form.animalId,
      notes: form.notes.trim() || null,
    };

    try {
      setSubmitting(true);
      await post('/vaccine/create', payload);
      Alert.alert('Success', 'Vaccine recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not save vaccine',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const animalOptions = useMemo(
    () =>
      animals.map(animal => ({
        label: `#${animal.id}${
          animal.name ? `  ${animal.name}` : ''
        } · ${getAnimalTypeLabel(animal.type)}`,
        value: animal.id,
      })),
    [animals],
  );

  const selectedAnimal = useMemo(
    () => animals.find(animal => animal.id === form.animalId) || null,
    [animals, form.animalId],
  );

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
        icon="🐄"
        title="No animals available"
        message="Add an animal in the Animals tab before recording a vaccine."
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
        <View style={styles.introRow}>
          <View style={styles.introIconWrap}>
            <Text style={styles.introIcon}>💉</Text>
          </View>
          <View style={styles.introTextGroup}>
            <Text style={styles.introTitle}>New Vaccination</Text>
            <Text style={styles.introSubtitle}>
              Record which animal was vaccinated, the vaccine used and when.
            </Text>
          </View>
        </View>

        <AppSelect
          label="Animal *"
          placeholder="Select animal"
          value={form.animalId}
          options={animalOptions}
          onSelect={value => setField('animalId', value)}
          error={errors.animalId}
        />

        {selectedAnimal ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedAvatar}>
              <Text style={styles.selectedAvatarEmoji}>
                {getAnimalIcon(selectedAnimal.type)}
              </Text>
            </View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedName}>
                {selectedAnimal.name || 'Unnamed animal'}
              </Text>
              <Text style={styles.selectedMeta}>
                #{selectedAnimal.id} · {getAnimalTypeLabel(selectedAnimal.type)}{' '}
                · {getGenderLabel(selectedAnimal.gender)} ·{' '}
                {getStatusLabel(selectedAnimal.status)}
              </Text>
            </View>
            <Text style={styles.selectedCheck}>✓</Text>
          </View>
        ) : null}

        <AppInput
          label="Vaccine Name *"
          placeholder="E.g. FMD vaccine"
          value={form.vaccineName}
          onChangeText={value => setField('vaccineName', value)}
          error={errors.vaccineName}
        />

        <AppDatePicker
          label="Vaccination Date *"
          value={form.vaccineDate}
          onChange={value => setField('vaccineDate', value)}
          maximumDate={new Date()}
          error={errors.vaccineDate}
        />

        <AppInput
          label="Notes (optional)"
          placeholder="Batch number, dose, next due date, anything to remember..."
          value={form.notes}
          onChangeText={value => setField('notes', value)}
          multiline
          numberOfLines={4}
          style={styles.notesInput}
        />

        <AppButton
          title="Save Vaccine"
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
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  introIconWrap: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  introIcon: {
    fontSize: 22,
  },
  introTextGroup: {
    flex: 1,
  },
  introTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  introSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.green200,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  selectedAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  selectedAvatarEmoji: {
    fontSize: 20,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  selectedMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedCheck: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});

export default AddVaccineScreen;
