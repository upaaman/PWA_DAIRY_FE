/**
 * VaccineListItem
 *
 * One vaccination record in the Vaccine list: animal avatar on the left,
 * vaccine name + animal info in the middle and the vaccination date on
 * the right (as a pill). Notes are rendered underneath when present.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import {
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from '../../constants/appConstants';
import { formatDateString } from '../../utils/date';
import {
  getAnimalIcon,
  getAnimalTypeLabel,
  getStatusLabel,
} from '../Animals/animalMeta';

const VaccineListItem = ({ vaccine }) => {
  const animal = vaccine.animal || {};

  const animalMeta = [
    animal.name ? `${animal.name} · #${animal.id}` : 'Animal unavailable',
    animal.type ? getAnimalTypeLabel(animal.type) : null,
    animal.status ? getStatusLabel(animal.status) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarEmoji}>{getAnimalIcon(animal.type)}</Text>
        </View>

        <View style={styles.titleGroup}>
          <Text style={styles.vaccineName} numberOfLines={1}>
            {vaccine.vaccineName || 'Vaccine'}
          </Text>
          <Text style={styles.animalMeta} numberOfLines={1}>
            {animalMeta}
          </Text>
        </View>

        <View style={styles.datePill}>
          <Text style={styles.datePillText}>
            {formatDateString(vaccine.vaccineDate) || '—'}
          </Text>
        </View>
      </View>

      {vaccine.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{vaccine.notes}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  titleGroup: {
    flex: 1,
    marginRight: spacing.sm,
  },
  vaccineName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  animalMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  datePill: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  notesBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  notesText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 17,
  },
});

export default VaccineListItem;
