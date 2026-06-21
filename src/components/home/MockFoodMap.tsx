import type { ReactNode } from 'react';

import type { HomeResult } from '@/components/home/MapResults';
import { PlaceholderMap } from '@/components/home/PlaceholderMap';
import type { Place } from '@/services/placesService';

type MockFoodMapProps = {
  accentColor: string;
  places: HomeResult[];
  selectedPlace: Place | null;
  onSelectPlace: (placeId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  nearMeActive: boolean;
  onMapInteraction?: () => void;
  children?: ReactNode;
};

export function MockFoodMap({
  accentColor,
  places,
  selectedPlace,
  onSelectPlace,
  userLocation,
  nearMeActive,
  onMapInteraction,
  children,
}: MockFoodMapProps) {
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
