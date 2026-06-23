import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MACT_MODES, type MactMode } from './mactModes';

type ModeBarProps = {
  selectedMode: MactMode;
  onSelectMode: (mode: MactMode) => void;
};

export function ModeBar({ selectedMode, onSelectMode }: ModeBarProps) {
  return (
    <View style={styles.container}>
      {MACT_MODES.map((mode) => {
        const isSelected = mode.id === selectedMode;

        return (
          <Pressable
            key={mode.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelectMode(mode.id)}
            style={({ pressed }) => [
              styles.button,
              isSelected && { backgroundColor: mode.color },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>{mode.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  label: {
    color: '#4C5360',
    fontSize: 14,
    fontWeight: '800',
  },
  selectedLabel: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.76,
  },
});
