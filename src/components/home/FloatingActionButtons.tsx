import { Pressable, StyleSheet, Text, View } from 'react-native';

const ACTIONS = ['Near Me', 'Filter', 'Saved'] as const;

type FloatingActionButtonsProps = {
  accentColor: string;
  isNearMeActive?: boolean;
  isNearMeLoading?: boolean;
  onClearNearMe?: () => void;
  onPressNearMe: () => void;
  onPressSaved: () => void;
};

export function FloatingActionButtons({
  accentColor,
  isNearMeActive = false,
  isNearMeLoading = false,
  onClearNearMe,
  onPressNearMe,
  onPressSaved,
}: FloatingActionButtonsProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {ACTIONS.map((label) => {
        if (label === 'Near Me' && isNearMeActive) {
          return (
            <Pressable
              key="clear-near-me"
              accessibilityRole="button"
              onPress={onClearNearMe}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: accentColor, borderColor: accentColor },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.label, styles.activeLabel]}>Clear Near Me</Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={label}
            accessibilityRole="button"
            disabled={label === 'Near Me' && isNearMeLoading}
            onPress={getActionPressHandler(label, onPressNearMe, onPressSaved)}
            style={({ pressed }) => [
              styles.button,
              { borderColor: accentColor },
              label === 'Near Me' && isNearMeActive && { backgroundColor: accentColor },
              (pressed || (label === 'Near Me' && isNearMeLoading)) && styles.pressed,
            ]}>
            <Text
              style={[
                styles.label,
                label === 'Near Me' && isNearMeActive && styles.activeLabel,
                { color: label === 'Near Me' && isNearMeActive ? '#FFFFFF' : accentColor },
              ]}>
              {label === 'Near Me' && isNearMeLoading ? 'Locating...' : label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getActionPressHandler(
  label: (typeof ACTIONS)[number],
  onPressNearMe: () => void,
  onPressSaved: () => void
) {
  if (label === 'Near Me') {
    return onPressNearMe;
  }

  if (label === 'Saved') {
    return onPressSaved;
  }

  return noop;
}

function noop() {
  return undefined;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 18,
    top: 148,
    gap: 10,
  },
  button: {
    minHeight: 44,
    minWidth: 94,
    borderRadius: 8,
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
  pressed: {
    opacity: 0.72,
  },
});
