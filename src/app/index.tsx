import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActiveFoodFilters } from '@/components/home/ActiveFoodFilters';
import { CategoryChips, type FoodCategoryChip } from '@/components/home/CategoryChips';
import { FloatingActionButtons } from '@/components/home/FloatingActionButtons';
import { FoodFilterSheet } from '@/components/home/FoodFilterSheet';
import { FoodMap } from '@/components/home/FoodMap';
import { HomeSearchBar } from '@/components/home/HomeSearchBar';
import { MapResults, type HomeResult, type HomeResultSection } from '@/components/home/MapResults';
import { ModeBar } from '@/components/home/ModeBar';
import { NearMeRadiusControl } from '@/components/home/NearMeRadiusControl';
import { RestaurantDetailSheet } from '@/components/home/RestaurantDetailSheet';
import { SavedRestaurantsSheet } from '@/components/home/SavedRestaurantsSheet';
import { UnderConstructionCard } from '@/components/home/UnderConstructionCard';
import {
  EMPTY_FOOD_FILTERS,
  getActiveFoodFilters,
  type FoodFilterId,
  type FoodFilterState,
} from '@/components/home/foodFilters';
import { getModeConfig, MACT_MODES, type MactMode } from '@/components/home/mactModes';
import { useFoodPlaces } from '@/hooks/useFoodPlaces';
import { getSavedPlaceIds, toggleSavedPlace } from '@/lib/favourites';
import {
  getDistanceKm,
  isPlaceInsideBounds,
  type MapBounds,
  type MapViewport,
  type ReturnCameraView,
} from '@/lib/mapGeometry';
import type { Place } from '@/services/placesService';

const REQUEST_TIMEOUT_MS = 8000;
const MODE_SWITCHER_HEIGHT = 54;
const SHEET_MODE_SWITCHER_GAP = 10;
const DEFAULT_NEAR_ME_RADIUS_KM = 5;
const RETURN_VIEW_ZOOM_THRESHOLD = 15.2;
const MAP_FRAME_UPDATE_DEBOUNCE_MS = 400;

