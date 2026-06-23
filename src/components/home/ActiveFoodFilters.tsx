import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getActiveFoodFilters, type FoodFilterId, type FoodFilterState } from '@/components/home/foodFilters';

type ActiveFoodFiltersProps = {
  accentColor: string;
  filters: FoodFilterState;
  onClearAll: () => void;
  onRemoveFilter: (filterId: FoodFilterId) => void;
};

export function ActiveFoodFilters({
  accentColor,
  filters,
  onClearAll,
  onRemoveFilter,
}: ActiveFoodFiltersProps) {
  const activeFilters = getActiveFoodFilters(filters);

  if (activeFilters.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {activeFilters.map((filter) => (
          <Pressable
            accessibilityLabel={`Remove ${filter.label} filter`}
            accessibilityRole="button"
            key={filter.id}
            onPress={() => onRemoveFilter(filter.id)}
            style={({ pressed }) => [
              styles.activeChip,
              { backgroundColor: `${accentColor}12` },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.activeLabel, { color: accentColor }]}>{filter.activeLabel}</Text>
            <Text style={[styles.removeLabel, { color: accentColor }]}>X</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={onClearAll}
          style={({ pressed }) => [styles.clearChip, pressed && styles.pressed]}
        >
          <Text style={styles.clearLabel}>Clear all</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 32,
  },
  content: {
    gap: 7,
    paddingRight: 2,
  },
  activeChip: {
    minHeight: 30,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 9,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  removeLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  clearChip: {
    minHeight: 30,
    borderRadius: 15,
    backgroundColor: '#F0ECE6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  clearLabel: {
    color: '#4E5651',
    fontSize: 12,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.7,
  },
});
