import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookmarkButton } from '@/components/home/BookmarkIconButton';

type FloatingActionButtonsProps = {
  activeFilterCount?: number;
  accentColor: string;
  isNearMeActive?: boolean;
  isNearMeLoading?: boolean;
  onPressFilter: () => void;
  onPressNearMe: () => void;
  onPressSaved: () => void;
};

export function FloatingActionButtons({
  activeFilterCount = 0,
  accentColor,
  isNearMeActive = false,
  isNearMeLoading = false,
  onPressFilter,
  onPressNearMe,
  onPressSaved,
}: FloatingActionButtonsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        disabled={isNearMeLoading || isNearMeActive}
        onPress={onPressNearMe}
        style={({ pressed }) => [
          styles.nearMeButton,
          { borderColor: accentColor },
          isNearMeActive && { backgroundColor: accentColor },
          (pressed || isNearMeLoading) && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.label,
            isNearMeActive && styles.activeLabel,
            { color: isNearMeActive ? '#FFFFFF' : accentColor },
          ]}
        >
          {isNearMeLoading ? 'Locating...' : 'Near Me'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onPressFilter}
        style={({ pressed }) => [
          styles.filterButton,
          activeFilterCount > 0
            ? { backgroundColor: accentColor, borderColor: accentColor }
            : { borderColor: '#E8DED3' },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.label, { color: activeFilterCount > 0 ? '#FFFFFF' : accentColor }]}>
          Filter{activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}
        </Text>
      </Pressable>

      <BookmarkButton
        accessibilityLabel="Saved restaurants"
        accentColor={accentColor}
        isSaved={false}
        onPress={() => onPressSaved()}
        style={styles.savedButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    zIndex: 50,
  },
  nearMeButton: {
    minHeight: 44,
    minWidth: 88,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  filterButton: {
    minHeight: 44,
    minWidth: 78,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
  },
  activeLabel: {
    color: '#FFFFFF',
  },
  savedButton: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  pressed: {
    opacity: 0.72,
  },
});
