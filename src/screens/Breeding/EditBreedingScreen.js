/**
 * EditBreedingScreen
 *
 * Updates a breeding record's outcome using:
 *   PATCH /breeding/update/{id}
 *
 * The request body matches the backend's update DTO exactly:
 *   { status, actualCalvingDate, producedAnimal, notes }
 *
 * The mother animal, breeding date, method and expected calving date are
 * read-only here — the endpoint only accepts the outcome fields, so they are
 * shown as a summary card at the top of the form.
 *
 * The produced animal is always a CHILD animal, so the options come from
 *   GET /animal/getAll?status=CHILD
 * (with an explicit "None" option to clear the link).
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
import { get, patch } from '../../api/decentralizedWrapper';
import AppButton from '../../components/AppButton';
import AppDatePicker from '../../components/AppDatePicker';
import AppInput from '../../components/AppInput';
import AppSelect from '../../components/AppSelect';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import {
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from '../../constants/appConstants';
import {
  BREEDING_STATUS_OPTIONS,
  getBreedingMethodLabel,
  getBreedingStatusColor,
  getBreedingStatusLabel,
} from '../../constants/breedingEnums';
import { formatDateString, toISODateString } from '../../utils/date';
import { getAnimalIcon, getAnimalTypeLabel } from '../Animals/animalMeta';

// Backend dates are "yyyy-MM-dd". Parse the parts directly so the local Date
// passed to the picker stays on the same calendar day.
const parseDateString = dateString => {
  if (!dateString) {
    return null;
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const EditBreedingScreen = ({ navigation, route }) => {
  const breeding = route.params?.breeding;

  const [calves, setCalves] = useState([]);
  const [calvesLoading, setCalvesLoading] = useState(true);
  const [calvesError, setCalvesError] = useState(null);

  const [form, setForm] = useState({
    status: breeding?.status ?? null,
    actualCalvingDate: parseDateString(breeding?.actualCalvingDate),
    producedAnimal: breeding?.producedAnimal?.id ?? null,
    notes: breeding?.notes ?? '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadCalves = useCallback(async () => {
    try {
      setCalvesLoading(true);
      setCalvesError(null);
      const response = await get('/animal/getAll?status=CHILD');
      setCalves(Array.isArray(response) ? response : []);
    } catch (err) {
      setCalvesError(err);
    } finally {
      setCalvesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalves();
  }, [loadCalves]);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSelectStatus = value => {
    setField('status', value);
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.status) {
      nextErrors.status = 'Please select the breeding status.';
    }
    if (form.status === 'CALVED' && !form.actualCalvingDate) {
      nextErrors.actualCalvingDate =
        'Please enter the date the animal actually calved.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const payload = {
      status: form.status,
      actualCalvingDate: toISODateString(form.actualCalvingDate) || null,
      producedAnimal: form.producedAnimal ?? null,
      notes: form.notes.trim() || null,
    };

    try {
      setSubmitting(true);
      await patch(`/breeding/update/${breeding.id}`, payload);
      Alert.alert('Success', 'Breeding record updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not update breeding record',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const calfOptions = useMemo(
    () => [
      { label: 'None', value: null },
      ...calves.map(calf => ({
        label: `#${calf.id}${
          calf.name ? `  ${calf.name}` : ''
        } · ${getAnimalTypeLabel(calf.type)}`,
        value: calf.id,
      })),
    ],
    [calves],
  );

  if (!breeding) {
    return (
      <EmptyState
        icon="⚠️"
        title="Record not found"
        message="This breeding record could not be loaded."
      />
    );
  }

  const mother = breeding.animal || {};
  const statusColor = getBreedingStatusColor(breeding.status);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryAvatar}>
              <Text style={styles.summaryAvatarEmoji}>
                {getAnimalIcon(mother.type)}
              </Text>
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryName}>
                {mother.name || 'Animal'} #{mother.id}
              </Text>
              <Text style={styles.summaryMeta}>
                {getAnimalTypeLabel(mother.type)} ·{' '}
                {getBreedingMethodLabel(breeding.method)} method
              </Text>
            </View>
            <View
              style={[
                styles.summaryBadge,
                { backgroundColor: `${statusColor}1A` },
              ]}
            >
              <Text style={[styles.summaryBadgeText, { color: statusColor }]}>
                {getBreedingStatusLabel(breeding.status)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDates}>
            <View style={styles.summaryDateCell}>
              <Text style={styles.summaryDateLabel}>Breeding</Text>
              <Text style={styles.summaryDateValue}>
                {formatDateString(breeding.breedingDate) || '—'}
              </Text>
            </View>
            <View style={styles.summaryDateCell}>
              <Text style={styles.summaryDateLabel}>Expected calving</Text>
              <Text style={styles.summaryDateValue}>
                {formatDateString(breeding.expectedCalvingDate) || '—'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Update outcome</Text>

        <AppSelect
          label="Breeding Status *"
          placeholder="Select status"
          value={form.status}
          options={BREEDING_STATUS_OPTIONS}
          onSelect={handleSelectStatus}
          error={errors.status}
        />

        <AppDatePicker
          label="Actual Calving Date"
          placeholder="Not calved yet"
          value={form.actualCalvingDate}
          onChange={value => setField('actualCalvingDate', value)}
          error={errors.actualCalvingDate}
        />

        {calvesLoading ? (
          <View style={styles.inlineLoading}>
            <Text style={styles.inlineLoadingText}>
              Loading child animals...
            </Text>
          </View>
        ) : calvesError ? (
          <View style={styles.inlineError}>
            <Text style={styles.inlineErrorText}>
              {calvesError.message || 'Could not load child animals.'}
            </Text>
            <Text style={styles.inlineRetry} onPress={loadCalves}>
              Retry
            </Text>
          </View>
        ) : (
          <AppSelect
            label="Produced Animal (calf)"
            placeholder="None"
            value={form.producedAnimal}
            options={calfOptions}
            onSelect={value => setField('producedAnimal', value)}
          />
        )}

        <Text style={styles.hintText}>
          Only animals with the CHILD status are listed. Link the calf once it
          has been added in More → Animals.
        </Text>

        <AppInput
          label="Notes (optional)"
          placeholder="Calving complications, follow-up..."
          value={form.notes}
          onChangeText={value => setField('notes', value)}
          multiline
          numberOfLines={3}
          style={styles.notesInput}
        />

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

  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryAvatar: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  summaryAvatarEmoji: {
    fontSize: 21,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  summaryMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  summaryDates: {
    flexDirection: 'row',
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
  },
  summaryDateCell: {
    flex: 1,
  },
  summaryDateLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDateValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: 2,
  },

  sectionHeading: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  inlineLoading: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  inlineLoadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.danger,
  },
  inlineRetry: {
    fontSize: fontSize.xs,
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

export default EditBreedingScreen;
