/**
 * EditSellerScreen
 *
 * Edit the details of an existing seller and persist only the fields the
 * user actually changed as a delta:
 *
 *   PATCH /seller/update/{id}
 *   {
 *     "name": "...",                       <- only changed fields
 *     "contact": "...",
 *     "address": "...",
 *     "milkRates": { "cowMilkRate": 11, "buffaloMilkRate": 101 }
 *   }
 *
 * Unchanged fields are intentionally omitted, matching the backend's
 * partial-update PATCH behavior. When any milk rate changes the whole
 * `milkRates` object is sent (cleared rates become null) so the backend
 * replaces it consistently.
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
import AppCard from '../../components/AppCard';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';

const toRateString = value => (value != null ? String(value) : '');
const toRateNumber = value => {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
};

const EditSellerScreen = ({ navigation, route }) => {
  const { sellerId, seller: initialSeller } = route.params || {};

  const [seller, setSeller] = useState(initialSeller || null);
  const [loading, setLoading] = useState(!initialSeller);
  const [loadingError, setLoadingError] = useState(null);

  const [form, setForm] = useState({
    name: initialSeller?.name || '',
    contact: initialSeller?.contact || '',
    address: initialSeller?.address || '',
    buffaloMilkRate: toRateString(initialSeller?.milkRates?.buffaloMilkRate),
    cowMilkRate: toRateString(initialSeller?.milkRates?.cowMilkRate),
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const applySeller = useCallback(response => {
    setSeller(response);
    setForm({
      name: response.name || '',
      contact: response.contact || '',
      address: response.address || '',
      buffaloMilkRate: toRateString(response.milkRates?.buffaloMilkRate),
      cowMilkRate: toRateString(response.milkRates?.cowMilkRate),
    });
  }, []);

  // If the details screen didn't pass the seller object along, fetch it.
  const loadSeller = useCallback(async () => {
    if (!sellerId) {
      return;
    }
    try {
      setLoading(true);
      setLoadingError(null);
      const response = await get('/seller/getAll');
      const list = Array.isArray(response) ? response : [];
      const match = list.find(item => item.id === sellerId);
      if (!match) {
        throw new Error('This seller could not be found.');
      }
      applySeller(match);
    } catch (err) {
      setLoadingError(err);
    } finally {
      setLoading(false);
    }
  }, [sellerId, applySeller]);

  useEffect(() => {
    if (!initialSeller) {
      loadSeller();
    }
  }, [initialSeller, loadSeller]);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
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

    // Delta payload: only include the fields that changed.
    const delta = {};
    const name = form.name.trim();
    if (name !== String(seller?.name || '').trim()) {
      delta.name = name;
    }
    const contact = form.contact.trim();
    if (contact !== String(seller?.contact || '').trim()) {
      delta.contact = contact;
    }
    const address = form.address.trim();
    if (address !== String(seller?.address || '').trim()) {
      delta.address = address;
    }

    const originalBuffalo = seller?.milkRates?.buffaloMilkRate ?? null;
    const originalCow = seller?.milkRates?.cowMilkRate ?? null;
    const nextBuffalo = toRateNumber(form.buffaloMilkRate);
    const nextCow = toRateNumber(form.cowMilkRate);
    if (nextBuffalo !== originalBuffalo || nextCow !== originalCow) {
      delta.milkRates = {
        buffaloMilkRate: nextBuffalo,
        cowMilkRate: nextCow,
      };
    }

    if (Object.keys(delta).length === 0) {
      Alert.alert('No changes', 'Nothing was changed, so nothing to save.');
      return;
    }

    try {
      setSaving(true);
      await patch(`/seller/update/${sellerId}`, delta);
      Alert.alert('Success', 'Seller updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not update seller',
        err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading message="Loading seller..." />;
  }

  if (loadingError || !seller) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load seller"
        message={loadingError?.message || 'This seller could not be found.'}
        actionLabel="Retry"
        onActionPress={loadSeller}
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
              <Text style={styles.avatarIcon}>👨‍🌾</Text>
            </View>
            <View style={styles.identityText}>
              <Text style={styles.identityName}>{seller.name}</Text>
              <Text style={styles.identityMeta}>Seller #{seller.id}</Text>
            </View>
          </View>
        </AppCard>

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

export default EditSellerScreen;
