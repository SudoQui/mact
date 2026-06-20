import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_PLACE_IDS_KEY = 'mact.savedFoodPlaceIds';

export async function getSavedPlaceIds(): Promise<string[]> {
  const storedValue = await AsyncStorage.getItem(SAVED_PLACE_IDS_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return uniqueStrings(parsedValue);
  } catch {
    return [];
  }
}

export async function isPlaceSaved(placeId: string): Promise<boolean> {
  const savedPlaceIds = await getSavedPlaceIds();

  return savedPlaceIds.includes(placeId);
}

export async function savePlace(placeId: string): Promise<string[]> {
  const savedPlaceIds = await getSavedPlaceIds();
  const nextSavedPlaceIds = uniqueStrings([...savedPlaceIds, placeId]);

  await writeSavedPlaceIds(nextSavedPlaceIds);

  return nextSavedPlaceIds;
}

export async function unsavePlace(placeId: string): Promise<string[]> {
  const savedPlaceIds = await getSavedPlaceIds();
  const nextSavedPlaceIds = savedPlaceIds.filter((savedPlaceId) => savedPlaceId !== placeId);

  await writeSavedPlaceIds(nextSavedPlaceIds);

  return nextSavedPlaceIds;
}

export async function toggleSavedPlace(placeId: string): Promise<boolean> {
  const savedPlaceIds = await getSavedPlaceIds();
  const isSaved = savedPlaceIds.includes(placeId);

  if (isSaved) {
    await unsavePlace(placeId);
    return false;
  }

  await savePlace(placeId);
  return true;
}

async function writeSavedPlaceIds(placeIds: string[]) {
  await AsyncStorage.setItem(SAVED_PLACE_IDS_KEY, JSON.stringify(uniqueStrings(placeIds)));
}

function uniqueStrings(values: unknown[]) {
  return Array.from(new Set(values.filter((value): value is string => typeof value === 'string')));
}
