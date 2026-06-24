import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type StyleSpecification,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import { memo, type ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { HomeResult } from '@/components/home/MapResults';
import { SymbolIconButton } from '@/components/home/SymbolIconButton';
import type { Place } from '@/services/placesService';

type RealFoodMapProps = {
  accentColor: string;
  places: HomeResult[];
  selectedPlace: Place | null;
  onSelectPlace: (placeId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  nearMeActive: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onMapInteraction?: () => void;
  searchQuery: string;
  children?: ReactNode;
};

// TODO: Replace this development-only OSM raster source with a production tile provider.
const DEVELOPMENT_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};
const CANBERRA_CENTER: [number, number] = [149.13, -35.2809];
const DEFAULT_ZOOM = 11;
const USER_ZOOM = 13;
const SELECTED_ZOOM = 14;
const FIT_PADDING = 48;
const INITIAL_VIEW_STATE = { center: CANBERRA_CENTER, zoom: DEFAULT_ZOOM };
const ATTRIBUTION_POSITION = { bottom: 8, left: 8 } as const;
const COMPASS_POSITION = { top: 12, left: 12 } as const;
const USER_LOCATION_HALO_STYLE = {
  circleColor: '#2878D0',
  circleOpacity: 0.2,
  circleRadius: 15,
} as const;
const USER_LOCATION_DOT_STYLE = {
  circleColor: '#2878D0',
  circleRadius: 6,
  circleStrokeColor: '#FFFFFF',
  circleStrokeWidth: 2,
} as const;

export const RealFoodMap = memo(function RealFoodMap({
  accentColor,
  places,
  selectedPlace,
  onSelectPlace,
  userLocation,
  nearMeActive,
  isExpanded,
  onToggleExpanded,
  onMapInteraction,
  searchQuery,
  children,
}: RealFoodMapProps) {
  const cameraRef = useRef<CameraRef>(null);
  const hasSetInitialCameraRef = useRef(false);
  const lastSelectedPlaceIdRef = useRef<string | null>(null);
  const lastNearMeCameraKeyRef = useRef<string | null>(null);
  const lastSearchCameraQueryRef = useRef<string | null>(null);
  const { height: screenHeight } = useWindowDimensions();
  const splitMapHeight = Math.round(screenHeight * 0.4);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const foodPlaces = useMemo(
    () =>
      places
        .filter((result): result is Extract<HomeResult, { kind: 'place' }> => result.kind === 'place')
        .map((result) => result.item)
        .filter(
          (place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude)
        ),
    [places]
  );

  const userGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: 'FeatureCollection',
      features: userLocation
        ? [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [userLocation.longitude, userLocation.latitude],
              },
              properties: {},
            },
          ]
        : [],
    }),
    [userLocation]
  );

  const handleMapLoaded = useCallback(() => {
    if (hasSetInitialCameraRef.current) return;

    hasSetInitialCameraRef.current = true;
    cameraRef.current?.easeTo({ center: CANBERRA_CENTER, zoom: DEFAULT_ZOOM, duration: 0 });
  }, []);

  useEffect(() => {
    if (!selectedPlace) {
      lastSelectedPlaceIdRef.current = null;
      return;
    }

    if (lastSelectedPlaceIdRef.current === selectedPlace.id) return;

    lastSelectedPlaceIdRef.current = selectedPlace.id;
    cameraRef.current?.easeTo({
      center: [selectedPlace.longitude, selectedPlace.latitude],
      zoom: SELECTED_ZOOM,
      padding: {
        top: 30,
        right: 20,
        bottom: isExpanded ? Math.round(screenHeight * 0.45) : 110,
        left: 20,
      },
      duration: 650,
    });
  }, [isExpanded, screenHeight, selectedPlace]);

  useEffect(() => {
    if (!nearMeActive || !userLocation) {
      lastNearMeCameraKeyRef.current = null;
      return;
    }

    const locationKey = `${userLocation.latitude.toFixed(5)}:${userLocation.longitude.toFixed(5)}`;
    if (lastNearMeCameraKeyRef.current === locationKey) return;

    lastNearMeCameraKeyRef.current = locationKey;
    cameraRef.current?.easeTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: USER_ZOOM,
      duration: 650,
    });
  }, [nearMeActive, userLocation]);

  useEffect(() => {
    if (!normalizedSearchQuery) {
      lastSearchCameraQueryRef.current = null;
      return;
    }

    if (selectedPlace || foodPlaces.length !== 1) return;
    if (lastSearchCameraQueryRef.current === normalizedSearchQuery) return;

    lastSearchCameraQueryRef.current = normalizedSearchQuery;
    cameraRef.current?.easeTo({
      center: [foodPlaces[0].longitude, foodPlaces[0].latitude],
      zoom: USER_ZOOM,
      duration: 550,
    });
  }, [foodPlaces, normalizedSearchQuery, selectedPlace]);

  const fitRestaurants = useCallback(() => {
    if (foodPlaces.length === 0) return;

    if (foodPlaces.length === 1) {
      cameraRef.current?.easeTo({
        center: [foodPlaces[0].longitude, foodPlaces[0].latitude],
        zoom: USER_ZOOM,
        duration: 550,
      });
      return;
    }

    const longitudes = foodPlaces.map((place) => place.longitude);
    const latitudes = foodPlaces.map((place) => place.latitude);
    cameraRef.current?.fitBounds(
      [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)],
      {
        padding: { top: FIT_PADDING, right: FIT_PADDING, bottom: FIT_PADDING, left: FIT_PADDING },
        duration: 650,
      }
    );
  }, [foodPlaces]);

  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      if (event.nativeEvent.userInteraction) onMapInteraction?.();
    },
    [onMapInteraction]
  );

  return (
    <View style={styles.container}>
      {/* TODO: Add a safer fullscreen transition after native map layout is stable across devices. */}
      <View
        style={[
          styles.mapWrapper,
          isExpanded ? styles.expandedMapWrapper : { height: splitMapHeight },
        ]}>
        <Map
          attribution
          attributionPosition={ATTRIBUTION_POSITION}
          compass
          compassPosition={COMPASS_POSITION}
          logo={false}
          mapStyle={DEVELOPMENT_RASTER_STYLE}
          onDidFinishLoadingMap={handleMapLoaded}
          onRegionDidChange={handleRegionDidChange}
          style={styles.map}
        >
          <Camera ref={cameraRef} initialViewState={INITIAL_VIEW_STATE} />

          {/* TODO: Add zoom-aware sizing when native view markers expose stable zoom styling. */}
          {foodPlaces.map((place) => (
            <RestaurantMarker
              accentColor={accentColor}
              isSelected={selectedPlace?.id === place.id}
              key={place.id}
              onSelectPlace={onSelectPlace}
              place={place}
            />
          ))}

          <GeoJSONSource data={userGeoJson} id="mact-user-location">
            <Layer
              id="mact-user-location-halo"
              type="circle"
              style={USER_LOCATION_HALO_STYLE}
            />
            <Layer
              id="mact-user-location-dot"
              type="circle"
              style={USER_LOCATION_DOT_STYLE}
            />
          </GeoJSONSource>
        </Map>

        {/* TODO: Replace this tint and raster basemap with a cleaner production vector style. */}
        <View pointerEvents="none" style={styles.mapTint} />

        <View style={styles.mapActions}>
          <SymbolIconButton
            accessibilityLabel="Fit visible restaurants"
            backgroundColor="#FFFFFF"
            color="#2A302D"
            fallback="⌖"
            name={{ ios: 'scope', android: 'fit_screen', web: 'fit_screen' }}
            onPress={fitRestaurants}
            size={21}
          />
          <SymbolIconButton
            accessibilityLabel={isExpanded ? 'Collapse map' : 'Expand map'}
            backgroundColor="#FFFFFF"
            color="#2A302D"
            fallback={isExpanded ? '↙' : '↗'}
            name={
              isExpanded
                ? {
                    ios: 'arrow.down.right.and.arrow.up.left',
                    android: 'fullscreen_exit',
                    web: 'fullscreen_exit',
                  }
                : {
                    ios: 'arrow.up.left.and.arrow.down.right',
                    android: 'fullscreen',
                    web: 'fullscreen',
                  }
            }
            onPress={onToggleExpanded}
            size={21}
          />
        </View>
      </View>

      {!isExpanded ? (
        <View style={styles.children}>
          {children}
        </View>
      ) : null}
    </View>
  );
});

