import type { ReactNode } from 'react';
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
  return (
    <View style={styles.container}>
      <View style={[styles.mapPlaceholder, { borderColor: accentColor }]}> 
        <Text style={[styles.title, { color: accentColor }]}>RealFoodMap placeholder</Text>
        <Text style={styles.body}>
          This is the future MapLibre-backed food map. It receives places, the selected place,
          user location, and interaction callbacks.
        </Text>
        <Text style={styles.meta}>Food places: {places.filter((item) => item.kind === 'place').length}</Text>
        <Text style={styles.meta}>Selected place: {selectedPlace ? selectedPlace.name : 'None'}</Text>
        <Text style={styles.meta}>Near Me active: {nearMeActive ? 'Yes' : 'No'}</Text>
        <Text style={styles.meta}>
          Location: {userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 'not available'}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onMapInteraction}
          style={({ pressed }) => [styles.interactionButton, pressed && styles.pressed]}
        >
          <Text style={styles.interactionLabel}>Simulate map interaction</Text>
        </Pressable>
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
  mapPlaceholder: {
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#F4F7FB',
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
  },
  body: {
    color: '#4C5B6A',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  meta: {
    color: '#59606B',
    fontSize: 13,
    fontWeight: '700',
  },
  interactionButton: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  interactionLabel: {
    color: '#2B313D',
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.7,
  },
  children: {
    flex: 1,
  },
});