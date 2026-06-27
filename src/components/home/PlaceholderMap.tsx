import type { HomeResult } from '@/components/home/MapResults';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SymbolIconButton } from '@/components/home/SymbolIconButton';
import type { Place } from '@/services/placesService';

type PlaceholderMapProps = {
  accentColor: string;
  children: ReactNode;
  results?: HomeResult[];
  selectedPlace?: Place | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onPressPlace?: (placeId: string) => void;
  onMapDrag?: () => void;
  onResetView?: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
};

const CANBERRA_BOUNDS = {
  northLat: -35.1,
  southLat: -35.7,
  westLng: 148.6,
  eastLng: 149.6,
};

const DEFAULT_SCALE = 1.4;
const MIN_SCALE = 0.8;
const MAX_SCALE = 3.0;
const ZOOM_STEP = 1.2;
const FIT_PADDING = 0.14;

function normalizePoint(lat: number, lng: number) {
  const { northLat, southLat, westLng, eastLng } = CANBERRA_BOUNDS;
  return {
    x: Math.max(0, Math.min(1, (lng - westLng) / (eastLng - westLng))),
    y: Math.max(0, Math.min(1, (northLat - lat) / (northLat - southLat))),
  };
}

export function PlaceholderMap({
  accentColor,
  children,
  results = [],
  selectedPlace,
  userLocation,
  onPressPlace,
  onMapDrag,
  onResetView,
  isExpanded = false,
  onToggleExpanded,
}: PlaceholderMapProps) {
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  const placePoints = useMemo(
    () =>
      results
        .filter((item): item is Extract<HomeResult, { kind: 'place' }> => item.kind === 'place')
        .map((result) => ({
          id: result.item.id,
          category: result.item.category,
          isSelected: selectedPlace?.id === result.item.id,
          point: normalizePoint(result.item.latitude, result.item.longitude),
        })),
    [results, selectedPlace?.id]
  );

  const userPoint = useMemo(
    () => userLocation ? normalizePoint(userLocation.latitude, userLocation.longitude) : null,
    [userLocation]
  );

  const applyZoom = (nextScale: number) => {
    if (!layout.width || !layout.height) {
      setScale(nextScale);
      return;
    }

    const centerX = (layout.width / 2 - translateX) / scale;
    const centerY = (layout.height / 2 - translateY) / scale;

    setScale(nextScale);
    setTranslateX(layout.width / 2 - centerX * nextScale);
    setTranslateY(layout.height / 2 - centerY * nextScale);
  };

  const zoomIn = () => applyZoom(Math.min(MAX_SCALE, scale * ZOOM_STEP));
  const zoomOut = () => applyZoom(Math.max(MIN_SCALE, scale / ZOOM_STEP));

  const resetView = () => {
    setScale(DEFAULT_SCALE);
    setTranslateX(0);
    setTranslateY(0);
    onResetView?.();
  };

  const fitRestaurants = () => {
    if (!layout.width || !layout.height || placePoints.length === 0) {
      return;
    }

    const xs = placePoints.map((item) => item.point.x);
    const ys = placePoints.map((item) => item.point.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = Math.max(0.02, maxX - minX);
    const rangeY = Math.max(0.02, maxY - minY);
    const targetScale = Math.min(
      MAX_SCALE,
      Math.max(
        MIN_SCALE,
        Math.min(1 / (rangeX + FIT_PADDING * 2), 1 / (rangeY + FIT_PADDING * 2))
      )
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setScale(targetScale);
    setTranslateX(layout.width / 2 - centerX * targetScale * layout.width);
    setTranslateY(layout.height / 2 - centerY * targetScale * layout.height);
  };

  const handleResponderGrant = (event: any) => {
    dragOriginRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };
    dragOffsetRef.current = { x: translateX, y: translateY };
    hasDraggedRef.current = false;
  };

  const handleResponderMove = (event: any) => {
    if (!dragOriginRef.current) {
      return;
    }

    const dx = event.nativeEvent.pageX - dragOriginRef.current.x;
    const dy = event.nativeEvent.pageY - dragOriginRef.current.y;

    setTranslateX(dragOffsetRef.current.x + dx);
    setTranslateY(dragOffsetRef.current.y + dy);

    if (!hasDraggedRef.current) {
      hasDraggedRef.current = true;
      onMapDrag?.();
    }
  };

  const handleResponderRelease = () => {
    dragOriginRef.current = null;
    hasDraggedRef.current = false;
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.mapArea}
        onLayout={(event) => setLayout(event.nativeEvent.layout)}>
        <View
          style={[
            styles.mapContent,
            { pointerEvents: 'box-none', transform: [{ translateX }, { translateY }, { scale }] },
          ]}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleResponderGrant}
          onResponderMove={handleResponderMove}
          onResponderRelease={handleResponderRelease}
          onResponderTerminate={handleResponderRelease}>
          <View style={styles.gridOverlay} />
          <View style={styles.lake} />
          <View style={styles.parkCentral} />
          <View style={styles.parkNorth} />
          <View style={styles.parkEast} />
          <View style={styles.parkWest} />
          <View style={styles.roadH1} />
          <View style={styles.roadV1} />

          {placePoints.map((place) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              onPress={() => onPressPlace?.(place.id)}
              style={[
                styles.pin,
                place.isSelected && styles.selectedPin,
                {
                  backgroundColor: accentColor,
                  left: `${Math.max(2, Math.min(98, place.point.x * 100))}%`,
                  top: `${Math.max(2, Math.min(98, place.point.y * 100))}%`,
                },
              ]}>
              <Text style={[styles.pinLabel, place.isSelected && styles.selectedPinLabel]}>
                {getCategoryPinLabel(place.category)}
              </Text>
            </Pressable>
          ))}

          {userPoint ? (
            <View
              pointerEvents="none"
              style={[
                styles.userLocationMarker,
                {
                  left: `${Math.max(2, Math.min(98, userPoint.x * 100))}%`,
                  top: `${Math.max(2, Math.min(98, userPoint.y * 100))}%`,
                },
              ]}>
              <View style={styles.userLocationDot} />
            </View>
          ) : null}
        </View>

        <View style={styles.controlBar}>
          <Pressable
            accessibilityRole="button"
            onPress={zoomIn}
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}>
            <Text style={styles.controlLabel}>+</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={zoomOut}
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}>
            <Text style={styles.controlLabel}>−</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={resetView}
            style={({ pressed }) => [styles.actionButton, pressed && styles.controlPressed]}>
            <Text style={styles.actionLabel}>Reset</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={fitRestaurants}
            style={({ pressed }) => [styles.actionButton, pressed && styles.controlPressed]}>
            <Text style={styles.actionLabel}>Fit Restaurants</Text>
          </Pressable>
          {onToggleExpanded ? (
            <SymbolIconButton
              accessibilityLabel={isExpanded ? 'Collapse map' : 'Expand map'}
              backgroundColor="#FFFFFF"
              color="#3F4652"
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
              style={styles.controlButton}
            />
          ) : null}
        </View>
      </View>

      {!isExpanded ? (
        <View style={styles.childContainer}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

function getCategoryPinLabel(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes('cafe') || normalized.includes('coffee')) return 'C';
  if (normalized.includes('butcher')) return 'B';
  if (normalized.includes('grocery') || normalized.includes('grocer')) return 'G';
  if (normalized.includes('dessert') || normalized.includes('sweet')) return 'D';
  return 'R';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 340,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  mapArea: {
    flex: 1,
    minHeight: 240,
    backgroundColor: '#D4E9F7',
    position: 'relative',
    overflow: 'hidden',
  },
  mapContent: {
    flex: 1,
    minHeight: 240,
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  lake: {
    position: 'absolute',
    left: '28%',
    top: '24%',
    width: '32%',
    height: '20%',
    borderRadius: 300,
    backgroundColor: '#A8D8FF',
    opacity: 0.78,
  },
  parkCentral: {
    position: 'absolute',
    left: '18%',
    top: '10%',
    width: '22%',
    height: '14%',
    borderRadius: 16,
    backgroundColor: '#B8E6C9',
    opacity: 0.7,
  },
  parkNorth: {
    position: 'absolute',
    left: '54%',
    top: '8%',
    width: '28%',
    height: '12%',
    borderRadius: 12,
    backgroundColor: '#C8E8D0',
    opacity: 0.62,
  },
  parkEast: {
    position: 'absolute',
    left: '72%',
    top: '44%',
    width: '18%',
    height: '22%',
    borderRadius: 14,
    backgroundColor: '#B8E6C9',
    opacity: 0.7,
  },
  parkWest: {
    position: 'absolute',
    left: '4%',
    top: '58%',
    width: '20%',
    height: '24%',
    borderRadius: 16,
    backgroundColor: '#C8E8D0',
    opacity: 0.7,
  },
  roadH1: {
    position: 'absolute',
    left: 0,
    top: '42%',
    width: '100%',
    height: 2,
    backgroundColor: '#CDD8E0',
    opacity: 0.5,
  },
  roadV1: {
    position: 'absolute',
    left: '46%',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#CDD8E0',
    opacity: 0.5,
  },
  pin: {
    position: 'absolute',
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedPin: {
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderRadius: 22,
    borderWidth: 4,
    elevation: 8,
  },
  pinLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  selectedPinLabel: { fontSize: 16 },
  userLocationMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    borderRadius: 14,
    backgroundColor: 'rgba(40, 120, 208, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2878D0',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  controlBar: {
    position: 'absolute',
    left: 12,
    top: 12,
    gap: 10,
    alignItems: 'flex-start',
    zIndex: 50,
    elevation: 50,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  controlLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#3F4652',
    lineHeight: 20,
  },
  actionButton: {
    minWidth: 120,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#3F4652',
  },
  controlPressed: {
    opacity: 0.7,
  },
  childContainer: {
    backgroundColor: '#FFFFFF',
  },
});
