import { memo, type ReactNode } from 'react';

import type { HomeResult } from '@/components/home/MapResults';
import { MockFoodMap } from '@/components/home/MockFoodMap';
// Metro resolves this to .native.tsx or .web.tsx; ESLint does not resolve platform suffixes.
// eslint-disable-next-line import/no-unresolved
import { RealFoodMap } from '@/components/maps/RealFoodMap';
import type { MapViewport, ReturnCameraView } from '@/lib/mapGeometry';
import type { Place } from '@/services/placesService';

type FoodMapProps = {
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

const USE_REAL_FOOD_MAP = true;

export const FoodMap = memo(function FoodMap({
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
}: FoodMapProps) {
  if (USE_REAL_FOOD_MAP) {
    return (
      <RealFoodMap
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
      </RealFoodMap>
    );
  }

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
});
