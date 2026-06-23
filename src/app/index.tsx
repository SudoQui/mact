import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChips, type FoodCategoryChip } from '@/components/home/CategoryChips';
import { FloatingActionButtons } from '@/components/home/FloatingActionButtons';
import { FoodMap } from '@/components/home/FoodMap';
import { HomeSearchBar } from '@/components/home/HomeSearchBar';
import { MapResults, type HomeResult } from '@/components/home/MapResults';
import { ModeBar } from '@/components/home/ModeBar';
import { RestaurantDetailSheet } from '@/components/home/RestaurantDetailSheet';
import { SavedRestaurantsSheet } from '@/components/home/SavedRestaurantsSheet';
import { UnderConstructionCard } from '@/components/home/UnderConstructionCard';
import { getModeConfig, type MactMode } from '@/components/home/mactModes';
import { getSavedPlaceIds, toggleSavedPlace } from '@/lib/favourites';
import { getNearbyPlaces, getPlacesByMode, type Place } from '@/services/placesService';

const NEARBY_RADIUS_METERS = 10000;
const REQUEST_TIMEOUT_MS = 8000;

export default function HomeScreen() {
  const [selectedMode, setSelectedMode] = useState<MactMode>('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategoryChip>('All');
  const [results, setResults] = useState<HomeResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nearMeMessage, setNearMeMessage] = useState<string | null>(null);
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [isBrowsingNearArea, setIsBrowsingNearArea] = useState(false);
  const [isNearMeLoading, setIsNearMeLoading] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [selectedFoodPlace, setSelectedFoodPlace] = useState<Place | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSavedSheetOpen, setIsSavedSheetOpen] = useState(false);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const mode = useMemo(() => getModeConfig(selectedMode), [selectedMode]);
  const foodMode = useMemo(() => getModeConfig('food'), []);

  const loadResults = useCallback(async () => {
    if (selectedMode !== 'food') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setNearMeMessage(null);
      setIsNearMeActive(false);
      setIsBrowsingNearArea(false);
      setUserLocation(null);
      const places = await withTimeout(getPlacesByMode('food'));
      setResults(places.map((item) => ({ kind: 'place', item })));
    } catch {
      setResults([]);
      setErrorMessage('Could not load halal food places.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMode]);

  useEffect(() => {
    void Promise.resolve().then(loadResults);
  }, [loadResults]);

  const refreshSavedPlaceIds = useCallback(async () => {
    setSavedPlaceIds(await getSavedPlaceIds());
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refreshSavedPlaceIds);
  }, [refreshSavedPlaceIds]);

  const restoreNormalFoodResults = useCallback(async () => {
    try {
      const places = await withTimeout(getPlacesByMode('food'));
      setResults(places.map((item) => ({ kind: 'place', item })));
      setErrorMessage(null);
    } catch {
      setResults([]);
      setErrorMessage('Could not load halal food places.');
    }
  }, []);

  const handleClearNearMe = useCallback(async () => {
    setNearMeMessage(null);
    setIsNearMeActive(false);
    setIsBrowsingNearArea(false);
    setUserLocation(null);
    await restoreNormalFoodResults();
  }, [restoreNormalFoodResults]);

  const handleSelectMode = useCallback((nextMode: MactMode) => {
    setSelectedMode(nextMode);
    setSelectedFoodPlace(null);
    setNearMeMessage(null);
    setIsNearMeActive(false);
    setIsBrowsingNearArea(false);
    setUserLocation(null);
    setIsMapExpanded(false);
    if (nextMode !== 'food') setSelectedCategory('All');
  }, []);

  const handlePressFoodPlace = useCallback((place: Place) => {
    setSelectedFoodPlace(place);
  }, []);

  const handleSelectSavedRestaurant = useCallback(async (place: Place) => {
    setIsSavedSheetOpen(false);
    setSearchQuery('');
    setSelectedCategory('All');
    if (isNearMeActive) {
      setIsNearMeActive(false);
      setIsBrowsingNearArea(false);
      setUserLocation(null);
      await restoreNormalFoodResults();
    }
    setSelectedFoodPlace(place);
  }, [isNearMeActive, restoreNormalFoodResults]);

  const handleMapInteraction = useCallback(() => {
    if (isNearMeActive) setIsBrowsingNearArea(true);
  }, [isNearMeActive]);

  const handlePressNearMe = useCallback(async () => {
    try {
      setIsNearMeLoading(true);
      setNearMeMessage(null);

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        await restoreNormalFoodResults();
        setIsNearMeActive(false);
        setIsBrowsingNearArea(false);
        setUserLocation(null);
        setNearMeMessage('Location permission was not granted. Canberra restaurants are still here.');
        return;
      }

      const location = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      );
      const nearbyPlaces = await withTimeout(
        getNearbyPlaces(
          location.coords.latitude,
          location.coords.longitude,
          'food',
          NEARBY_RADIUS_METERS
        )
      );
      const sortedPlaces = [...nearbyPlaces].sort(
        (left, right) => (left.distance_meters ?? 0) - (right.distance_meters ?? 0)
      );

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setResults(sortedPlaces.map((item) => ({ kind: 'place', item })));
      setErrorMessage(null);
      setIsNearMeActive(true);
      setIsBrowsingNearArea(false);
    } catch {
      await restoreNormalFoodResults();
      setIsNearMeActive(false);
      setIsBrowsingNearArea(false);
      setUserLocation(null);
      setNearMeMessage('We could not get your location. Canberra restaurants are still here.');
    } finally {
      setIsNearMeLoading(false);
    }
  }, [restoreNormalFoodResults]);

  const handleToggleSavedPlace = useCallback(async (placeId: string) => {
    const nextIsSaved = await toggleSavedPlace(placeId);

    setSavedPlaceIds((current) => {
      if (nextIsSaved) {
        return current.includes(placeId) ? current : [...current, placeId];
      }

      return current.filter((savedPlaceId) => savedPlaceId !== placeId);
    });
  }, []);

  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const selectedCategoryQuery = selectedCategory === 'All' ? '' : selectedCategory.toLowerCase();

    return results.filter((result) => {
      if (result.kind !== 'place') return false;

      const category = result.item.category.toLowerCase();
      const matchesCategory = !selectedCategoryQuery || category.includes(selectedCategoryQuery);
      const matchesQuery =
        !query ||
        [result.item.name, result.item.cuisine, result.item.suburb, result.item.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [results, searchQuery, selectedCategory]);

  const constructionCopy = getConstructionCopy(selectedMode);
  const bottomPadding = insets.bottom + 8;

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: bottomPadding,
            paddingLeft: Math.max(insets.left, 14),
            paddingRight: Math.max(insets.right, 14),
          },
        ]}
      >
        {selectedMode !== 'food' || !isMapExpanded ? <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={[styles.brand, { color: mode.color }]}>MACT</Text>
            <Text numberOfLines={1} style={styles.title}>
              {selectedMode === 'food' ? 'Halal food in Canberra' : mode.title}
            </Text>
          </View>
          {selectedMode === 'food' ? (
            <>
              <HomeSearchBar
                accentColor={mode.color}
                onChangeText={setSearchQuery}
                value={searchQuery}
              />
              <CategoryChips
                accentColor={mode.color}
                onSelectCategory={setSelectedCategory}
                selectedCategory={selectedCategory}
              />
            </>
          ) : null}
        </View> : null}

        {selectedMode === 'food' ? (
          <View style={styles.discovery}>
            <FoodMap
              accentColor={mode.color}
              isExpanded={isMapExpanded}
              nearMeActive={isNearMeActive}
              onMapInteraction={handleMapInteraction}
              onSelectPlace={(placeId) => {
                const result = filteredResults.find(
                  (item) => item.kind === 'place' && item.item.id === placeId
                );
                if (result?.kind === 'place') handlePressFoodPlace(result.item);
              }}
              onToggleExpanded={() => setIsMapExpanded((current) => !current)}
              places={filteredResults}
              selectedPlace={selectedFoodPlace}
              userLocation={userLocation}
            >
              {isNearMeActive || nearMeMessage ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>
                    {isNearMeActive
                      ? isBrowsingNearArea
                        ? 'Browsing map near your area'
                        : 'Halal food within 10 km'
                      : nearMeMessage}
                  </Text>
                  {isNearMeActive ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={handleClearNearMe}
                      style={({ pressed }) => pressed && styles.pressed}
                    >
                      <Text style={[styles.clearLabel, { color: mode.color }]}>Clear</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              <MapResults
                accentColor={mode.color}
                emptyMessage={
                  searchQuery || selectedCategory !== 'All'
                    ? 'Try another restaurant, cuisine, suburb, or category.'
                    : 'No halal restaurants are available yet.'
                }
                errorMessage={errorMessage}
                isCollapsedPreview={isMapExpanded}
                isLoading={isLoading}
                onPressFoodPlace={handlePressFoodPlace}
                onRetry={loadResults}
                onToggleSavedPlace={handleToggleSavedPlace}
                results={filteredResults}
                savedPlaceIds={savedPlaceIds}
                selectedPlaceId={selectedFoodPlace?.id}
              />
            </FoodMap>

            {isMapExpanded && (isNearMeActive || nearMeMessage) ? (
              <View style={styles.fullscreenNotice}>
                <Text style={styles.noticeText}>
                  {isNearMeActive
                    ? isBrowsingNearArea
                      ? 'Browsing map near your area'
                      : 'Halal food within 10 km'
                    : nearMeMessage}
                </Text>
                {isNearMeActive ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleClearNearMe}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <Text style={[styles.clearLabel, { color: mode.color }]}>Clear Near Me</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {!selectedFoodPlace ? (
              <FloatingActionButtons
                accentColor={mode.color}
                isNearMeActive={isNearMeActive}
                isNearMeLoading={isNearMeLoading}
                onPressNearMe={handlePressNearMe}
                onPressSaved={() => setIsSavedSheetOpen(true)}
              />
            ) : null}
          </View>
        ) : constructionCopy ? (
          <View style={styles.construction}>
            <UnderConstructionCard
              accentColor={mode.color}
              body={constructionCopy.body}
              footer={constructionCopy.footer}
              icon={constructionCopy.icon}
              title={constructionCopy.title}
            />
          </View>
        ) : null}

        <ModeBar onSelectMode={handleSelectMode} selectedMode={selectedMode} />
      </View>

      <RestaurantDetailSheet
        accentColor={foodMode.color}
        isSaved={selectedFoodPlace ? savedPlaceIds.includes(selectedFoodPlace.id) : false}
        onClose={() => {
          setSelectedFoodPlace(null);
          setIsMapExpanded(false);
        }}
        onSavedChange={refreshSavedPlaceIds}
        onToggleSavedPlace={handleToggleSavedPlace}
        place={selectedFoodPlace}
      />
      <SavedRestaurantsSheet
        accentColor={foodMode.color}
        isVisible={isSavedSheetOpen}
        onClose={() => setIsSavedSheetOpen(false)}
        onSelectPlace={handleSelectSavedRestaurant}
      />
    </View>
  );
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('Request timed out')), REQUEST_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
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
      body: 'Lectures, youth events, classes, fundraisers, Ramadan programs, and Eid updates are on the way.',
      footer: 'Check back soon, in shaa Allah.',
    };
  }
  return null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBF7F1' },
  content: { flex: 1, gap: 10 },
  header: { gap: 7 },
  brandRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  brand: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  title: { flex: 1, color: '#222724', fontSize: 17, fontWeight: '800' },
  discovery: { flex: 1, minHeight: 0, position: 'relative' },
  construction: { flex: 1, minHeight: 0 },
  notice: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#FFF0E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  fullscreenNotice: {
    position: 'absolute',
    top: 66,
    left: 10,
    right: 10,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 240, 232, 0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 4,
  },
  noticeText: { flex: 1, color: '#513B33', fontSize: 13, fontWeight: '800' },
  clearLabel: { fontSize: 13, fontWeight: '900', paddingVertical: 4 },
  pressed: { opacity: 0.68 },
});
