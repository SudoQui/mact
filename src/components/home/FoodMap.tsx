import type { ReactNode } from 'react';

import type { HomeResult } from '@/components/home/MapResults';
import { MockFoodMap } from '@/components/home/MockFoodMap';
// Metro resolves this to .native.tsx or .web.tsx; ESLint does not resolve platform suffixes.
// eslint-disable-next-line import/no-unresolved
import { RealFoodMap } from '@/components/maps/RealFoodMap';
import type { Place } from '@/services/placesService';

type FoodMapProps = {
  accentColor: string;
  places: HomeResult[];
  selectedPlace: Place | null;
  onSelectPlace: (placeId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  nearMeActive: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onMapInteraction?: () => void;
  children?: ReactNode;
};

const USE_REAL_FOOD_MAP = true;

export function FoodMap({
  accentColor,
  places,
  selectedPlace,
  onSelectPlace,
  userLocation,
  nearMeActive,
  isExpanded,
  onToggleExpanded,
  onMapInteraction,
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
        isExpanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
        onMapInteraction={onMapInteraction}
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
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}
      onMapInteraction={onMapInteraction}
    >
      {children}
    </MockFoodMap>
  );
}
