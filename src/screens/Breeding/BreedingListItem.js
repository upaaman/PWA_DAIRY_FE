/**
 * BreedingListItem
 *
 * One breeding record as a card:
 *   - mother animal (avatar, name, type/breed) + status badge
 *   - breeding date -> expected calving date timeline with the method badge
 *   - calving row (actual date + linked calf) once calved
 *   - notes
 *
 * The whole card is pressable and opens the edit/update form.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';
import {
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from '../../constants/appConstants';
import {
  getBreedingMethodLabel,
  getBreedingStatusColor,
  getBreedingStatusLabel,
} from '../../constants/breedingEnums';
import { formatDateString } from '../../utils/date';
import { getAnimalIcon, getAnimalTypeLabel } from '../Animals/animalMeta';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// "in 241 days" / "Due today" / "12 days overdue" for the expected calving
// date. Only meaningful while the record hasn't been marked as calved.
const getCountdownLabel = dateString => {
  if (!dateString) {
    return null;
  }
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.round((target.getTime() - today.getTime()) / DAY_IN_MS);
  if (days === 0) {
    return 'Due today';
  }
  if (days > 0) {
    return `in ${days} day${days === 1 ? '' : 's'}`;
  }
  const overdue = Math.abs(days);
  return `${overdue} day${overdue === 1 ? '' : 's'} overdue`;
};

const BreedingListItem = ({ breeding, onPress }) => {
  const animal = breeding.animal || {};
  const calf = breeding.producedAnimal;

  const statusLabel = getBreedingStatusLabel(breeding.status);
  const statusColor = getBreedingStatusColor(breeding.status);
  const countdown =
    breeding.status === 'CALVED'
      ? null
      : getCountdownLabel(breeding.expectedCalvingDate);

  const animalMeta = [
    getAnimalTypeLabel(animal.type),
    animal.breed,
    animal.id ? `#${animal.id}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarEmoji}>{getAnimalIcon(animal.type)}</Text>
        </View>

        <View style={styles.titleGroup}>
          <Text style={styles.name} numberOfLines={1}>
            {animal.name || 'Animal'}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {animalMeta}
          </Text>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.timelineRow}>
        <View style={styles.timelineStep}>
          <Text style={styles.timelineLabel}>Breeding</Text>
          <Text style={styles.timelineValue}>
            {formatDateString(breeding.breedingDate) || '—'}
          </Text>
        </View>

        <Text style={styles.timelineArrow}>→</Text>

        <View style={styles.timelineStep}>
          <Text style={styles.timelineLabel}>Expected calving</Text>
          <Text style={styles.timelineValue}>
            {formatDateString(breeding.expectedCalvingDate) || '—'}
          </Text>
          {countdown ? (
            <Text style={styles.timelineHint}>{countdown}</Text>
          ) : null}
        </View>

        <View style={styles.methodBadge}>
          <Text style={styles.methodText}>
            {getBreedingMethodLabel(breeding.method)}
          </Text>
        </View>
      </View>

      {breeding.actualCalvingDate ? (
        <View style={styles.calvedRow}>
          <Text style={styles.calvedIcon}>🍼</Text>
          <Text style={styles.calvedText}>
            Calved on {formatDateString(breeding.actualCalvingDate)}
          </Text>
          {calf ? (
            <View style={styles.calfChip}>
              <Text style={styles.calfChipText} numberOfLines={1}>
                {getAnimalIcon(calf.type)} {calf.name || 'Calf'} #{calf.id}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {breeding.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{breeding.notes}</Text>
        </View>
      ) : null}

      <View style={styles.editHintRow}>
        <Text style={styles.editHint}>Tap to update status or calving</Text>
        <Text style={styles.editChevron}>›</Text>
      </View>
    </Pressable>
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
  cardPressed: {
    backgroundColor: colors.primarySoft,
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
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginTop: spacing.md,
  },
  timelineStep: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: 2,
  },
  timelineHint: {
    fontSize: 10.5,
    fontWeight: fontWeight.semibold,
    color: colors.accentTeal,
    marginTop: 1,
  },
  timelineArrow: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginHorizontal: spacing.sm,
  },
  methodBadge: {
    backgroundColor: colors.accentPurple,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginLeft: spacing.sm,
  },
  methodText: {
    fontSize: 10.5,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },

  calvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  calvedIcon: {
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  calvedText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  calfChip: {
    flex: 1,
    marginLeft: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  calfChipText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.primaryDark,
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

  editHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  editHint: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  editChevron: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginLeft: 2,
    marginTop: -2,
  },
});

export default BreedingListItem;
