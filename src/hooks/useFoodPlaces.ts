import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getPlacesByMode, type Place } from '@/services/placesService';

const FOOD_PLACES_CACHE_VERSION = 2;
const FOOD_PLACES_CACHE_KEY = `mact.foodPlaces.v${FOOD_PLACES_CACHE_VERSION}`;
const FOOD_PLACES_STALE_MS = 12 * 60 * 60 * 1000;
const FOOD_PLACES_GC_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

type FoodPlacesCacheRecord = {
  places: Place[];
  updatedAt: number;
  version: number;
};

type FoodPlacesState = {
  errorMessage: string | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  lastUpdatedAt: number | null;
  places: Place[];
};

let memoryCache: FoodPlacesCacheRecord | null = null;
let inFlightFetch: Promise<Place[]> | null = null;

export function useFoodPlaces() {
  const isMountedRef = useRef(true);
  const initialCache = getUsableMemoryCache();
  const [state, setState] = useState<FoodPlacesState>(() => ({
    errorMessage: null,
    isInitialLoading: !initialCache,
    isRefreshing: false,
    lastUpdatedAt: initialCache?.updatedAt ?? null,
    places: initialCache?.places ?? [],
  }));

  const refreshFoodPlaces = useCallback(async () => {
    if (!isMountedRef.current) return null;

    setState((current) => ({
      ...current,
      errorMessage: null,
      isInitialLoading: current.places.length === 0,
      isRefreshing: current.places.length > 0,
    }));

    try {
      const places = await fetchFoodPlacesOnce();
      const cacheRecord = buildCacheRecord(places);

      memoryCache = cacheRecord;
      persistFoodPlaces(cacheRecord);

      if (!isMountedRef.current) return places;

      setState({
        errorMessage: null,
        isInitialLoading: false,
        isRefreshing: false,
        lastUpdatedAt: cacheRecord.updatedAt,
        places,
      });

      return places;
    } catch {
      if (!isMountedRef.current) return null;

      setState((current) => ({
        ...current,
        errorMessage: 'Could not load halal food places.',
        isInitialLoading: false,
        isRefreshing: false,
      }));

      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    isMountedRef.current = true;

    async function hydrateFoodPlaces() {
      const cached = getUsableMemoryCache();
      if (cached) {
        if (isMounted) {
          setState((current) => ({
            ...current,
            isInitialLoading: false,
            lastUpdatedAt: cached.updatedAt,
            places: cached.places,
          }));
        }

        if (isCacheFresh(cached)) return;

        await refreshFoodPlaces();
        return;
      }

      const persisted = await readPersistedFoodPlaces();
      if (persisted) {
        memoryCache = persisted;

        if (isMounted) {
          setState((current) => ({
            ...current,
            isInitialLoading: false,
            lastUpdatedAt: persisted.updatedAt,
            places: persisted.places,
          }));
        }

        if (isCacheFresh(persisted)) return;

        await refreshFoodPlaces();
        return;
      }

      await refreshFoodPlaces();
    }

    void hydrateFoodPlaces();

    return () => {
      isMounted = false;
      isMountedRef.current = false;
    };
  }, [refreshFoodPlaces]);

  return {
    ...state,
    hasCachedData: state.places.length > 0,
    refreshFoodPlaces,
  };
}

async function fetchFoodPlacesOnce() {
  if (!inFlightFetch) {
    inFlightFetch = withTimeout(getPlacesByMode('food')).finally(() => {
      inFlightFetch = null;
    });
  }

  return inFlightFetch;
}

async function readPersistedFoodPlaces(): Promise<FoodPlacesCacheRecord | null> {
  try {
    const storedValue = await AsyncStorage.getItem(FOOD_PLACES_CACHE_KEY);
    if (!storedValue) return null;

    const parsedValue: unknown = JSON.parse(storedValue);
    if (!isCacheRecord(parsedValue) || isCacheExpired(parsedValue)) return null;

    return parsedValue;
  } catch {
    return null;
  }
}

function persistFoodPlaces(cacheRecord: FoodPlacesCacheRecord) {
  void AsyncStorage.setItem(FOOD_PLACES_CACHE_KEY, JSON.stringify(cacheRecord)).catch(() => {
    // Cache persistence is best-effort and should never block the Food UI.
  });
}

function getUsableMemoryCache() {
  if (!memoryCache || isCacheExpired(memoryCache)) return null;

  return memoryCache;
}

function isCacheFresh(cacheRecord: FoodPlacesCacheRecord) {
  return Date.now() - cacheRecord.updatedAt <= FOOD_PLACES_STALE_MS;
}

function isCacheExpired(cacheRecord: FoodPlacesCacheRecord) {
  return Date.now() - cacheRecord.updatedAt > FOOD_PLACES_GC_MS;
}

function isCacheRecord(value: unknown): value is FoodPlacesCacheRecord {
  if (!value || typeof value !== 'object') return false;

  const record = value as FoodPlacesCacheRecord;

  return (
    Array.isArray(record.places) &&
    typeof record.updatedAt === 'number' &&
    record.version === FOOD_PLACES_CACHE_VERSION
  );
}

function buildCacheRecord(places: Place[]): FoodPlacesCacheRecord {
  return {
    places,
    updatedAt: Date.now(),
    version: FOOD_PLACES_CACHE_VERSION,
  };
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('Request timed out')), REQUEST_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}
