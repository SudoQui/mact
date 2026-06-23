import { supabase } from '../lib/supabase';

export type AppMode = 'food' | 'prayer';

export type Place = {
  id: string;
  mode: AppMode;
  category: string;
  name: string;
  description: string | null;
  cuisine: string | null;
  address: string;
  suburb: string | null;
  phone: string | null;
  website: string | null;
  latitude: number;
  longitude: number;
  opening_hours: Record<string, unknown>;
  distance_meters?: number;
  confidence_level?: FoodDetails['confidence_level'];
  food_details?: FoodDetails | null;
};

export type FoodDetails = {
  id: string;
  place_id: string;
  meat_provider_confirmed_halal: boolean;
  halal_certified: boolean;
  halal_meat_coverage: string | null;
  halal_certificate_expiry: string | null;
  hand_slaughtered: 'yes' | 'no' | 'unknown';
  pork_status: 'none_served' | 'served' | 'unknown' | null;
  alcohol_status: 'none_served' | 'served' | 'unknown' | null;
  cross_contamination_risk: 'no' | 'low' | 'medium' | 'high' | 'unknown';
  verification_source:
    | 'admin'
    | 'owner'
    | 'certificate'
    | 'community'
    | 'unknown';
  confidence_level: 'high' | 'medium' | 'low';
  halal_notes: string | null;
  details_last_updated: string | null;
};

export type PrayerDetails = {
  id: string;
  place_id: string;
  daily_prayers: boolean;
  jummah: boolean;
  women_area: 'yes' | 'no' | 'unknown';
  wudu: 'yes' | 'no' | 'unknown';
  parking_notes: string | null;
  prayer_times_source: 'admin' | 'submitted' | 'official' | 'unknown';
  details_last_updated: string | null;
};

export async function getPlacesByMode(mode: AppMode): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select(
      `
      id,
      mode,
      category,
      name,
      description,
      cuisine,
      address,
      suburb,
      phone,
      website,
      latitude,
      longitude,
      opening_hours,
      food_details(*)
    `
    )
    .eq('mode', mode)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(({ food_details, ...place }) => {
    const details = Array.isArray(food_details) ? food_details[0] : food_details;

    return {
      ...place,
      confidence_level: details?.confidence_level,
      food_details: details ?? null,
    };
  }) as Place[];
}

export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
  mode: AppMode,
  radiusMeters = 10000
): Promise<Place[]> {
  const { data, error } = await supabase.rpc('nearby_places', {
    user_lat: latitude,
    user_lng: longitude,
    selected_mode: mode,
    radius_meters: radiusMeters,
  });

  if (error) {
    throw new Error(error.message);
  }

  const places = (data ?? []) as Place[];
  if (places.length === 0) return places;

  const { data: detailsRows, error: detailsError } = await supabase
    .from('food_details')
    .select(
      `
      *
    `
    )
    .in('place_id', places.map((place) => place.id));

  if (detailsError) throw new Error(detailsError.message);

  const detailsByPlace = new Map(
    (detailsRows ?? []).map((row) => {
      const { place_id, ...details } = row;

      return [place_id, details];
    })
  );

  return places.map((place) => {
    const details = detailsByPlace.get(place.id) as FoodDetails | undefined;

    return {
      ...place,
      confidence_level: details?.confidence_level,
      food_details: details ?? null,
    };
  });
}

export async function getFoodDetails(
  placeId: string
): Promise<FoodDetails | null> {
  const { data, error } = await supabase
    .from('food_details')
    .select('*')
    .eq('place_id', placeId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as FoodDetails | null;
}

export async function getPrayerDetails(
  placeId: string
): Promise<PrayerDetails | null> {
  const { data, error } = await supabase
    .from('prayer_details')
    .select('*')
    .eq('place_id', placeId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as PrayerDetails | null;
}
