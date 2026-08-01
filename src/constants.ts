import type { Category, CardioSubtype } from './types';

export const CATEGORY_LABEL: Record<Category, string> = {
  cardio: 'Cardio',
  lift: 'Lift',
  'cross-train': 'Cross-train',
};

export const SUBTYPE_LABEL: Record<CardioSubtype, string> = {
  base: 'Base',
  threshold: 'Threshold',
  vo2max: 'VO2max',
};
