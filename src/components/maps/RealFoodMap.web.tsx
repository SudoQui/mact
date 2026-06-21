import type { ReactNode } from 'react';

import type { HomeResult } from '@/components/home/MapResults';
import { MockFoodMap } from '@/components/home/MockFoodMap';
import type { Place } from '@/services/placesService';

type RealFoodMapProps = {
  accentColor: string;
  places: HomeResult[];
  selectedPlace: Place | null;
  onSelectPlace: (placeId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  nearMeActive: boolean;
  onMapInteraction?: () => void;
  children?: ReactNode;
};

export function RealFoodMap({
  accentColor,
  places,
  selectedPlace,
  onSelectPlace,
  userLocation,
  nearMeActive,
  onMapInteraction,
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
      onMapInteraction={onMapInteraction}
    >
      {children}
    </MockFoodMap>
  );
}
