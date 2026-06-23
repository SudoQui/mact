import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type AnimatedToggleChipProps = {
  accentColor: string;
  label: string;
  onPress: () => void;
  selected: boolean;
  size?: 'compact' | 'regular';
  style?: StyleProp<ViewStyle>;
};

export function AnimatedToggleChip({
  accentColor,
  label,
  onPress,
  selected,
  size = 'compact',
  style,
}: AnimatedToggleChipProps) {
  const [selectionProgress] = useState(() => new Animated.Value(selected ? 1 : 0));
  const [pressScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.timing(selectionProgress, {
      toValue: selected ? 1 : 0,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [selected, selectionProgress]);

  const animatePress = (toValue: number) => {
    Animated.timing(pressScale, {
      toValue,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const backgroundColor = selectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', accentColor],
  });
  const borderColor = selectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E8DED3', accentColor],
  });
  const color = selectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#4E5651', '#FFFFFF'],
  });

  return (
    <Animated.View style={[{ transform: [{ scale: pressScale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={() => animatePress(0.97)}
        onPressOut={() => animatePress(1)}
      >
        <Animated.View
          style={[
            styles.chip,
            size === 'regular' ? styles.regularChip : styles.compactChip,
            { backgroundColor, borderColor },
          ]}
        >
          <Animated.Text style={[styles.label, { color }]}>{label}</Animated.Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactChip: {
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  regularChip: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
  },
});
