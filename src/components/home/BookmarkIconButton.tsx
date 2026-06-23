import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type BookmarkButtonProps = {
  accessibilityLabel?: string;
  accentColor: string;
  disabled?: boolean;
  isSaved: boolean;
  onPress: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
};

export function BookmarkButton({
  accessibilityLabel,
  accentColor,
  disabled = false,
  isSaved,
  onPress,
  style,
}: BookmarkButtonProps) {
  const [selectionProgress] = useState(() => new Animated.Value(isSaved ? 1 : 0));
  const [pressScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.timing(selectionProgress, {
      toValue: isSaved ? 1 : 0,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (isSaved) {
      Animated.sequence([
        Animated.timing(pressScale, {
          toValue: 1.11,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(pressScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 5,
        }),
      ]).start();
      return;
    }

    Animated.timing(pressScale, {
      toValue: 1,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isSaved, pressScale, selectionProgress]);

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
    outputRange: ['#F7F4EF', '#FFF0E4'],
  });
  const borderColor = selectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E8DED3', `${accentColor}66`],
  });
  const iconColor = isSaved ? accentColor : '#4F5652';

  return (
    <Animated.View style={[styles.wrapper, style, { transform: [{ scale: pressScale }] }]}>
      <Pressable
        accessibilityLabel={accessibilityLabel ?? (isSaved ? 'Unsave restaurant' : 'Save restaurant')}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected: isSaved }}
        disabled={disabled}
        hitSlop={6}
        onPress={onPress}
        onPressIn={() => animatePress(0.94)}
        onPressOut={() => animatePress(1)}
        style={styles.pressable}
      >
        <Animated.View style={[styles.button, { backgroundColor, borderColor }]}>
          <Animated.View style={styles.iconFrame}>
            <SymbolView
              fallback={<Text style={[styles.fallback, { color: iconColor }]}>{isSaved ? '*' : '-'}</Text>}
              name={
                isSaved
                  ? { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' }
                  : { ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' }
              }
              size={22}
              tintColor={iconColor}
              type="monochrome"
            />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export const BookmarkIconButton = BookmarkButton;

const styles = StyleSheet.create({
  wrapper: {
    width: 42,
    height: 42,
  },
  pressable: {
    flex: 1,
  },
  button: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFrame: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    fontSize: 18,
    fontWeight: '900',
  },
});
