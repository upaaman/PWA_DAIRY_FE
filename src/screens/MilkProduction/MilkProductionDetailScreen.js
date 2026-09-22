/**
 * MilkProductionDetailScreen
 *
 * View page for a single milk production record. The record is passed
 * straight from the list (the backend has no get-by-id endpoint for
 * production records) and includes the embedded animal.
 *
 * "Edit" navigates to EditMilkProductionScreen, which persists changes
 * via PATCH /milkProduction/update/{id}.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { formatDateString } from '../../utils/date';
import { formatLiters } from '../../utils/format';
import { PRODUCTION_ROUTES } from '../../navigation/routes';
import { getShiftLabel } from '../../constants/enums';
import { getAnimalIcon, getAnimalTypeLabel } from '../Animals/animalMeta';

const MilkProductionDetailScreen = ({ navigation, route }) => {
  const record = route.params?.record;
  const animal = record?.animal || {};

  if (!record) {
    return (
      <View style={styles.container}>
        <Text style={styles.missing}>This production record is unavailable.</Text>
      </View>
    );
  }

  const typeLabel = getAnimalTypeLabel(animal.type);
  const shiftLabel = getShiftLabel(record.productionShift);
  const dateLabel = formatDateString(record.productionDate) || '—';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>{getAnimalIcon(animal.type)}</Text>
        </View>
        <Text style={styles.animalName} numberOfLines={1}>
          {animal.name ? animal.name : 'Animal'}
          {animal.id ? `  #${animal.id}` : ''}
        </Text>
        <Text style={styles.animalMeta}>
          {typeLabel} · {shiftLabel}
        </Text>
      </View>

      <AppCard style={styles.quantityCard}>
        <Text style={styles.quantityLabel}>Quantity</Text>
        <Text style={styles.quantityValue}>{formatLiters(record.quantity)}</Text>
      </AppCard>

      <AppCard style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Production Date</Text>
          <Text style={styles.detailValue}>{dateLabel}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Shift</Text>
          <Text style={styles.detailValue}>{shiftLabel}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Animal</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {animal.name || '—'}
            {animal.id ? ` #${animal.id}` : ''}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{typeLabel}</Text>
        </View>
      </AppCard>

      <AppButton
        title="Edit Production"
        onPress={() =>
          navigation.navigate(PRODUCTION_ROUTES.EDIT, { record })
        }
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
  hero: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarIcon: {
    fontSize: 36,
  },
  animalName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  animalMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  quantityCard: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
  quantityLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quantityValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.xs,
  },
  detailsCard: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginLeft: spacing.md,
    flexShrink: 1,
    textAlign: 'right',
  },
  editButton: {
    marginTop: spacing.sm,
  },
  missing: {
    padding: spacing.lg,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});

export default MilkProductionDetailScreen;