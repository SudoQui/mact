import { Pressable, StyleSheet, Text, View } from 'react-native';

const ACTIONS = ['Near Me', 'Filter', 'Saved'] as const;

type FloatingActionButtonsProps = {
  accentColor: string;
};

export function FloatingActionButtons({ accentColor }: FloatingActionButtonsProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {ACTIONS.map((label) => (
        <Pressable
          key={label}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { borderColor: accentColor },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.label, { color: accentColor }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
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
  pressed: {
    opacity: 0.72,
  },
});
