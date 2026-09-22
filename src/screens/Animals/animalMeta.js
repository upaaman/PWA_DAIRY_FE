/**
 * animalMeta.js
 *
 * Display helpers for the Animal entity coming from the backend
 * (DairyWeb.dairy.DairyEntities.Animal, exposed via GET /animal/getAll).
 *
 * Backend enums (do not invent extra values here):
 *   AnimalType:   COW, BUFFALO
 *   AnimalGender: MALE, FEMALE
 *   AnimalStatus: PRODUCING, NONPRODUCING, CHILD
 *
 * The farm only ever has cows and buffaloes, so the filter chips are
 * All / Cows / Buffaloes / Inactive. Inactive animals (status INACTIVE)
 * are only listed under the Inactive chip — they are hidden from All,
 * Cows, and Buffaloes.
 */
import colors from '../../constants/colors';

const TYPE_LABELS = {
  COW: 'Cow',
  BUFFALO: 'Buffalo',
};

const TYPE_ICONS = {
  COW: '🐄',
  BUFFALO: '🐃',
};

const GENDER_LABELS = {
  MALE: 'Male',
  FEMALE: 'Female',
};

const STATUS_LABELS = {
  PRODUCING: 'Producing',
  NONPRODUCING: 'Non-Producing',
  CHILD: 'Child',
};

const STATUS_COLORS = {
  PRODUCING: colors.success,
  NONPRODUCING: colors.warning,
  CHILD: colors.textMuted,
  INACTIVE: colors.textSecondary,
};

export const getAnimalTypeLabel = type => TYPE_LABELS[type] || 'Other';
export const getAnimalIcon = type => TYPE_ICONS[type] || '🐐';
export const getGenderLabel = gender => GENDER_LABELS[gender] || '—';
export const getStatusLabel = status => STATUS_LABELS[status] || '—';
export const getStatusColor = status => STATUS_COLORS[status] || colors.textMuted;

// Filter chips shown above the list. Inactive animals live only under the
// Inactive chip — they are excluded from All / Cows / Buffaloes.
export const FILTER_OPTIONS = [
  { key: 'ALL', label: 'All' },
  { key: 'COW', label: 'Cows' },
  { key: 'BUFFALO', label: 'Buffaloes' },
  { key: 'INACTIVE', label: 'Inactive' },
];

export const matchesFilter = (animal, filterKey) => {
  if (filterKey === 'INACTIVE') {
    return animal.status === 'INACTIVE';
  }
  if (filterKey === 'ALL') {
    return animal.status !== 'INACTIVE';
  }
  return animal.type === filterKey && animal.status !== 'INACTIVE';
};

// Option lists for the Add/Edit Animal form selects.
// Mirrors the backend enums exactly (DairyEnums.AnimalType/Gender/Status) —
// do not add values the backend doesn't support.
export const TYPE_OPTIONS = [
  { label: 'Cow', value: 'COW' },
  { label: 'Buffalo', value: 'BUFFALO' },
];

export const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

export const STATUS_OPTIONS = [
  { label: 'Producing', value: 'PRODUCING' },
  { label: 'Non-Producing', value: 'NONPRODUCING' },
  { label: 'Child', value: 'CHILD' },
];
