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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { formatMarkerName, getFoodCategoryVisual } from '@/components/home/categoryVisuals';
import type { HomeResult } from '@/components/home/MapResults';
import { SymbolIconButton } from '@/components/home/SymbolIconButton';
import {
  getMarkerDisplayMode,
  getZoomForRadiusKm,
  type MapViewport,
  type ReturnCameraView,
} from '@/lib/mapGeometry';
import type { Place } from '@/services/placesService';

type RealFoodMapProps = {
  accentColor: string;
  places: HomeResult[];
  selectedPlace: Place | null;
  onSelectPlace: (placeId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  nearMeActive: boolean;
  isExpanded: boolean;
  nearMeRadiusKm: number;
  onToggleExpanded: () => void;
  onMapInteraction?: () => void;
  onReturnCameraViewRestored?: () => void;
  onViewportChange?: (viewport: MapViewport, isUserInteraction: boolean) => void;
  returnCameraView?: ReturnCameraView | null;
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
const SELECTED_ZOOM = 15.8;
const MAX_USER_ZOOM = 17;
const ZOOM_STATE_STEP = 0.15;
const FIT_PADDING = 48;
const SEARCH_FIT_PADDING = 64;
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
  places,
  selectedPlace,
  onSelectPlace,
  userLocation,
  nearMeActive,
  nearMeRadiusKm,
  isExpanded,
  onToggleExpanded,
  onMapInteraction,
  onReturnCameraViewRestored,
  onViewportChange,
  returnCameraView,
  searchQuery,
  children,
}: RealFoodMapProps) {
  const cameraRef = useRef<CameraRef>(null);
  const hasSetInitialCameraRef = useRef(false);
  const lastSelectedCameraKeyRef = useRef<string | null>(null);
  const lastNearMeCameraKeyRef = useRef<string | null>(null);
  const lastReturnCameraKeyRef = useRef<string | null>(null);
  const lastSearchCameraQueryRef = useRef<string | null>(null);
  const currentZoomRef = useRef(DEFAULT_ZOOM);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const { height: screenHeight } = useWindowDimensions();
  const splitMapHeight = Math.round(Math.min(280, Math.max(220, screenHeight * 0.32)));
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

  const fitPlaces = useCallback((placesToFit: Place[], padding: number, duration = 650) => {
    const longitudes = placesToFit.map((place) => place.longitude);
    const latitudes = placesToFit.map((place) => place.latitude);
    cameraRef.current?.fitBounds(
      [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)],
      {
        padding: { top: padding, right: padding, bottom: padding, left: padding },
        duration,
      }
    );
  }, []);

  const handleMapLoaded = useCallback(() => {
    setIsMapLoaded(true);
  }, []);

  useEffect(() => {
    if (!isMapLoaded || hasSetInitialCameraRef.current || foodPlaces.length === 0) return;

    hasSetInitialCameraRef.current = true;

    if (foodPlaces.length === 1) {
      cameraRef.current?.easeTo({
        center: [foodPlaces[0].longitude, foodPlaces[0].latitude],
        zoom: clampMapZoom(USER_ZOOM),
        duration: 0,
      });
      return;
    }

    fitPlaces(foodPlaces, FIT_PADDING, 0);
  }, [fitPlaces, foodPlaces, isMapLoaded]);

  useEffect(() => {
    if (!selectedPlace) {
      lastSelectedCameraKeyRef.current = null;
      return;
    }

    const cameraKey = `${selectedPlace.id}:${isExpanded ? 'expanded' : 'split'}`;
    if (lastSelectedCameraKeyRef.current === cameraKey) return;

    lastSelectedCameraKeyRef.current = cameraKey;
    cameraRef.current?.easeTo({
      center: [selectedPlace.longitude, selectedPlace.latitude],
      zoom: clampMapZoom(SELECTED_ZOOM),
      padding: {
        top: 30,
        right: 20,
        bottom: isExpanded ? Math.round(screenHeight * 0.46) : Math.round(splitMapHeight * 0.34),
        left: 20,
      },
      duration: 650,
    });
  }, [isExpanded, screenHeight, selectedPlace, splitMapHeight]);

  useEffect(() => {
    if (!nearMeActive || !userLocation) {
      lastNearMeCameraKeyRef.current = null;
      return;
    }

    const locationKey = `${userLocation.latitude.toFixed(5)}:${userLocation.longitude.toFixed(5)}:${nearMeRadiusKm}`;
    if (lastNearMeCameraKeyRef.current === locationKey) return;

    lastNearMeCameraKeyRef.current = locationKey;
    cameraRef.current?.easeTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: clampMapZoom(getZoomForRadiusKm(nearMeRadiusKm)),
      duration: 650,
    });
  }, [nearMeActive, nearMeRadiusKm, userLocation]);

  useEffect(() => {
    if (!returnCameraView) {
      lastReturnCameraKeyRef.current = null;
      return;
    }

    const cameraKey = `${returnCameraView.reason}:${returnCameraView.centerCoordinate.join(',')}:${returnCameraView.zoomLevel}`;
    if (lastReturnCameraKeyRef.current === cameraKey) return;

    lastReturnCameraKeyRef.current = cameraKey;
    cameraRef.current?.easeTo({
      center: returnCameraView.centerCoordinate,
      zoom: clampMapZoom(returnCameraView.zoomLevel),
      duration: 550,
    });
    onReturnCameraViewRestored?.();
  }, [onReturnCameraViewRestored, returnCameraView]);

  useEffect(() => {
    if (!normalizedSearchQuery) {
      lastSearchCameraQueryRef.current = null;
      return;
    }

    if (lastSearchCameraQueryRef.current === normalizedSearchQuery) return;

    lastSearchCameraQueryRef.current = normalizedSearchQuery;

    if (selectedPlace) return;

    if (foodPlaces.length === 1) {
      cameraRef.current?.easeTo({
        center: [foodPlaces[0].longitude, foodPlaces[0].latitude],
        zoom: clampMapZoom(USER_ZOOM),
        duration: 550,
      });
      return;
    }

    if (foodPlaces.length > 1) {
      fitPlaces(foodPlaces, SEARCH_FIT_PADDING);
    }
  }, [fitPlaces, foodPlaces, normalizedSearchQuery, selectedPlace]);

  const fitRestaurants = useCallback(() => {
    if (foodPlaces.length === 0) return;

    if (foodPlaces.length === 1) {
      cameraRef.current?.easeTo({
        center: [foodPlaces[0].longitude, foodPlaces[0].latitude],
        zoom: clampMapZoom(USER_ZOOM),
        duration: 550,
      });
      return;
    }

    fitPlaces(foodPlaces, FIT_PADDING);
  }, [fitPlaces, foodPlaces]);

  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      const nextZoom = event.nativeEvent.zoom;
      onViewportChange?.(
        {
          bounds: event.nativeEvent.bounds,
          centerCoordinate: event.nativeEvent.center,
          zoomLevel: clampMapZoom(nextZoom),
        },
        event.nativeEvent.userInteraction
      );

      if (Number.isFinite(nextZoom)) {
        if (nextZoom > MAX_USER_ZOOM + 0.05) {
          cameraRef.current?.zoomTo(MAX_USER_ZOOM, { duration: 120 });
        }

        const boundedZoom = clampMapZoom(nextZoom);
        if (shouldUpdateZoomState(currentZoomRef.current, boundedZoom)) {
          currentZoomRef.current = boundedZoom;
          setCurrentZoom(boundedZoom);
        }
      }

      if (event.nativeEvent.userInteraction) onMapInteraction?.();
    },
    [onMapInteraction, onViewportChange]
  );

  return (
    <View style={styles.container}>
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
          <Camera
            ref={cameraRef}
            initialViewState={INITIAL_VIEW_STATE}
            maxZoom={MAX_USER_ZOOM}
          />

          {/* TODO: Add zoom-aware sizing when native view markers expose stable zoom styling. */}
          {foodPlaces.map((place) => (
            <RestaurantMarker
              isSelected={selectedPlace?.id === place.id}
              key={place.id}
              onSelectPlace={onSelectPlace}
              place={place}
              displayMode={getMarkerDisplayMode(currentZoom)}
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

        {!selectedPlace ? (
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
        ) : null}
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
  displayMode,
  isSelected,
  onSelectPlace,
  place,
}: {
  displayMode: ReturnType<typeof getMarkerDisplayMode>;
  isSelected: boolean;
  onSelectPlace: (placeId: string) => void;
  place: Place;
}) {
  const categoryVisual = getFoodCategoryVisual(place.category);
  const shouldShowName = isSelected || displayMode === 'label';
  const shouldShowDot = !isSelected && displayMode === 'dot';
  const label = shouldShowName ? formatMarkerName(place.name) : categoryVisual.pinLabel;
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
          shouldShowDot
            ? styles.restaurantDotMarker
            : shouldShowName
              ? styles.restaurantNameMarker
              : styles.restaurantInitialMarker,
          { backgroundColor: categoryVisual.color },
          isSelected && styles.selectedRestaurantMarker,
        ]}
      >
        {shouldShowDot ? null : (
          <Text
            numberOfLines={1}
            style={[styles.restaurantMarkerLabel, isSelected && styles.selectedMarkerLabel]}
          >
            {label}
          </Text>
        )}
      </View>
    </Marker>
  );
});

