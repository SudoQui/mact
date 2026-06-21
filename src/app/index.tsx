import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingActionButtons } from '@/components/home/FloatingActionButtons';
import { FoodMap } from '@/components/home/FoodMap';
import { HomeSearchBar } from '@/components/home/HomeSearchBar';
import { MapResults, type HomeResult } from '@/components/home/MapResults';
import { ModeBar } from '@/components/home/ModeBar';
import { RestaurantDetailSheet } from '@/components/home/RestaurantDetailSheet';
import { SavedRestaurantsSheet } from '@/components/home/SavedRestaurantsSheet';
import { UnderConstructionCard } from '@/components/home/UnderConstructionCard';
import { getModeConfig, type MactMode } from '@/components/home/mactModes';
import { BottomTabInset } from '@/constants/theme';
import { getNearbyPlaces, getPlacesByMode, type Place } from '@/services/placesService';

const NEARBY_RADIUS_METERS = 10000;

export default function HomeScreen() {
  const [selectedMode, setSelectedMode] = useState<MactMode>('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<HomeResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nearMeMessage, setNearMeMessage] = useState<string | null>(null);
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [isNearMeLoading, setIsNearMeLoading] = useState(false);
  const [selectedFoodPlace, setSelectedFoodPlace] = useState<Place | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSavedSheetOpen, setIsSavedSheetOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const mode = useMemo(() => getModeConfig(selectedMode), [selectedMode]);
  const foodMode = useMemo(() => getModeConfig('food'), []);

  const loadResults = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setNearMeMessage(null);
      setIsNearMeActive(false);

      if (selectedMode !== 'food') {
        setResults([]);
        return;
      }

      // 8 second timeout for loading
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Loading took too long. Please check your connection and try again.'));
        }, 8000);
      });

      const places = await Promise.race([
        getPlacesByMode('food'),
        timeoutPromise,
      ]);

      if (timeoutId) clearTimeout(timeoutId);
      setResults(places.map((item) => ({ kind: 'place', item })));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong loading MACT results.';

      setResults([]);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMode]);

  useEffect(() => {
    void Promise.resolve().then(loadResults);
  }, [loadResults]);

  const restoreNormalFoodResults = useCallback(async () => {
    try {
      const places = await getPlacesByMode('food');
      setResults(places.map((item) => ({ kind: 'place', item })));
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong loading MACT results.';
      setErrorMessage(message);
    }
  }, []);

  const handleClearNearMe = useCallback(async () => {
    await restoreNormalFoodResults();
    setNearMeMessage(null);
    setIsNearMeActive(false);
  }, [restoreNormalFoodResults]);

  const handleSelectMode = useCallback((nextMode: MactMode) => {
    setSelectedMode(nextMode);
    setSelectedFoodPlace(null);
    setNearMeMessage(null);
    setIsNearMeActive(false);
  }, []);

  const handlePressFoodPlace = useCallback((place: Place) => {
    setSelectedFoodPlace(place);
  }, []);

  const handleOpenSavedRestaurants = useCallback(() => {
    setIsSavedSheetOpen(true);
  }, []);

  const handleCloseSavedRestaurants = useCallback(() => {
    setIsSavedSheetOpen(false);
  }, []);

  const handleSelectSavedRestaurant = useCallback((place: Place) => {
    setIsSavedSheetOpen(false);
    setSelectedFoodPlace(place);
  }, []);

  const handleCloseRestaurantDetail = useCallback(() => {
    setSelectedFoodPlace(null);
  }, []);

  const handleMapInteraction = useCallback(() => {
    if (isNearMeActive) {
      void handleClearNearMe();
    }
  }, [handleClearNearMe, isNearMeActive]);

  const handlePressNearMe = useCallback(async () => {
    if (selectedMode !== 'food') {
      setNearMeMessage('Near Me for this section is coming soon. Food places are ready now.');
      return;
    }

    try {
      setIsNearMeLoading(true);
      setNearMeMessage(null);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        await restoreNormalFoodResults();
        setNearMeMessage(
          'Location permission was not granted. Showing the normal Food list for now.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nearbyPlaces = await getNearbyPlaces(
        location.coords.latitude,
        location.coords.longitude,
        'food',
        NEARBY_RADIUS_METERS
      );
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      const sortedNearbyPlaces = [...nearbyPlaces].sort(
        (left, right) => (left.distance_meters ?? 0) - (right.distance_meters ?? 0)
      );

      setResults(sortedNearbyPlaces.map((item) => ({ kind: 'place', item })));
      setErrorMessage(null);
      setNearMeMessage('Showing Food places near you within 10 km.');
    } catch {
      await restoreNormalFoodResults();
      setNearMeMessage(
        'We could not get your location right now. Showing the normal Food list for now.'
      );
    } finally {
      setIsNearMeLoading(false);
    }
  }, [restoreNormalFoodResults, selectedMode]);

  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return results;
    }

    return results.filter((result) => {
      if (result.kind === 'event') {
        const searchable = [
          result.item.title,
          result.item.host_name,
          result.item.event_type,
          result.item.suburb,
          result.item.address,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(query);
      }

      const searchable = [
        result.item.name,
        result.item.category,
        result.item.cuisine,
        result.item.suburb,
        result.item.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [results, searchQuery]);

  const bottomPadding =
    Platform.OS === 'web' ? insets.bottom + 24 : insets.bottom + BottomTabInset + 16;
  const emptyMessage = getEmptyMessage(selectedMode, searchQuery);
  const constructionCopy = getConstructionCopy(selectedMode);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: `${mode.color}12` }]}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: bottomPadding,
            paddingLeft: Math.max(insets.left, 18),
            paddingRight: Math.max(insets.right, 18),
          },
        ]}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: mode.color }]}>MACT</Text>
          <Text style={styles.title}>{mode.title}</Text>
          <HomeSearchBar
            accentColor={mode.color}
            onChangeText={setSearchQuery}
            value={searchQuery}
          />
        </View>

        <View style={styles.mapShell}>
          <FoodMap
            accentColor={mode.color}
            places={filteredResults}
            selectedPlace={selectedFoodPlace}
            userLocation={userLocation}
            nearMeActive={isNearMeActive}
            onSelectPlace={(placeId) => {
              const found = filteredResults.find(
                (r) => r.kind === 'place' && r.item.id === placeId
              );

              if (found && found.kind === 'place') {
                handlePressFoodPlace(found.item);
              }
            }}
            onMapInteraction={handleMapInteraction}>
            {nearMeMessage ? (
              <View style={[styles.notice, { borderColor: mode.color }]}>
                <Text style={[styles.noticeText, { color: mode.color }]}>{nearMeMessage}</Text>
              </View>
            ) : null}
            {constructionCopy ? (
              <UnderConstructionCard
                accentColor={mode.color}
                body={constructionCopy.body}
                footer={constructionCopy.footer}
                icon={constructionCopy.icon}
                title={constructionCopy.title}
              />
            ) : (
              <MapResults
                accentColor={mode.color}
                emptyMessage={emptyMessage}
                errorMessage={errorMessage}
                isLoading={isLoading}
                onPressFoodPlace={handlePressFoodPlace}
                onRetry={loadResults}
                results={filteredResults}
              />
            )}
          </FoodMap>
          <FloatingActionButtons
            accentColor={mode.color}
            isNearMeActive={isNearMeActive}
            isNearMeLoading={isNearMeLoading}
            onClearNearMe={handleClearNearMe}
            onPressNearMe={handlePressNearMe}
            onPressSaved={handleOpenSavedRestaurants}
          />
        </View>

        <ModeBar onSelectMode={handleSelectMode} selectedMode={selectedMode} />
      </View>

      <RestaurantDetailSheet
        accentColor={foodMode.color}
        onClose={handleCloseRestaurantDetail}
        place={selectedFoodPlace}
      />

      <SavedRestaurantsSheet
        accentColor={foodMode.color}
        isVisible={isSavedSheetOpen}
        onClose={handleCloseSavedRestaurants}
        onSelectPlace={handleSelectSavedRestaurant}
      />
    </SafeAreaView>
  );
}

function getEmptyMessage(mode: MactMode, searchQuery: string) {
  if (searchQuery.trim()) {
    return 'Try a different search term.';
  }

  if (mode === 'community') {
    return 'There are no upcoming community events yet.';
  }

  return `There are no active ${mode} places yet.`;
}

function getConstructionCopy(mode: MactMode) {
  if (mode === 'prayer') {
    return {
      icon: '🕌',
      title: 'Prayer spaces are coming soon',
      body: 'We are preparing mosque times, musallah details, and Jummah information for Canberra.',
      footer: 'Check back soon, in shaa Allah.',
    };
  }

  if (mode === 'community') {
    return {
      icon: '✨',
      title: 'Community events are coming soon',
      body: 'Soon you will be able to find Islamic lectures, youth events, classes, fundraisers, Ramadan programs, and Eid updates around Canberra.',
      footer: 'Check back soon, in shaa Allah.',
    };
  }

  return null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: 16,
  },
  header: {
    gap: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
  },
  title: {
    color: '#151922',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  mapShell: {
    flex: 1,
    position: 'relative',
  },
  notice: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  noticeText: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
});
