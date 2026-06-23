import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { MACT_MODES, type MactMode } from './mactModes';

type ModeBarProps = {
  selectedMode: MactMode;
  onSelectMode: (mode: MactMode) => void;
};

const HORIZONTAL_PADDING = 5;
const ITEM_GAP = 5;

export function ModeBar({ selectedMode, onSelectMode }: ModeBarProps) {
  const [barWidth, setBarWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(getModeIndex(selectedMode)));
  const indicatorWidth = Math.max(0, (barWidth - HORIZONTAL_PADDING * 2 - ITEM_GAP * 2) / 3);
  const indicatorTranslateX = useMemo(
    () =>
      position.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [0, indicatorWidth + ITEM_GAP, (indicatorWidth + ITEM_GAP) * 2],
      }),
    [indicatorWidth, position]
  );
  const indicatorColor = position.interpolate({
    inputRange: [0, 1, 2],
    outputRange: MACT_MODES.map((mode) => mode.color),
  });

  useEffect(() => {
    Animated.timing(position, {
      toValue: getModeIndex(selectedMode),
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [position, selectedMode]);

  return (
    <View
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      style={styles.container}
    >
      {barWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: indicatorWidth,
              backgroundColor: indicatorColor,
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        />
      ) : null}
      {MACT_MODES.map((mode) => {
        const isSelected = mode.id === selectedMode;

        return (
          <Pressable
            key={mode.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelectMode(mode.id)}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>{mode.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getModeIndex(mode: MactMode) {
  return Math.max(0, MACT_MODES.findIndex((item) => item.id === mode));
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ITEM_GAP,
    padding: HORIZONTAL_PADDING,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: HORIZONTAL_PADDING,
    bottom: HORIZONTAL_PADDING,
    left: HORIZONTAL_PADDING,
    borderRadius: 10,
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    zIndex: 1,
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
