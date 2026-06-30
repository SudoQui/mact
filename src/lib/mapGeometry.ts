import type { Place } from '@/services/placesService';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type MapBounds = [west: number, south: number, east: number, north: number];

export type MapViewport = {
  bounds: MapBounds | null;
  centerCoordinate: [number, number];
  zoomLevel: number;
};

export type ReturnCameraView = MapViewport & {
  reason: 'wide' | 'area' | 'near_me';
};

export type MarkerDisplayMode = 'dot' | 'compact' | 'label';

export function getMarkerDisplayMode(zoom: number): MarkerDisplayMode {
  if (zoom < 10.75) return 'dot';
  if (zoom < 12.8) return 'compact';
  return 'label';
}

export function getZoomForRadiusKm(radiusKm: number) {
  if (radiusKm <= 1) return 15.2;
  if (radiusKm <= 2) return 14.5;
  if (radiusKm <= 3) return 14.0;
  if (radiusKm <= 5) return 13.2;
  if (radiusKm <= 8) return 12.5;
  if (radiusKm <= 10) return 12.0;
  if (radiusKm <= 15) return 11.4;
  return 10.8;
}

export function getDistanceKm(a: Coordinate, b: Coordinate) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

export function isPlaceInsideBounds(place: Place, bounds: MapBounds | null) {
  if (!bounds) return true;

  const [west, south, east, north] = bounds;
  return (
    place.longitude >= west &&
    place.longitude <= east &&
    place.latitude >= south &&
    place.latitude <= north
  );
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