function clampMapZoom(zoom: number) {
  return Math.min(MAX_USER_ZOOM, zoom);
}

function shouldUpdateZoomState(previousZoom: number, nextZoom: number) {
  if (Math.abs(previousZoom - nextZoom) >= ZOOM_STATE_STEP) return true;

  return (
    getMarkerDisplayMode(previousZoom) !== getMarkerDisplayMode(nextZoom)
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 10 },
  mapWrapper: {
    minHeight: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E7ECE8',
  },
  expandedMapWrapper: { flex: 1, height: undefined, borderRadius: 12 },
  map: { flex: 1 },
  mapTint: {
    backgroundColor: 'rgba(255, 249, 240, 0.06)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  restaurantMarker: {
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 5,
  },
  restaurantDotMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  restaurantInitialMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
  },
  restaurantNameMarker: {
    minWidth: 58,
    maxWidth: 150,
    minHeight: 34,
    borderRadius: 18,
    borderWidth: 3,
    paddingHorizontal: 10,
  },
  selectedRestaurantMarker: {
    borderWidth: 4,
    transform: [{ scale: 1.08 }],
    elevation: 8,
  },
  restaurantMarkerLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  selectedMarkerLabel: { fontSize: 14 },
  mapActions: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
    zIndex: 50,
    elevation: 50,
  },
  children: { flex: 1, minHeight: 0 },
});
