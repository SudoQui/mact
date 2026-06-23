import { Pressable, StyleSheet, Text, View } from 'react-native';

const ACTIONS = ['Near Me', 'Saved'] as const;

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
      {ACTIONS.map((label) => {
        return (
          <Pressable
            key={label}
            accessibilityRole="button"
            disabled={label === 'Near Me' && (isNearMeLoading || isNearMeActive)}
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

  return onPressSaved;
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
  button: {
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
  pressed: {
    opacity: 0.72,
  },
});
