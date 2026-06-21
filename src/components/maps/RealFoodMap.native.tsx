import { Map } from '@maplibre/maplibre-react-native';
import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HomeResult } from '@/components/home/MapResults';
import type { Place } from '@/services/placesService';

type RealFoodMapProps = {
  accentColor: string;
  places: HomeResult[];
  selectedPlace: Place | null;
  onSelectPlace: (placeId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  nearMeActive: boolean;
  onMapInteraction?: () => void;
  children?: ReactNode;
};

const DEMO_STYLE_URL = 'https://demotiles.maplibre.org/style.json';
const CANBERRA_CENTER: [number, number] = [149.1300, -35.2809];
const DEFAULT_ZOOM = 11;
const USER_ZOOM = 13;
const FIT_PADDING = 60;

export function RealFoodMap({
  accentColor,
  places,
  selectedPlace,
  onSelectPlace,
  userLocation,
  nearMeActive,
  onMapInteraction,
  children,
}: RealFoodMapProps) {
  const fitRestaurants = useCallback(() => {
    // No-op for now while debugging MapLibre exports
    return;
  }, []);

  const handleRegionDidChange = useCallback((_event?: any) => {
    onMapInteraction?.();
  }, [onMapInteraction]);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <Map
          style={styles.map}
          mapStyle={DEMO_STYLE_URL}
          onRegionDidChange={handleRegionDidChange}
        />

        <View style={styles.controlBar} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            onPress={fitRestaurants}
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}
          >
            <Text style={styles.controlLabel}>Fit Restaurants</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.children}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 14,
  },
  mapWrapper: {
    minHeight: 280,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F4F7FB',
  },
  map: {
    width: '100%',
    height: 280,
  },
  marker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#208AEF',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedMarker: {
    backgroundColor: '#FF6B6B',
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  controlBar: {
    position: 'absolute',
    left: 12,
    top: 12,
    gap: 10,
    alignItems: 'flex-start',
    zIndex: 50,
  },
  controlButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  controlLabel: {
    color: '#25303D',
    fontSize: 13,
    fontWeight: '900',
  },
  controlPressed: {
    opacity: 0.75,
  },
  children: {
    flex: 1,
  },
});