import { useCallback, useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

type NearMeRadiusControlProps = {
  accentColor: string;
  count: number;
  onChangeRadius: (radiusKm: number) => void;
  radiusKm: number;
};

const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 20;

export function NearMeRadiusControl({
  accentColor,
  count,
  onChangeRadius,
  radiusKm,
}: NearMeRadiusControlProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = (radiusKm - MIN_RADIUS_KM) / (MAX_RADIUS_KM - MIN_RADIUS_KM);

  const updateRadiusFromX = useCallback((x: number) => {
    if (!trackWidth) return;

    const boundedX = Math.max(0, Math.min(trackWidth, x));
    const rawRadius =
      MIN_RADIUS_KM + (boundedX / trackWidth) * (MAX_RADIUS_KM - MIN_RADIUS_KM);
    onChangeRadius(Math.round(rawRadius));
  }, [onChangeRadius, trackWidth]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => updateRadiusFromX(event.nativeEvent.locationX),
        onPanResponderMove: (event) => updateRadiusFromX(event.nativeEvent.locationX),
      }),
    [updateRadiusFromX]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Near me: {radiusKm} km</Text>
        <Text style={styles.count}>
          {count} {count === 1 ? 'place' : 'places'} within {radiusKm} km
        </Text>
      </View>
      <View
        {...panResponder.panHandlers}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={styles.track}
      >
        <View
          style={[
            styles.trackFill,
            {
              backgroundColor: accentColor,
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              backgroundColor: accentColor,
              left: `${Math.max(0, Math.min(1, progress)) * 100}%`,
            },
          ]}
        />
      </View>
      <View style={styles.stepper}>
        <Pressable
          accessibilityLabel="Decrease Near Me radius"
          accessibilityRole="button"
          onPress={() => onChangeRadius(Math.max(MIN_RADIUS_KM, radiusKm - 1))}
          style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
        >
          <Text style={[styles.stepLabel, { color: accentColor }]}>-</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Increase Near Me radius"
          accessibilityRole="button"
          onPress={() => onChangeRadius(Math.min(MAX_RADIUS_KM, radiusKm + 1))}
          style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
        >
          <Text style={[styles.stepLabel, { color: accentColor }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: '#FFF0E8',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: { color: '#513B33', fontSize: 13, fontWeight: '900' },
  count: { flex: 1, color: '#6E5B53', fontSize: 12, fontWeight: '800', textAlign: 'right' },
  track: {
    height: 22,
    justifyContent: 'center',
  },
  trackFill: {
    height: 5,
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  stepper: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  stepButton: {
    width: 34,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontSize: 20, fontWeight: '900', lineHeight: 22 },
  pressed: { opacity: 0.7 },
});
