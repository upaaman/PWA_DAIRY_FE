/**
 * breedingEnums.js
 *
 * Option/label mappings for the Breeding module. Both mappings mirror the
 * backend enums exactly — do not add values the backend doesn't support:
 *
 *   BreedingMethod: NATURAL, AI
 *   BreedingStatus: INSEMINATED, PREGNANT, NOT_PREGNANT, CALVED, FAILED
 */
import colors from './colors';

export const BREEDING_METHOD_LABELS = {
  NATURAL: 'Natural',
  AI: 'AI',
};

export const getBreedingMethodLabel = method =>
  BREEDING_METHOD_LABELS[method] || method || '—';

export const BREEDING_METHOD_OPTIONS = [
  { label: 'Natural Mating', value: 'NATURAL' },
  { label: 'AI (Artificial Insemination)', value: 'AI' },
];

export const BREEDING_STATUS_LABELS = {
  INSEMINATED: 'Inseminated',
  PREGNANT: 'Pregnant',
  NOT_PREGNANT: 'Not Pregnant',
  CALVED: 'Calved',
  FAILED: 'Failed',
};

export const BREEDING_STATUS_COLORS = {
  INSEMINATED: colors.info,
  PREGNANT: colors.accentPurple,
  NOT_PREGNANT: colors.warning,
  CALVED: colors.success,
  FAILED: colors.danger,
};

export const getBreedingStatusLabel = status =>
  BREEDING_STATUS_LABELS[status] || status || '—';

export const getBreedingStatusColor = status =>
  BREEDING_STATUS_COLORS[status] || colors.textSecondary;

export const BREEDING_STATUS_OPTIONS = [
  { label: 'Inseminated', value: 'INSEMINATED' },
  { label: 'Pregnant', value: 'PREGNANT' },
  { label: 'Not Pregnant', value: 'NOT_PREGNANT' },
  { label: 'Calved', value: 'CALVED' },
  { label: 'Failed', value: 'FAILED' },
];
