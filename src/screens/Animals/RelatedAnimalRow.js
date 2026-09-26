/**
 * RelatedAnimalRow
 *
 * Compact, tappable animal row used by the "Family" section of the Animal
 * Details screen — one row for the mother, one per child.
 *
 * The lineage objects ride along with GET /animal/get/{id} and carry the
 * plain Animal fields (id, name, type, gender, status, dateOfBirth), so this
 * is a one-line summary row rather than a second full detail card. Tapping
 * it opens that animal's own details page.
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
  getAnimalIcon,
  getAnimalTypeLabel,
  getGenderLabel,
  getStatusColor,
  getStatusLabel,
} from './animalMeta';

const RelatedAnimalRow = ({ animal, onPress }) => {
  const facts = [
    getAnimalTypeLabel(animal.type),
    getGenderLabel(animal.gender),
    getStatusLabel(animal.status),
  ].join(' · ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && styles.rowPressed,
      ]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarIcon}>{getAnimalIcon(animal.type)}</Text>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(animal.status) },
          ]}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {animal.name ? animal.name : 'Unnamed'}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          #{animal.id}
          {animal.breed ? ` · ${animal.breed}` : ''} · {facts}
        </Text>
      </View>

      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderRadius: borderRadius.md,
  },
  rowPressed: {
    backgroundColor: colors.primaryLight,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarIcon: {
    fontSize: fontSize.lg,
  },
  statusDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
});

export default RelatedAnimalRow;