const RestaurantMarker = memo(function RestaurantMarker({
  accentColor,
  isSelected,
  onSelectPlace,
  place,
}: {
  accentColor: string;
  isSelected: boolean;
  onSelectPlace: (placeId: string) => void;
  place: Place;
}) {
  const handlePress = useCallback(() => {
    onSelectPlace(place.id);
  }, [onSelectPlace, place.id]);

  return (
    <Marker
      anchor="center"
      id={place.id}
      lngLat={[place.longitude, place.latitude]}
      onPress={handlePress}
    >
      <View
        accessibilityLabel={`${place.name}, ${place.category}`}
        accessibilityRole="button"
        style={[
          styles.restaurantMarker,
          { backgroundColor: accentColor },
          isSelected && styles.selectedRestaurantMarker,
        ]}
      >
        <Text style={[styles.restaurantMarkerLabel, isSelected && styles.selectedMarkerLabel]}>
          {getCategoryPinLabel(place.category)}
        </Text>
      </View>
    </Marker>
  );
});

function getCategoryPinLabel(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes('cafe') || normalized.includes('coffee')) return 'C';
  if (normalized.includes('butcher')) return 'B';
  if (normalized.includes('grocery') || normalized.includes('grocer')) return 'G';
  if (normalized.includes('dessert') || normalized.includes('sweet')) return 'D';
  return 'R';
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 10 },
  mapWrapper: {
    minHeight: 240,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E7ECE8',
  },
  expandedMapWrapper: { flex: 1, height: undefined },
  map: { flex: 1 },
  mapTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 249, 240, 0.06)',
  },
  restaurantMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  selectedRestaurantMarker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 4,
    backgroundColor: '#A92F1A',
    elevation: 8,
  },
  restaurantMarkerLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  selectedMarkerLabel: { fontSize: 17 },
  mapActions: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  children: { flex: 1, minHeight: 0 },
});
