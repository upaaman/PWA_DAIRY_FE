/**
 * AddBreedingScreen
 *
 * Records a new breeding entry. Submits to the real backend endpoint:
 *   POST /breeding/create
 * using the exact request shape:
 *   { breedingDate, expectedCalvingDate, method, animal, notes? }
 *
 * Note: the mother animal is sent as `animal` (not `animalId`) — that is
 * what the backend's create DTO expects. Only female animals are offered,
 * since GET /animal/getAll has no server-side gender filter.
 *
 * When a breeding date is picked, the expected calving date is auto-filled
 * at ~270 days (about 9 months for cattle) until the user overrides it.
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
import { BREEDING_METHOD_OPTIONS } from '../../constants/breedingEnums';
import { toISODateString } from '../../utils/date';
import {
  getAnimalIcon,
  getAnimalTypeLabel,
  getStatusLabel,
} from '../Animals/animalMeta';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const GESTATION_DAYS = 270;

const initialForm = {
  animal: null,
  method: null,
  breedingDate: new Date(),
  expectedCalvingDate: new Date(Date.now() + GESTATION_DAYS * DAY_IN_MS),
  notes: '',
};

const AddBreedingScreen = ({ navigation }) => {
  const [animals, setAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // Once the user picks the expected calving date themselves, stop
  // auto-filling it when the breeding date changes.
  const [expectedTouched, setExpectedTouched] = useState(false);

  const loadAnimals = useCallback(async () => {
    try {
      setAnimalsLoading(true);
      setAnimalsError(null);
      const response = await get('/animal/getAll');
      const list = Array.isArray(response) ? response : [];
      // Only female animals can be bred.
      setAnimals(list.filter(animal => animal.gender === 'FEMALE'));
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

  const handleBreedingDateChange = value => {
    setForm(prev => {
      const next = { ...prev, breedingDate: value };
      if (!expectedTouched) {
        next.expectedCalvingDate = new Date(
          value.getTime() + GESTATION_DAYS * DAY_IN_MS,
        );
      }
      return next;
    });
    setErrors(prev => ({
      ...prev,
      breedingDate: undefined,
      expectedCalvingDate: undefined,
    }));
  };

  const handleExpectedDateChange = value => {
    setExpectedTouched(true);
    setForm(prev => ({ ...prev, expectedCalvingDate: value }));
    setErrors(prev => ({ ...prev, expectedCalvingDate: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.animal) {
      nextErrors.animal = 'Please select the animal to be bred.';
    }
    if (!form.method) {
      nextErrors.method = 'Please select a breeding method.';
    }
    if (!form.breedingDate) {
      nextErrors.breedingDate = 'Please select the breeding date.';
    }
    if (!form.expectedCalvingDate) {
      nextErrors.expectedCalvingDate =
        'Please select the expected calving date.';
    } else if (
      form.breedingDate &&
      form.expectedCalvingDate < form.breedingDate
    ) {
      nextErrors.expectedCalvingDate =
        'Expected calving date cannot be before the breeding date.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      breedingDate: toISODateString(form.breedingDate),
      expectedCalvingDate: toISODateString(form.expectedCalvingDate),
      method: form.method,
      animal: form.animal,
      notes: form.notes.trim() || null,
    };

    try {
      setSubmitting(true);
      await post('/breeding/create', payload);
      Alert.alert('Success', 'Breeding record added successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not save breeding record',
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
    () => animals.find(animal => animal.id === form.animal) || null,
    [animals, form.animal],
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
        title="No female animals available"
        message="Add a female animal in the Animals tab before recording a breeding."
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
            <Text style={styles.introIcon}>🤰</Text>
          </View>
          <View style={styles.introTextGroup}>
            <Text style={styles.introTitle}>New Breeding</Text>
            <Text style={styles.introSubtitle}>
              Record the mating and when the calf is expected.
            </Text>
          </View>
        </View>

        <AppSelect
          label="Animal *"
          placeholder="Select female animal"
          value={form.animal}
          options={animalOptions}
          onSelect={value => setField('animal', value)}
          error={errors.animal}
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
                · {getStatusLabel(selectedAnimal.status)}
              </Text>
            </View>
            <Text style={styles.selectedCheck}>✓</Text>
          </View>
        ) : null}

        <AppSelect
          label="Breeding Method *"
          placeholder="Select method"
          value={form.method}
          options={BREEDING_METHOD_OPTIONS}
          onSelect={value => setField('method', value)}
          error={errors.method}
        />

        <AppDatePicker
          label="Breeding Date *"
          value={form.breedingDate}
          onChange={handleBreedingDateChange}
          maximumDate={new Date()}
          error={errors.breedingDate}
        />

        <AppDatePicker
          label="Expected Calving Date *"
          value={form.expectedCalvingDate}
          onChange={handleExpectedDateChange}
          error={errors.expectedCalvingDate}
        />

        <Text style={styles.hintText}>
          Auto-filled at ~9 months (270 days) from the breeding date — tap to
          change it.
        </Text>

        <AppInput
          label="Notes (optional)"
          placeholder="Bull / semen details, remarks..."
          value={form.notes}
          onChangeText={value => setField('notes', value)}
          multiline
          numberOfLines={3}
          style={styles.notesInput}
        />

        <AppButton
          title="Save Breeding"
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
  hintText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});

export default AddBreedingScreen;
