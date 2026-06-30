import type { ReactNode } from 'react';

import type { HomeResult } from '@/components/home/MapResults';
import { MockFoodMap } from '@/components/home/MockFoodMap';
import type { MapViewport, ReturnCameraView } from '@/lib/mapGeometry';
import type { Place } from '@/services/placesService';

type RealFoodMapProps = {
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
  searchQuery: string;
  children?: ReactNode;
};

export function RealFoodMap({
  accentColor,
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
  return (
    <MockFoodMap
      accentColor={accentColor}
      places={places}
      selectedPlace={selectedPlace}
      onSelectPlace={onSelectPlace}
      userLocation={userLocation}
      nearMeActive={nearMeActive}
      nearMeRadiusKm={nearMeRadiusKm}
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}
      onMapInteraction={onMapInteraction}
      onReturnCameraViewRestored={onReturnCameraViewRestored}
      onViewportChange={onViewportChange}
      returnCameraView={returnCameraView}
      searchQuery={searchQuery}
    >
      {children}
    </MockFoodMap>
  );
}
