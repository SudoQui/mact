import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SymbolIconButton } from '@/components/home/SymbolIconButton';

type FloatingActionButtonsProps = {
  accentColor: string;
  isNearMeActive?: boolean;
  isNearMeLoading?: boolean;
  onPressNearMe: () => void;
  onPressSaved: () => void;
};

export function FloatingActionButtons({
  accentColor,
  isNearMeActive = false,
  isNearMeLoading = false,
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
      <SymbolIconButton
        accessibilityLabel="Saved restaurants"
        borderColor="#E8DED3"
        color={accentColor}
        fallback="☆"
        name={{ ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' }}
        onPress={onPressSaved}
        size={21}
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
