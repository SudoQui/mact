export const FOOD_FILTERS = [
  {
    id: 'halalCertified',
    label: 'Halal certified',
    activeLabel: 'Certified',
  },
  {
    id: 'handSlaughtered',
    label: 'Hand slaughtered',
    activeLabel: 'Hand slaughtered',
  },
  {
    id: 'noPork',
    label: 'No pork',
    activeLabel: 'No pork',
  },
  {
    id: 'noAlcohol',
    label: 'No alcohol',
    activeLabel: 'No alcohol',
  },
  {
    id: 'noCrossContaminationRisk',
    label: 'No cross contamination risk',
    activeLabel: 'No cross contamination',
  },
  {
    id: 'highConfidence',
    label: 'High confidence',
    activeLabel: 'High confidence',
  },
  {
    id: 'chickenAndBeefConfirmed',
    label: 'Chicken and beef confirmed',
    activeLabel: 'Chicken & beef',
  },
  {
    id: 'savedOnly',
    label: 'Saved only',
    activeLabel: 'Saved only',
  },
] as const;

export type FoodFilterId = (typeof FOOD_FILTERS)[number]['id'];

export type FoodFilterState = Record<FoodFilterId, boolean>;

export const EMPTY_FOOD_FILTERS: FoodFilterState = {
  halalCertified: false,
  handSlaughtered: false,
  noPork: false,
  noAlcohol: false,
  noCrossContaminationRisk: false,
  highConfidence: false,
  chickenAndBeefConfirmed: false,
  savedOnly: false,
};

export function getActiveFoodFilters(filters: FoodFilterState) {
  return FOOD_FILTERS.filter((filter) => filters[filter.id]);
}
