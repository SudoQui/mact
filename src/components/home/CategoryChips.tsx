import { ScrollView, StyleSheet } from 'react-native';

import { AnimatedToggleChip } from '@/components/home/AnimatedToggleChip';

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
          <AnimatedToggleChip
            accentColor={accentColor}
            key={category}
            label={category}
            onPress={() => onSelectCategory(category)}
            selected={isSelected}
          />
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
});
