/**
 * AnimalListItem
 *
 * Single row in the Animal List: avatar, "#id  Name", type/gender/status
 * line, a colored status dot, and a chevron to indicate it's tappable.
 *
 * Uses imageUrl from the backend, with an emoji fallback.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AnimalPhoto from '../../components/AnimalPhoto';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import {
  getAnimalTypeLabel,
  getGenderLabel,
  getStatusColor,
  getStatusLabel,
} from './animalMeta';

const AnimalListItem = ({ animal, onPress }) => {
  const typeLabel = getAnimalTypeLabel(animal.type);
  const genderLabel = getGenderLabel(animal.gender);
  const statusLabel = getStatusLabel(animal.status);
  const statusColor = getStatusColor(animal.status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <AnimalPhoto imageUrl={animal.imageUrl} type={animal.type} style={styles.avatar} />

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          #{animal.id}
          {animal.name ? `  ${animal.name}` : ''}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {typeLabel} · {genderLabel} · {statusLabel}
        </Text>
      </View>

      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.primaryLight,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarIcon: {
    fontSize: fontSize.lg,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
  },
});

export default AnimalListItem;
