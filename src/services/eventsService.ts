import { supabase } from '../lib/supabase';

export type CommunityEvent = {
  id: string;
  title: string;
  host_name: string | null;
  event_type: string | null;
  starts_at: string;
  ends_at: string | null;
  address: string | null;
  suburb: string | null;
  latitude: number | null;
  longitude: number | null;
  cost: string | null;
  registration_url: string | null;
  description: string | null;
  distance_meters?: number;
};

export async function getUpcomingEvents(): Promise<CommunityEvent[]> {
  const { data, error } = await supabase
    .from('community_events')
    .select(
      `
      id,
      title,
      host_name,
      event_type,
      starts_at,
      ends_at,
      address,
      suburb,
      latitude,
      longitude,
      cost,
      registration_url,
      description
    `
    )
    .eq('is_active', true)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CommunityEvent[];
}

export async function getNearbyEvents(
  latitude: number,
  longitude: number,
  radiusMeters = 10000
): Promise<CommunityEvent[]> {
  const { data, error } = await supabase.rpc('nearby_events', {
    user_lat: latitude,
    user_lng: longitude,
    radius_meters: radiusMeters,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CommunityEvent[];
}