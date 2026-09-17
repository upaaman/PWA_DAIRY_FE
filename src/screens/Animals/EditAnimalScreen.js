/**
 * EditAnimalScreen
 *
 * Edit the editable fields of an existing animal (name, status, notes)
 * and persist only the fields the user actually changed as a delta:
 *
 *   PATCH /animal/update/{id}
 *   { "name": "hello", "status": "CHILD" }   <- only the fields that differ
 *
 * Unchanged fields are intentionally NOT included in the payload, matching
 * the backend's partial-update PATCH behavior.
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
import AppInput from '../../components/AppInput';
import AppSelect from '../../components/AppSelect';
import AppCard from '../../components/AppCard';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { getAnimalIcon } from './animalMeta';
import { STATUS_OPTIONS } from './animalMeta';

const EditAnimalScreen = ({ navigation, route }) => {
  const { animalId, animal: initialAnimal } = route.params || {};

  const [animal, setAnimal] = useState(initialAnimal || null);
  const [loading, setLoading] = useState(!initialAnimal);
  const [loadingError, setLoadingError] = useState(null);

  const [form, setForm] = useState({
    name: initialAnimal?.name || '',
    status: initialAnimal?.status || null,
    notes: initialAnimal?.notes || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // If the details screen didn't pass the animal object along, fetch it.
  const loadAnimal = useCallback(async () => {
    if (!animalId) {
      return;
    }
    try {
      setLoading(true);
      setLoadingError(null);
      const response = await get(`/animal/get/${animalId}`);
      setAnimal(response);
      setForm({
        name: response.name || '',
        status: response.status || null,
        notes: response.notes || '',
      });
    } catch (err) {
      setLoadingError(err);
    } finally {
      setLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    if (!initialAnimal) {
      loadAnimal();
    }
  }, [initialAnimal, loadAnimal]);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Please enter the animal name.';
    }
    if (!form.status) {
      nextErrors.status = 'Please select the animal current status.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    // Delta payload: only include the fields that changed, so untouched
    // values are never sent to the backend (e.g. editing just the status
    // sends only { status }).
    const delta = {};
    const name = form.name.trim();
    if (name !== String(animal?.name || '').trim()) {
      delta.name = name;
    }
    const notes = form.notes || '';
    if (notes !== (animal?.notes || '')) {
      delta.notes = notes;
    }
    if (form.status !== (animal?.status || null)) {
      delta.status = form.status;
    }

    if (Object.keys(delta).length === 0) {
      Alert.alert('No changes', 'Nothing was changed, so nothing to save.');
      return;
    }

    try {
      setSaving(true);
      await patch(`/animal/update/${animalId}`, delta);
      // Details & List screens re-fetch on focus, so going back shows the
      // updated values immediately.
      Alert.alert('Success', 'Animal updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not update animal',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading message="Loading animal..." />;
  }

  if (loadingError || !animal) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load animal"
        message={loadingError?.message || 'This animal could not be found.'}
        actionLabel="Retry"
        onActionPress={loadAnimal}
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
        <AppCard style={styles.identityCard}>
          <View style={styles.identityRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarIcon}>{getAnimalIcon(animal.type)}</Text>
            </View>
            <View style={styles.identityText}>
              <Text style={styles.identityName}>{animal.name}</Text>
              <Text style={styles.identityMeta}>
                #{animal.id} · {animal.breed || '—'}
              </Text>
            </View>
          </View>
        </AppCard>

        <AppInput
          label="Name *"
          placeholder="E.g. Lakshmi"
          value={form.name}
          onChangeText={value => setField('name', value)}
          error={errors.name}
        />

        <AppSelect
          label="Status *"
          placeholder="Select status"
          value={form.status}
          options={STATUS_OPTIONS}
          onSelect={value => setField('status', value)}
          error={errors.status}
        />

        <AppInput
          label="Notes"
          placeholder="Any extra notes about this animal"
          value={form.notes}
          onChangeText={value => setField('notes', value)}
          multiline
          numberOfLines={4}
          style={styles.notesInput}
        />

        <Text style={styles.hintText}>
          Only changed fields are saved — untouched values are kept as they are.
        </Text>

        <AppButton
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
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
  identityCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarIcon: {
    fontSize: 26,
  },
  identityText: {
    flex: 1,
  },
  identityName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  identityMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  hintText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  saveButton: {
    marginTop: spacing.xs,
  },
});

export default EditAnimalScreen;