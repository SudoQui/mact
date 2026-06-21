import type { ReactNode } from 'react';

import type { HomeResult } from '@/components/home/MapResults';
import { PlaceholderMap } from '@/components/home/PlaceholderMap';
import { RealFoodMap } from '@/components/home/RealFoodMap';
import type { Place } from '@/services/placesService';

type FoodMapProps = {
  accentColor: string;
  places: HomeResult[];
  selectedPlace: Place | null;
  onSelectPlace: (placeId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  nearMeActive: boolean;
  onMapInteraction?: () => void;
  children?: ReactNode;
};

const USE_REAL_FOOD_MAP = false;

export function FoodMap({
  accentColor,
  places,
  selectedPlace,
  onSelectPlace,
  userLocation,
  nearMeActive,
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
        onMapInteraction={onMapInteraction}
      >
        {children}
      </RealFoodMap>
    );
  }

  return (
    <PlaceholderMap
      accentColor={accentColor}
      results={places}
      onPressPlace={onSelectPlace}
      onMapDrag={onMapInteraction}
      onResetView={onMapInteraction}>
      {children}
    </PlaceholderMap>
  );
}
