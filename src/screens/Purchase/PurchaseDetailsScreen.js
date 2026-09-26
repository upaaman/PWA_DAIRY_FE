/**
 * PurchaseDetailsScreen
 *
 * Shows the full details of one milk purchase. Since the backend does not
 * expose a get-by-id endpoint, the purchase selected in the list is passed
 * through navigation params.
 *
 * "Edit" navigates to EditPurchaseScreen, which persists changes with
 * PATCH /purchase/update/{id}.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { getShiftLabel } from '../../constants/enums';
import { formatDateString } from '../../utils/date';
import { formatCurrency, formatLiters } from '../../utils/format';
import { PURCHASE_ROUTES } from '../../navigation/routes';
import { getAnimalTypeLabel } from '../Animals/animalMeta';
import DetailRow from '../Animals/DetailRow';

const PurchaseDetailsScreen = ({ navigation, route }) => {
  const { purchase } = route.params || {};

  if (!purchase) {
    return (
      <EmptyState
        icon="⚠️"
        title="Purchase not found"
        message="This purchase's details are no longer available."
      />
    );
  }

  const seller = purchase.seller || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.amountBanner}>
        <Text style={styles.amountLabel}>Purchase Amount</Text>
        <Text style={styles.amountValue}>
          {formatCurrency(purchase.amount) || '—'}
        </Text>
      </View>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Purchase Details</Text>
        <DetailRow
          label="Purchase ID"
          value={purchase.id ? `#${purchase.id}` : null}
        />
        <DetailRow
          label="Purchase Date"
          value={formatDateString(purchase.purchaseDate)}
        />
        <DetailRow label="Quantity" value={formatLiters(purchase.quantity)} />
        <DetailRow label="Rate" value={formatCurrency(purchase.rate)} />
        <DetailRow label="Shift" value={getShiftLabel(purchase.shift)} />
        <DetailRow
          label="Animal Type"
          value={getAnimalTypeLabel(purchase.animalType)}
        />
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Seller</Text>
        <DetailRow label="Name" value={seller.name} />
        <DetailRow label="Contact" value={seller.contact} />
        <DetailRow label="Address" value={seller.address} />
      </AppCard>

      <AppButton
        title="Edit Purchase"
        onPress={() => navigation.navigate(PURCHASE_ROUTES.EDIT, { purchase })}
        style={styles.editButton}
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
  amountBanner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  amountLabel: {
    fontSize: fontSize.sm,
    color: colors.primaryLight,
  },
  amountValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.xs,
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
  editButton: {
    marginTop: spacing.sm,
  },
});

export default PurchaseDetailsScreen;
