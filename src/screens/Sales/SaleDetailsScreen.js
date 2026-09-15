/**
 * SaleDetailsScreen
 *
 * Shows the full details of a single sale. The backend has no
 * get-by-id endpoint for MilkSale (MilkSaleController only has
 * create/getAll), so this screen simply displays the sale object that
 * was already fetched by the list screen — passed via navigation
 * params — instead of inventing a details endpoint.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../../components/AppCard';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { formatDateString } from '../../utils/date';
import { formatCurrency, formatLiters } from '../../utils/format';
import { getShiftLabel } from '../../constants/enums';
import { getAnimalTypeLabel } from '../Animals/animalMeta';
import DetailRow from '../Animals/DetailRow';

const SaleDetailsScreen = ({ route }) => {
  const { sale } = route.params || {};

  if (!sale) {
    return (
      <EmptyState
        icon="⚠️"
        title="Sale not found"
        message="This sale's details are no longer available."
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.amountBanner}>
        <Text style={styles.amountLabel}>Amount</Text>
        <Text style={styles.amountValue}>{formatCurrency(sale.amount) || '—'}</Text>
      </View>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Sale Details</Text>
        <DetailRow label="Date" value={formatDateString(sale.saleDate)} />
        <DetailRow label="Quantity" value={formatLiters(sale.quantity)} />
        <DetailRow label="Rate" value={formatCurrency(sale.rate)} />
        <DetailRow label="Shift" value={getShiftLabel(sale.shift)} />
        <DetailRow label="Animal Type" value={getAnimalTypeLabel(sale.animalType)} />
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Buyer</Text>
        <DetailRow label="Name" value={sale.customer?.name} />
        <DetailRow label="Contact" value={sale.customer?.contact} />
        <DetailRow label="Address" value={sale.customer?.address} />
      </AppCard>
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
});

export default SaleDetailsScreen;
