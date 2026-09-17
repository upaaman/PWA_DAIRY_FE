/**
 * CustomerDetailsScreen
 *
 * Read-only profile view for one customer: name, contact, address and the
 * configured milk rates. From here the customer can be edited
 * (EditCustomerScreen) or opened in the billing screen for sales.
 *
 * The backend exposes GET /customer/getAll (no documented get-by-id), so
 * the customer is looked up from that list and re-fetched on focus so
 * edits made on EditCustomerScreen are reflected immediately.
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
import { CUSTOMER_ROUTES } from '../../navigation/routes';
import DetailRow from '../Animals/DetailRow';

const CustomerDetailsScreen = ({ navigation, route }) => {
  const { customerId } = route.params || {};

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get('/customer/getAll');
      const list = Array.isArray(response) ? response : [];
      const match = list.find(item => item.id === customerId);
      if (!match) {
        throw new Error('This customer could not be found.');
      }
      setCustomer(match);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      loadCustomer();
    }, [loadCustomer]),
  );

  if (loading) {
    return <Loading message="Loading customer..." />;
  }

  if (error || !customer) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load customer"
        message={error?.message || 'This customer could not be found.'}
        actionLabel="Retry"
        onActionPress={loadCustomer}
      />
    );
  }

  const buffaloRate = customer.milkRates?.buffaloMilkRate;
  const cowRate = customer.milkRates?.cowMilkRate;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>🧑‍🤝‍🧑</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{customer.name}</Text>
            <Text style={styles.profileMeta}>Customer #{customer.id}</Text>
          </View>
        </View>
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <DetailRow label="Phone" value={customer.contact} />
        <DetailRow label="Address" value={customer.address} />
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
          navigation.navigate(CUSTOMER_ROUTES.EDIT, {
            customerId: customer.id,
            customer,
          })
        }
        style={styles.actionButton}
      />

      <AppButton
        title="View Sales & Billing"
        variant="secondary"
        onPress={() =>
          navigation.navigate(CUSTOMER_ROUTES.BILLING, {
            customerId: customer.id,
          })
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

export default CustomerDetailsScreen;