export default function HomeScreen() {
  const [selectedMode, setSelectedMode] = useState<MactMode>('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategoryChip>('All');
  const [foodFilters, setFoodFilters] = useState<FoodFilterState>(EMPTY_FOOD_FILTERS);
  const [nearMeMessage, setNearMeMessage] = useState<string | null>(null);
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [isBrowsingNearArea, setIsBrowsingNearArea] = useState(false);
  const [isNearMeLoading, setIsNearMeLoading] = useState(false);
  const [nearMeRadiusKm, setNearMeRadiusKm] = useState(DEFAULT_NEAR_ME_RADIUS_KM);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState(11);
  const [settledMapBounds, setSettledMapBounds] = useState<MapBounds | null>(null);
  const [settledMapCenter, setSettledMapCenter] = useState<[number, number] | null>(null);
  const [isUpdatingMapFrame, setIsUpdatingMapFrame] = useState(false);
  const [returnCameraView, setReturnCameraView] = useState<ReturnCameraView | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [selectedFoodPlace, setSelectedFoodPlace] = useState<Place | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSavedSheetOpen, setIsSavedSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [modeProgress] = useState(() => new Animated.Value(getModePosition('food')));
  const {
    errorMessage: foodErrorMessage,
    hasCachedData: hasCachedFoodData,
    isInitialLoading: isFoodInitialLoading,
    isRefreshing: isFoodRefreshing,
    places: foodPlaces,
    refreshFoodPlaces,
  } = useFoodPlaces();
  const insets = useSafeAreaInsets();
  const mode = useMemo(() => getModeConfig(selectedMode), [selectedMode]);
  const foodMode = useMemo(() => getModeConfig('food'), []);
  const isFoodMode = selectedMode === 'food';
  const mapFrameUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshSavedPlaceIds = useCallback(async () => {
    setSavedPlaceIds(await getSavedPlaceIds());
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refreshSavedPlaceIds);
  }, [refreshSavedPlaceIds]);

  useEffect(() => () => {
    if (mapFrameUpdateTimeoutRef.current) clearTimeout(mapFrameUpdateTimeoutRef.current);
  }, []);

  const restoreNormalFoodResults = useCallback(async () => {
    if (foodPlaces.length === 0) await refreshFoodPlaces();
  }, [foodPlaces.length, refreshFoodPlaces]);

  const handleClearNearMe = useCallback(async () => {
    setNearMeMessage(null);
    setIsNearMeActive(false);
    setIsBrowsingNearArea(false);
    setUserLocation(null);
    await restoreNormalFoodResults();
  }, [restoreNormalFoodResults]);

  const handleRefreshFoodData = useCallback(async () => {
    setNearMeMessage(null);
    const refreshedFoodPlaces = await refreshFoodPlaces();

    if (!isNearMeActive) {
      if (
        refreshedFoodPlaces &&
        selectedFoodPlace &&
        !refreshedFoodPlaces.some((place) => place.id === selectedFoodPlace.id)
      ) {
        setSelectedFoodPlace(null);
      }
      return;
    }

    if (!userLocation) {
      setIsNearMeActive(false);
      setIsBrowsingNearArea(false);
      return;
    }
  }, [isNearMeActive, refreshFoodPlaces, selectedFoodPlace, userLocation]);

  const handleSelectMode = useCallback((nextMode: MactMode) => {
    if (nextMode === selectedMode) return;

    const nextPosition = getModePosition(nextMode);

    Animated.timing(modeProgress, {
      toValue: nextPosition,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (nextMode !== 'food') {
      setIsSavedSheetOpen(false);
      setIsFilterSheetOpen(false);
      setSelectedFoodPlace(null);
      setIsSearchFocused(false);
      Keyboard.dismiss();
    }

    setSelectedMode(nextMode);
  }, [modeProgress, selectedMode]);

  const clearMapFrame = useCallback(() => {
    if (mapFrameUpdateTimeoutRef.current) {
      clearTimeout(mapFrameUpdateTimeoutRef.current);
      mapFrameUpdateTimeoutRef.current = null;
    }

    setSettledMapBounds(null);
    setSettledMapCenter(null);
    setIsUpdatingMapFrame(false);
  }, []);

  const scheduleMapFrameUpdate = useCallback((bounds: MapBounds | null, center: [number, number] | null) => {
    if (!isValidMapBounds(bounds) || !isValidMapCenter(center)) {
      setSettledMapBounds(null);
      setSettledMapCenter(null);
      setIsUpdatingMapFrame(false);
      return;
    }

    if (mapFrameUpdateTimeoutRef.current) clearTimeout(mapFrameUpdateTimeoutRef.current);

    setIsUpdatingMapFrame(true);
    mapFrameUpdateTimeoutRef.current = setTimeout(() => {
      setSettledMapBounds(bounds);
      setSettledMapCenter(center);
      setIsUpdatingMapFrame(false);
      mapFrameUpdateTimeoutRef.current = null;
    }, MAP_FRAME_UPDATE_DEBOUNCE_MS);
  }, []);

  const handleViewportChange = useCallback((viewport: MapViewport, isUserInteraction: boolean) => {
    setMapBounds(viewport.bounds);
    setMapCenter(viewport.centerCoordinate);
    setMapZoom(viewport.zoomLevel);

    if (isUserInteraction) {
      scheduleMapFrameUpdate(viewport.bounds, viewport.centerCoordinate);
      if (isNearMeActive) setIsBrowsingNearArea(true);
      return;
    }

    if (!settledMapBounds && isValidMapBounds(viewport.bounds) && isValidMapCenter(viewport.centerCoordinate)) {
      setSettledMapBounds(viewport.bounds);
      setSettledMapCenter(viewport.centerCoordinate);
    }
  }, [isNearMeActive, scheduleMapFrameUpdate, settledMapBounds]);

  const buildReturnCameraView = useCallback((): ReturnCameraView | null => {
    if (!mapCenter || mapZoom >= RETURN_VIEW_ZOOM_THRESHOLD) return null;

    return {
      bounds: mapBounds,
      centerCoordinate: mapCenter,
      reason: isNearMeActive ? 'near_me' : mapBounds ? 'area' : 'wide',
      zoomLevel: mapZoom,
    };
  }, [isNearMeActive, mapBounds, mapCenter, mapZoom]);

  const handlePressFoodPlace = useCallback((place: Place) => {
    Keyboard.dismiss();
    setIsSearchFocused(false);
    setReturnCameraView(buildReturnCameraView());
    setSelectedFoodPlace(place);
  }, [buildReturnCameraView]);

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
    clearMapFrame();
    setReturnCameraView(buildReturnCameraView());
    setSelectedFoodPlace(place);
  }, [buildReturnCameraView, clearMapFrame, isNearMeActive, restoreNormalFoodResults]);

  const handleMapInteraction = useCallback(() => {
    if (isNearMeActive) setIsBrowsingNearArea(true);
  }, [isNearMeActive]);

  const handleToggleMapExpanded = useCallback(() => {
    setIsMapExpanded((current) => !current);
  }, []);

  const handleCloseRestaurantSheet = useCallback(() => {
    setSelectedFoodPlace(null);
  }, []);

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

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setNearMeRadiusKm(DEFAULT_NEAR_ME_RADIUS_KM);
      clearMapFrame();
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
  }, [clearMapFrame, restoreNormalFoodResults]);

  const handleToggleSavedPlace = useCallback(async (placeId: string) => {
    const nextIsSaved = await toggleSavedPlace(placeId);

    setSavedPlaceIds((current) => {
      if (nextIsSaved) {
        return current.includes(placeId) ? current : [...current, placeId];
      }

      return current.filter((savedPlaceId) => savedPlaceId !== placeId);
    });
  }, []);

  const handleToggleFoodFilter = useCallback((filterId: FoodFilterId) => {
    setFoodFilters((current) => ({
      ...current,
      [filterId]: !current[filterId],
    }));
  }, []);

  const handleRemoveFoodFilter = useCallback((filterId: FoodFilterId) => {
    setFoodFilters((current) => ({
      ...current,
      [filterId]: false,
    }));
  }, []);

  const handleClearFoodFilters = useCallback(() => {
    setFoodFilters(EMPTY_FOOD_FILTERS);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isFoodMode && isSavedSheetOpen) {
        setIsSavedSheetOpen(false);
        return true;
      }

      if (isFoodMode && isFilterSheetOpen) {
        setIsFilterSheetOpen(false);
        return true;
      }

      if (isFoodMode && selectedFoodPlace) {
        handleCloseRestaurantSheet();
        return true;
      }

      if (isFoodMode && isSearchFocused) {
        Keyboard.dismiss();
        setIsSearchFocused(false);
        return true;
      }

      if (isFoodMode && isMapExpanded) {
        setIsMapExpanded(false);
        return true;
      }

      if (!isFoodMode) {
        handleSelectMode('food');
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [
    handleSelectMode,
    handleCloseRestaurantSheet,
    isFilterSheetOpen,
    isFoodMode,
    isMapExpanded,
    isSavedSheetOpen,
    isSearchFocused,
    selectedFoodPlace,
  ]);

  const query = searchQuery.trim().toLowerCase();
  const hasSearchQuery = query.length > 0;

  const currentSelectedFoodPlace = useMemo(() => {
    if (!selectedFoodPlace) return null;

    return (
      foodPlaces.find((place) => place.id === selectedFoodPlace.id) ?? selectedFoodPlace
    );
  }, [foodPlaces, selectedFoodPlace]);

  const visiblePlaces = useMemo(() => {
    const selectedCategoryQuery = selectedCategory === 'All' ? '' : selectedCategory.toLowerCase();
    const savedPlaceIdSet = new Set(savedPlaceIds);

    return foodPlaces
      .map((place) => {
        if (!isNearMeActive || !userLocation) return place;

        const distanceKm = getDistanceKm(userLocation, {
          latitude: place.latitude,
          longitude: place.longitude,
        });

        return { ...place, distance_meters: Math.round(distanceKm * 1000) };
      })
      .filter((place) => {
      const category = place.category.toLowerCase();
      const matchesCategory = !selectedCategoryQuery || category.includes(selectedCategoryQuery);
      const matchesQuery =
        !query ||
        [place.name, place.cuisine, place.suburb, place.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
      const matchesFilters = matchesFoodFilters(place, foodFilters, savedPlaceIdSet);

      if (!matchesCategory || !matchesQuery || !matchesFilters) return false;

      if (hasSearchQuery) return true;

      if (isNearMeActive && userLocation) {
        return (place.distance_meters ?? Number.POSITIVE_INFINITY) <= nearMeRadiusKm * 1000;
      }

      return true;
    })
      .sort((left, right) =>
        isNearMeActive
          ? (left.distance_meters ?? Number.POSITIVE_INFINITY) -
            (right.distance_meters ?? Number.POSITIVE_INFINITY)
          : 0
      );
  }, [
    foodFilters,
    foodPlaces,
    hasSearchQuery,
    isNearMeActive,
    nearMeRadiusKm,
    query,
    savedPlaceIds,
    selectedCategory,
    userLocation,
  ]);

  const mapFrameSections = useMemo(() => {
    if (!isValidMapBounds(settledMapBounds) || !isValidMapCenter(settledMapCenter)) {
      return null;
    }

    const inAreaPlaces: Place[] = [];
    const outsideAreaPlaces: Place[] = [];

    visiblePlaces.forEach((place) => {
      if (isPlaceInsideBounds(place, settledMapBounds)) {
        inAreaPlaces.push(place);
        return;
      }

      outsideAreaPlaces.push(place);
    });

    const sortedOutsideAreaPlaces = isNearMeActive
      ? outsideAreaPlaces
      : [...outsideAreaPlaces].sort(
          (left, right) =>
            getDistanceKm(
              { latitude: settledMapCenter[1], longitude: settledMapCenter[0] },
              { latitude: left.latitude, longitude: left.longitude }
            ) -
            getDistanceKm(
              { latitude: settledMapCenter[1], longitude: settledMapCenter[0] },
              { latitude: right.latitude, longitude: right.longitude }
            )
        );

    return {
      inAreaPlaces,
      outsideAreaPlaces: sortedOutsideAreaPlaces,
    };
  }, [isNearMeActive, settledMapBounds, settledMapCenter, visiblePlaces]);

  const displayPlaces = useMemo(
    () => mapFrameSections
      ? [...mapFrameSections.inAreaPlaces, ...mapFrameSections.outsideAreaPlaces]
      : visiblePlaces,
    [mapFrameSections, visiblePlaces]
  );

  const filteredResults = useMemo<HomeResult[]>(
    () => displayPlaces.map((item) => ({ kind: 'place', item })),
    [displayPlaces]
  );

  const resultSections = useMemo(() => {
    if (!mapFrameSections) return undefined;

    const sections: HomeResultSection[] = [];

    if (mapFrameSections.inAreaPlaces.length > 0) {
      sections.push({
        count: mapFrameSections.inAreaPlaces.length,
        key: 'in-area',
        results: mapFrameSections.inAreaPlaces.map((item) => ({ kind: 'place' as const, item })),
        title: 'In this area',
        variant: 'primary',
      });
    } else if (mapFrameSections.outsideAreaPlaces.length > 0) {
      sections.push({
        count: 0,
        emptyMessage: 'No places in this map area',
        key: 'empty-in-area',
        results: [],
        title: 'In this area',
        variant: 'primary',
      });
    }

    if (mapFrameSections.outsideAreaPlaces.length > 0) {
      sections.push({
        count: mapFrameSections.outsideAreaPlaces.length,
        key: 'outside-area',
        results: mapFrameSections.outsideAreaPlaces.map((item) => ({ kind: 'place' as const, item })),
        subtitle: isNearMeActive ? undefined : 'Closest places from the centre of the map',
        title: 'Nearby outside this area',
        variant: 'outside',
      });
    }

    return sections;
  }, [isNearMeActive, mapFrameSections]);

  const handleSelectMapPlace = useCallback((placeId: string) => {
    const result = filteredResults.find(
      (item) => item.kind === 'place' && item.item.id === placeId
    );
    if (result?.kind === 'place') handlePressFoodPlace(result.item);
  }, [filteredResults, handlePressFoodPlace]);

  const constructionCopy = getConstructionCopy(selectedMode);
  const activeFoodFilters = getActiveFoodFilters(foodFilters);
  const activeFilterCount = activeFoodFilters.filter((filter) => filter.id !== 'savedOnly').length;
  const hasActiveFoodFilters = activeFoodFilters.length > 0;
  const hasListNarrowingFilters =
    hasActiveFoodFilters || selectedCategory !== 'All';
  const placeCount = filteredResults.length;
  const placeNoun = placeCount === 1 ? 'place' : 'places';
  const listCountSuffix =
    isNearMeActive && !hasSearchQuery
      ? `${placeNoun} within ${nearMeRadiusKm} km`
      : hasListNarrowingFilters && !hasSearchQuery
        ? `${placeNoun} matching your filters`
        : foodFilters.savedOnly && !hasSearchQuery
          ? `saved ${placeNoun}`
          : `halal ${placeNoun}`;
  const emptyTitle =
    isNearMeActive && !hasSearchQuery
      ? `No places within ${nearMeRadiusKm} km`
      : 'No results found';
  const emptyMessage =
    isNearMeActive && !hasSearchQuery
      ? 'Try increasing the radius.'
      : searchQuery || selectedCategory !== 'All'
        ? 'Try another restaurant, cuisine, suburb, category, or filter.'
        : hasActiveFoodFilters
          ? 'No restaurants match those food filters yet.'
          : 'No halal restaurants are available yet.';
  const foodDataErrorMessage = foodErrorMessage && !hasCachedFoodData ? foodErrorMessage : null;
  const foodDataStatusMessage =
    !isNearMeActive && foodErrorMessage && hasCachedFoodData
      ? 'Showing cached halal food. Refresh failed.'
      : !isNearMeActive && isFoodRefreshing && hasCachedFoodData
        ? 'Refreshing halal food...'
        : null;
  const bottomPadding = insets.bottom + 8;
  const restaurantSheetBottomOffset = bottomPadding + MODE_SWITCHER_HEIGHT + SHEET_MODE_SWITCHER_GAP;
  const screenBackgroundColor = modeProgress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['#F4F7FF', '#FBF7F1', '#F4FBF5'],
  });

  return (
    <Animated.View style={[styles.screen, { backgroundColor: screenBackgroundColor }]}>
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
        <View style={styles.body}>
          {!isFoodMode || !isMapExpanded ? <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.brandRow}>
                <Text style={[styles.brand, { color: mode.color }]}>MACT</Text>
                <Text numberOfLines={1} style={styles.title}>
                  {isFoodMode ? 'Halal food in Canberra' : mode.title}
                </Text>
              </View>
              {isFoodMode ? <Text style={styles.sudoLabsBrand}>SudoLabs</Text> : null}
            </View>
            {isFoodMode ? (
              <>
                <HomeSearchBar
                  accentColor={foodMode.color}
                  onBlur={() => setIsSearchFocused(false)}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  value={searchQuery}
                />
                <CategoryChips
                  accentColor={foodMode.color}
                  onSelectCategory={setSelectedCategory}
                  selectedCategory={selectedCategory}
                />
                <ActiveFoodFilters
                  accentColor={foodMode.color}
                  filters={foodFilters}
                  onClearAll={handleClearFoodFilters}
                  onRemoveFilter={handleRemoveFoodFilter}
                />
              </>
            ) : null}
          </View> : null}

          <View style={styles.modePages}>
            <View
              pointerEvents={isFoodMode ? 'auto' : 'none'}
              style={[
                styles.modePage,
                styles.discovery,
                isFoodMode ? styles.activeModePage : styles.inactiveModePage,
              ]}
            >
              <FoodMap
                accentColor={foodMode.color}
                isExpanded={isMapExpanded}
                nearMeActive={isNearMeActive}
                nearMeRadiusKm={nearMeRadiusKm}
                onMapInteraction={handleMapInteraction}
                onReturnCameraViewRestored={() => setReturnCameraView(null)}
                onSelectPlace={handleSelectMapPlace}
                onToggleExpanded={handleToggleMapExpanded}
                onViewportChange={handleViewportChange}
                places={filteredResults}
                returnCameraView={currentSelectedFoodPlace ? null : returnCameraView}
                searchQuery={searchQuery}
                selectedPlace={currentSelectedFoodPlace}
                userLocation={userLocation}
              >
                {isNearMeActive ? (
                  <NearMeRadiusControl
                    accentColor={foodMode.color}
                    count={placeCount}
                    onChangeRadius={setNearMeRadiusKm}
                    radiusKm={nearMeRadiusKm}
                  />
                ) : null}
                {isNearMeActive || nearMeMessage || foodDataStatusMessage ? (
                  <View style={styles.notice}>
                    <Text style={styles.noticeText}>
                      {isNearMeActive
                        ? isBrowsingNearArea
                          ? 'Browsing map near your area'
                          : `Halal food within ${nearMeRadiusKm} km`
                        : nearMeMessage ?? foodDataStatusMessage}
                    </Text>
                    {isNearMeActive ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleClearNearMe}
                        style={({ pressed }) => pressed && styles.pressed}
                      >
                        <Text style={[styles.clearLabel, { color: foodMode.color }]}>Clear</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
                <MapResults
                  accentColor={foodMode.color}
                  contentBottomPadding={MODE_SWITCHER_HEIGHT + SHEET_MODE_SWITCHER_GAP + 18}
                  emptyMessage={emptyMessage}
                  emptyTitle={emptyTitle}
                  errorMessage={foodDataErrorMessage}
                  isCollapsedPreview={isMapExpanded}
                  isLoading={isFoodInitialLoading}
                  isRefreshing={isFoodRefreshing}
                  isUpdatingArea={isUpdatingMapFrame && !isMapExpanded}
                  listCount={placeCount}
                  listCountSuffix={listCountSuffix}
                  onPressFoodPlace={handlePressFoodPlace}
                  onRefresh={handleRefreshFoodData}
                  onRetry={refreshFoodPlaces}
                  onToggleSavedPlace={handleToggleSavedPlace}
                  results={filteredResults}
                  sections={resultSections}
                  savedPlaceIds={savedPlaceIds}
                  selectedPlaceId={currentSelectedFoodPlace?.id}
                />
              </FoodMap>

              {isMapExpanded && (isNearMeActive || nearMeMessage || foodDataStatusMessage) ? (
                <View style={styles.fullscreenNotice}>
                  <Text style={styles.noticeText}>
                    {isNearMeActive
                      ? isBrowsingNearArea
                        ? 'Browsing map near your area'
                        : `Halal food within ${nearMeRadiusKm} km`
                      : nearMeMessage ?? foodDataStatusMessage}
                  </Text>
                  {isNearMeActive ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={handleClearNearMe}
                      style={({ pressed }) => pressed && styles.pressed}
                    >
                      <Text style={[styles.clearLabel, { color: foodMode.color }]}>Clear Near Me</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {isMapExpanded && isNearMeActive ? (
                <View style={styles.fullscreenRadiusControl}>
                  <NearMeRadiusControl
                    accentColor={foodMode.color}
                    count={placeCount}
                    onChangeRadius={setNearMeRadiusKm}
                    radiusKm={nearMeRadiusKm}
                  />
                </View>
              ) : null}

              {!currentSelectedFoodPlace ? (
                <FloatingActionButtons
                  activeFilterCount={activeFilterCount}
                  accentColor={foodMode.color}
                  isNearMeActive={isNearMeActive}
                  isNearMeLoading={isNearMeLoading}
                  onPressFilter={() => setIsFilterSheetOpen(true)}
                  onPressNearMe={handlePressNearMe}
                  onPressSaved={() => setIsSavedSheetOpen(true)}
                />
              ) : null}

            </View>

            {constructionCopy ? (
              <View
                pointerEvents={isFoodMode ? 'none' : 'auto'}
                style={[
                  styles.modePage,
                  styles.construction,
                  isFoodMode ? styles.inactiveModePage : styles.activeModePage,
                ]}
              >
                <UnderConstructionCard
                  accentColor={mode.color}
                  body={constructionCopy.body}
                  footer={constructionCopy.footer}
                  icon={constructionCopy.icon}
                  title={constructionCopy.title}
                />
              </View>
            ) : null}
          </View>
        </View>

        <ModeBar onSelectMode={handleSelectMode} selectedMode={selectedMode} />
      </View>

      <RestaurantDetailSheet
        accentColor={foodMode.color}
        bottomOffset={restaurantSheetBottomOffset}
        isSaved={currentSelectedFoodPlace ? savedPlaceIds.includes(currentSelectedFoodPlace.id) : false}
        onClose={handleCloseRestaurantSheet}
        onSavedChange={refreshSavedPlaceIds}
        onToggleSavedPlace={handleToggleSavedPlace}
        place={isFoodMode ? currentSelectedFoodPlace : null}
      />
      <FoodFilterSheet
        accentColor={foodMode.color}
        filters={foodFilters}
        isVisible={isFoodMode && isFilterSheetOpen}
        onClearAll={handleClearFoodFilters}
        onClose={() => setIsFilterSheetOpen(false)}
        onToggleFilter={handleToggleFoodFilter}
      />
      <SavedRestaurantsSheet
        accentColor={foodMode.color}
        isLoadingPlaces={isFoodInitialLoading}
        isVisible={isFoodMode && isSavedSheetOpen}
        onClose={() => setIsSavedSheetOpen(false)}
        onSelectPlace={handleSelectSavedRestaurant}
        places={foodPlaces}
      />
    </Animated.View>
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

function isValidMapBounds(bounds: MapBounds | null): bounds is MapBounds {
  if (!bounds) return false;
  if (bounds.length !== 4) return false;

  const [west, south, east, north] = bounds;
  return (
    [west, south, east, north].every(Number.isFinite) &&
    west < east &&
    south < north
  );
}

function isValidMapCenter(center: [number, number] | null): center is [number, number] {
  return Boolean(center && center.length === 2 && center.every(Number.isFinite));
}

function matchesFoodFilters(
  place: Place,
  filters: FoodFilterState,
  savedPlaceIdSet: Set<string>
) {
  const details = place.food_details;

  if (filters.savedOnly && !savedPlaceIdSet.has(place.id)) return false;
  if (filters.halalCertified && details?.halal_certified !== true) return false;
  if (filters.handSlaughtered && details?.hand_slaughtered !== 'yes') return false;
  if (filters.noPork && details?.pork_status !== 'none_served') return false;
  if (filters.noAlcohol && details?.alcohol_status !== 'none_served') return false;
  if (filters.noCrossContaminationRisk && details?.cross_contamination_risk !== 'no') return false;
  if (filters.highConfidence && details?.confidence_level !== 'high') return false;
  if (filters.chickenAndBeefConfirmed && details?.halal_meat_coverage !== 'both') return false;

  return true;
}

function getModePosition(mode: MactMode) {
  return Math.max(0, MACT_MODES.findIndex((item) => item.id === mode));
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
  screen: { flex: 1, position: 'relative' },
  content: { flex: 1, gap: 8, zIndex: 0, elevation: 0 },
  body: { flex: 1, gap: 8, minHeight: 0 },
  header: { gap: 7 },
  headerTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 10, minWidth: 0 },
  brand: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  title: { flex: 1, color: '#222724', fontSize: 17, fontWeight: '800' },
  sudoLabsBrand: {
    color: '#7B6257',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  modePages: { flex: 1, minHeight: 0, position: 'relative' },
  modePage: {
    bottom: 0,
    left: 0,
    minHeight: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  activeModePage: { opacity: 1, zIndex: 2 },
  inactiveModePage: { opacity: 0, zIndex: 0 },
  discovery: { flex: 1, minHeight: 0 },
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
    zIndex: 50,
    elevation: 50,
  },
  fullscreenRadiusControl: {
    position: 'absolute',
    top: 116,
    left: 10,
    right: 10,
    zIndex: 50,
    elevation: 50,
  },
  noticeText: { flex: 1, color: '#513B33', fontSize: 13, fontWeight: '800' },
  clearLabel: { fontSize: 13, fontWeight: '900', paddingVertical: 4 },
  pressed: { opacity: 0.68 },
});
