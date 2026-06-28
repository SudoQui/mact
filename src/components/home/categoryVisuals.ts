export type FoodCategoryVisual = {
  key: 'restaurant' | 'cafe' | 'butcher' | 'grocery' | 'dessert' | 'unknown';
  label: string;
  pinLabel: string;
  color: string;
  subtleColor: string;
  borderColor: string;
};

const FOOD_CATEGORY_VISUALS: Record<FoodCategoryVisual['key'], FoodCategoryVisual> = {
  restaurant: {
    key: 'restaurant',
    label: 'Restaurant',
    pinLabel: 'R',
    color: '#D84315',
    subtleColor: '#FFF0E8',
    borderColor: '#F2A38B',
  },
  cafe: {
    key: 'cafe',
    label: 'Cafe',
    pinLabel: 'C',
    color: '#6F4E37',
    subtleColor: '#F6EEE8',
    borderColor: '#D2B099',
  },
  butcher: {
    key: 'butcher',
    label: 'Butcher',
    pinLabel: 'B',
    color: '#B00020',
    subtleColor: '#FDECEF',
    borderColor: '#EE8EA0',
  },
  grocery: {
    key: 'grocery',
    label: 'Grocery',
    pinLabel: 'G',
    color: '#00875A',
    subtleColor: '#E5F6EF',
    borderColor: '#8AD4B7',
  },
  dessert: {
    key: 'dessert',
    label: 'Dessert',
    pinLabel: 'D',
    color: '#7C3AED',
    subtleColor: '#F1EAFE',
    borderColor: '#C4B5FD',
  },
  unknown: {
    key: 'unknown',
    label: 'Other',
    pinLabel: '?',
    color: '#374151',
    subtleColor: '#F3F4F6',
    borderColor: '#CBD5E1',
  },
};

export function getFoodCategoryVisual(category: string): FoodCategoryVisual {
  const normalized = category.toLowerCase();

  if (normalized.includes('restaurant')) {
    return FOOD_CATEGORY_VISUALS.restaurant;
  }

  if (normalized.includes('cafe') || normalized.includes('coffee')) {
    return FOOD_CATEGORY_VISUALS.cafe;
  }

  if (normalized.includes('butcher')) {
    return FOOD_CATEGORY_VISUALS.butcher;
  }

  if (normalized.includes('grocery') || normalized.includes('grocer')) {
    return FOOD_CATEGORY_VISUALS.grocery;
  }

  if (normalized.includes('dessert') || normalized.includes('sweet')) {
    return FOOD_CATEGORY_VISUALS.dessert;
  }

  return FOOD_CATEGORY_VISUALS.unknown;
}

export function formatMarkerName(name: string, maxLength = 22) {
  const normalizedName = name.trim().replace(/\s+/g, ' ');
  if (normalizedName.length <= maxLength) return normalizedName;
  return `${normalizedName.slice(0, maxLength - 3).trim()}...`;
}
