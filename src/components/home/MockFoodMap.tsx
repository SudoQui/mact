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
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onMapInteraction?: () => void;
  searchQuery?: string;
  children?: ReactNode;
};

export function MockFoodMap({
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
}: MockFoodMapProps) {
  return (
    <PlaceholderMap
      accentColor={accentColor}
      results={places}
      selectedPlace={selectedPlace}
      userLocation={userLocation}
      onPressPlace={onSelectPlace}
      onMapDrag={onMapInteraction}
      onResetView={onMapInteraction}
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}>
      {children}
    </PlaceholderMap>
  );
}
