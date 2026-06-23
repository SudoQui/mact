import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

export const FOOD_CATEGORY_CHIPS = ['All', 'Restaurant', 'Cafe', 'Butcher', 'Grocery', 'Dessert'] as const;

export type FoodCategoryChip = (typeof FOOD_CATEGORY_CHIPS)[number];

type CategoryChipsProps = {
  accentColor: string;
  onSelectCategory: (category: FoodCategoryChip) => void;
  selectedCategory: FoodCategoryChip;
};

export function CategoryChips({
  accentColor,
  onSelectCategory,
  selectedCategory,
}: CategoryChipsProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {FOOD_CATEGORY_CHIPS.map((category) => {
        const isSelected = selectedCategory === category;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={category}
            onPress={() => onSelectCategory(category)}
            style={({ pressed }) => [
              styles.chip,
              isSelected
                ? { backgroundColor: accentColor, borderColor: accentColor }
                : styles.inactiveChip,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, isSelected ? styles.selectedLabel : styles.inactiveLabel]}>
              {category}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 7,
    paddingRight: 2,
  },
  chip: {
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inactiveChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8DED3',
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
  },
  inactiveLabel: {
    color: '#4E5651',
  },
  selectedLabel: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.72,
  },
});
