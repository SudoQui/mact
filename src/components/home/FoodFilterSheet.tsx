import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedToggleChip } from '@/components/home/AnimatedToggleChip';
import { FOOD_FILTERS, type FoodFilterId, type FoodFilterState } from '@/components/home/foodFilters';

type FoodFilterSheetProps = {
  accentColor: string;
  filters: FoodFilterState;
  isVisible: boolean;
  onClearAll: () => void;
  onClose: () => void;
  onToggleFilter: (filterId: FoodFilterId) => void;
};

export function FoodFilterSheet({
  accentColor,
  filters,
  isVisible,
  onClearAll,
  onClose,
  onToggleFilter,
}: FoodFilterSheetProps) {
  const [translateY] = useState(() => new Animated.Value(320));
  const [backdropOpacity] = useState(() => new Animated.Value(0));

  const animateOut = useCallback(
    (afterClose?: () => void) => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 320,
          duration: 190,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 170,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          afterClose?.();
        }
      });
    },
    [backdropOpacity, translateY]
  );

  useEffect(() => {
    if (!isVisible) return;

    translateY.setValue(320);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, isVisible, translateY]);

  const handleClose = useCallback(() => {
    animateOut(onClose);
  }, [animateOut, onClose]);

  const handleClearAndClose = useCallback(() => {
    onClearAll();
    animateOut(onClose);
  }, [animateOut, onClearAll, onClose]);

  if (!isVisible) return null;

  const activeCount = FOOD_FILTERS.filter((filter) => filters[filter.id]).length;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable accessibilityRole="button" onPress={handleClose} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Food filters</Text>
            <Text style={styles.subtitle}>{activeCount || 'No'} active</Text>
          </View>
          <Pressable
            accessibilityLabel="Clear all food filters"
            accessibilityRole="button"
            disabled={activeCount === 0}
            onPress={onClearAll}
            style={({ pressed }) => [styles.clearButton, (pressed || activeCount === 0) && styles.pressed]}
          >
            <Text style={[styles.clearLabel, { color: accentColor }]}>Clear all</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Clear filters and close"
            accessibilityRole="button"
            onPress={handleClearAndClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeLabel}>X</Text>
          </Pressable>
        </View>

        <View style={styles.filterGrid}>
          {FOOD_FILTERS.map((filter) => {
            const isSelected = filters[filter.id];

            return (
              <AnimatedToggleChip
                accentColor={accentColor}
                key={filter.id}
                label={filter.label}
                onPress={() => onToggleFilter(filter.id)}
                selected={isSelected}
                size="regular"
              />
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 90,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 22, 19, 0.28)',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#FFFCF7',
    gap: 14,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 12,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D8D2C9',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#202421',
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: '#6A706C',
    fontSize: 12,
    fontWeight: '800',
  },
  clearButton: {
    minHeight: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  clearLabel: {
    fontSize: 13,
    fontWeight: '900',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0ECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: {
    color: '#303531',
    fontSize: 15,
    fontWeight: '900',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pressed: {
    opacity: 0.68,
  },
});
