/**
 * SellerDetailsScreen
 *
 * Read-only profile view for one seller: name, contact, address and the
 * configured milk rates. From here the seller can be edited
 * (EditSellerScreen) or opened in the billing screen for purchases.
 *
 * The backend exposes GET /seller/getAll (no documented get-by-id), so
 * the seller is looked up from that list and re-fetched on focus so edits
 * made on EditSellerScreen are reflected immediately.
 */
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get } from '../../api/decentralizedWrapper';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { formatCurrency } from '../../utils/format';
import { SELLER_ROUTES } from '../../navigation/routes';
import DetailRow from '../Animals/DetailRow';

const SellerDetailsScreen = ({ navigation, route }) => {
  const { sellerId } = route.params || {};

  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSeller = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get('/seller/getAll');
      const list = Array.isArray(response) ? response : [];
      const match = list.find(item => item.id === sellerId);
      if (!match) {
        throw new Error('This seller could not be found.');
      }
      setSeller(match);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useFocusEffect(
    useCallback(() => {
      loadSeller();
    }, [loadSeller]),
  );

  if (loading) {
    return <Loading message="Loading seller..." />;
  }

  if (error || !seller) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load seller"
        message={error?.message || 'This seller could not be found.'}
        actionLabel="Retry"
        onActionPress={loadSeller}
      />
    );
  }

  const buffaloRate = seller.milkRates?.buffaloMilkRate;
  const cowRate = seller.milkRates?.cowMilkRate;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👨‍🌾</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{seller.name}</Text>
            <Text style={styles.profileMeta}>Seller #{seller.id}</Text>
          </View>
        </View>
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <DetailRow label="Phone" value={seller.contact} />
        <DetailRow label="Address" value={seller.address} />
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Milk Rates</Text>
        <DetailRow
          label="Buffalo"
          value={buffaloRate != null ? `${formatCurrency(buffaloRate)}/L` : '—'}
        />
        <DetailRow
          label="Cow"
          value={cowRate != null ? `${formatCurrency(cowRate)}/L` : '—'}
        />
      </AppCard>

      <AppButton
        title="Edit Details"
        onPress={() =>
          navigation.navigate(SELLER_ROUTES.EDIT, {
            sellerId: seller.id,
            seller,
          })
        }
        style={styles.actionButton}
      />

      <AppButton
        title="View Purchases & Billing"
        variant="secondary"
        onPress={() =>
          navigation.navigate(SELLER_ROUTES.BILLING, { sellerId: seller.id })
        }
        style={styles.actionButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  profileMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
});

export default SellerDetailsScreen;
