import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type HomeSymbolName = {
  ios: SFSymbol;
  android: AndroidSymbol;
  web?: AndroidSymbol;
};

type SymbolIconButtonProps = {
  accessibilityLabel: string;
  backgroundColor?: string;
  borderColor?: string;
  color: string;
  disabled?: boolean;
  fallback: string;
  name: HomeSymbolName;
  onPress: (event: GestureResponderEvent) => void;
  selected?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function SymbolIconButton({
  accessibilityLabel,
  backgroundColor = '#FFFFFF',
  borderColor = 'transparent',
  color,
  disabled = false,
  fallback,
  name,
  onPress,
  selected = false,
  size = 21,
  style,
}: SymbolIconButtonProps) {
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!selected) return;

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.12,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }),
    ]).start();
  }, [scale, selected]);

  const animatePress = (toValue: number) => {
    Animated.timing(scale, {
      toValue,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.wrapper, style, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        hitSlop={6}
        onPress={onPress}
        onPressIn={() => animatePress(0.94)}
        onPressOut={() => animatePress(1)}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor, borderColor },
          (pressed || disabled) && styles.pressed,
        ]}
      >
        <SymbolView
          fallback={<Text style={[styles.fallback, { color, fontSize: size }]}>{fallback}</Text>}
          name={name}
          size={size}
          tintColor={color}
          type="monochrome"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    width: 44,
    height: 44,
  },
  fallback: {
    fontWeight: '900',
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.68,
  },
});
