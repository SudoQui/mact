import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getSavedPlaceIds } from '@/lib/favourites';
import { getPlacesByMode, type Place } from '@/services/placesService';

type SavedRestaurantsSheetProps = {
  accentColor: string;
  isVisible: boolean;
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
};

export function SavedRestaurantsSheet({
  accentColor,
  isVisible,
  onClose,
  onSelectPlace,
}: SavedRestaurantsSheetProps) {
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSavedPlaces = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [savedPlaceIds, foodPlaces] = await Promise.all([
        getSavedPlaceIds(),
        getPlacesByMode('food'),
      ]);
      const savedPlaceIdSet = new Set(savedPlaceIds);

      setSavedPlaces(foodPlaces.filter((place) => savedPlaceIdSet.has(place.id)));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong loading saved restaurants.';

      setSavedPlaces([]);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      void Promise.resolve().then(loadSavedPlaces);
    }
  }, [isVisible, loadSavedPlaces]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Saved restaurants</Text>
            <Text style={styles.subtitle}>Your local Food favourites on this device.</Text>
          </View>

          <Pressable
            accessibilityLabel="Close saved restaurants"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Text style={styles.closeLabel}>Close</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator color={accentColor} size="large" />
            <Text style={styles.stateText}>Loading saved restaurants...</Text>
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorTitle}>Unable to load saved restaurants</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={loadSavedPlaces}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: accentColor },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.primaryButtonLabel}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !errorMessage && savedPlaces.length === 0 ? (
          <View style={styles.stateContainer}>
            <Text style={styles.emptyIcon}>☆</Text>
            <Text style={styles.emptyTitle}>No saved restaurants yet</Text>
            <Text style={styles.stateText}>
              Tap Save on a restaurant to keep it here for later.
            </Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage && savedPlaces.length > 0 ? (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {savedPlaces.map((place) => (
              <Pressable
                accessibilityRole="button"
                key={place.id}
                onPress={() => onSelectPlace(place)}
                style={({ pressed }) => [
                  styles.card,
                  { borderLeftColor: accentColor },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.cardTitle}>{place.name}</Text>
                <Text style={styles.cardMeta}>
                  {[place.cuisine ?? place.category, place.suburb].filter(Boolean).join(' | ')}
                </Text>
                <Text numberOfLines={1} style={styles.cardAddress}>
                  {place.address}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backdrop: {
    backgroundColor: 'rgba(21, 25, 34, 0.28)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    maxHeight: '72%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#FFFFFF',
    gap: 16,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D7DCE2',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#151922',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  subtitle: {
    color: '#59606B',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: '#EEF1F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  closeLabel: {
    color: '#3F4652',
    fontSize: 13,
    fontWeight: '900',
  },
  list: {
    gap: 10,
    paddingBottom: 4,
  },
  card: {
    borderLeftWidth: 5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    gap: 5,
    padding: 14,
  },
  cardTitle: {
    color: '#151922',
    fontSize: 16,
    fontWeight: '900',
  },
  cardMeta: {
    color: '#59606B',
    fontSize: 13,
    fontWeight: '800',
  },
  cardAddress: {
    color: '#3F4652',
    fontSize: 14,
    fontWeight: '600',
  },
  stateContainer: {
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  stateText: {
    color: '#4C5360',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyIcon: {
    color: '#D14F2A',
    fontSize: 38,
    fontWeight: '900',
  },
  emptyTitle: {
    color: '#151922',
    fontSize: 17,
    fontWeight: '900',
  },
  errorTitle: {
    color: '#9E2F24',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.76,
  },
});
