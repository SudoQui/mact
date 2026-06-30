import type { ReactNode } from 'react';

import type { HomeResult } from '@/components/home/MapResults';
import { PlaceholderMap } from '@/components/home/PlaceholderMap';
import type { MapViewport, ReturnCameraView } from '@/lib/mapGeometry';
import type { Place } from '@/services/placesService';

type MockFoodMapProps = {
  accentColor: string;
  places: HomeResult[];
  selectedPlace: Place | null;
  onSelectPlace: (placeId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  nearMeActive: boolean;
  nearMeRadiusKm: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onMapInteraction?: () => void;
  onReturnCameraViewRestored?: () => void;
  onViewportChange?: (viewport: MapViewport, isUserInteraction: boolean) => void;
  returnCameraView?: ReturnCameraView | null;
  searchQuery?: string;
  children?: ReactNode;
};

export function MockFoodMap({
  accentColor,
  places,
  selectedPlace,
  onSelectPlace,
  userLocation,
  nearMeRadiusKm,
  isExpanded,
  onToggleExpanded,
  onMapInteraction,
  onViewportChange,
  children,
}: MockFoodMapProps) {
  return (
    <PlaceholderMap
      accentColor={accentColor}
      results={places}
      selectedPlace={selectedPlace}
      userLocation={userLocation}
      nearMeRadiusKm={nearMeRadiusKm}
      onPressPlace={onSelectPlace}
      onMapDrag={onMapInteraction}
      onResetView={onMapInteraction}
      onViewportChange={onViewportChange}
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}>
      {children}
    </PlaceholderMap>
  );
}
