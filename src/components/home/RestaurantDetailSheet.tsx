import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { isPlaceSaved, toggleSavedPlace } from '@/lib/favourites';
import { formatDistance } from '@/lib/distance';
import { getFoodDetails, type FoodDetails, type Place } from '@/services/placesService';

type RestaurantDetailSheetProps = {
  accentColor: string;
  onSavedChange?: () => void;
  onClose: () => void;
  place: Place | null;
};

type ChecklistItem = {
  label: string;
  value: string;
};

export function RestaurantDetailSheet({
  accentColor,
  onSavedChange,
  onClose,
  place,
}: RestaurantDetailSheetProps) {
  const [details, setDetails] = useState<FoodDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!place) {
      return;
    }

    try {
      setIsLoading(true);
      setDetails(null);
      setErrorMessage(null);

      const nextDetails = await getFoodDetails(place.id);
      setDetails(nextDetails);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong loading halal details.';

      setDetails(null);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [place]);

  const loadSavedState = useCallback(async () => {
    if (!place) {
      return;
    }

    const nextIsSaved = await isPlaceSaved(place.id);
    setIsSaved(nextIsSaved);
  }, [place]);

  const handleToggleSaved = useCallback(async () => {
    if (!place || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      const nextIsSaved = await toggleSavedPlace(place.id);
      setIsSaved(nextIsSaved);
      onSavedChange?.();
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSavedChange, place]);

  useEffect(() => {
    if (place) {
      void Promise.resolve().then(async () => {
        await Promise.all([loadDetails(), loadSavedState()]);
      });
    }
  }, [loadDetails, loadSavedState, place]);

  if (!place) {
    return null;
  }

  const distance = formatDistance(place.distance_meters);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{place.name}</Text>
            <Text style={styles.meta}>
              {[place.cuisine, place.suburb].filter(Boolean).join(' | ')}
            </Text>
            <Text style={styles.address}>{place.address}</Text>
            {distance ? <Text style={[styles.distance, { color: accentColor }]}>{distance}</Text> : null}
          </View>

          <Pressable
            accessibilityLabel="Close restaurant details"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Text style={styles.closeLabel}>Close</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator color={accentColor} size="large" />
              <Text style={styles.stateText}>Loading halal details...</Text>
            </View>
          ) : null}

          {!isLoading && errorMessage ? (
            <View style={styles.stateContainer}>
              <Text style={styles.errorTitle}>Unable to load details</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={loadDetails}
                style={({ pressed }) => [
                  styles.retryButton,
                  { backgroundColor: accentColor },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.primaryButtonLabel}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && !errorMessage && !details ? (
            <View style={styles.stateContainer}>
              <Text style={styles.emptyTitle}>No halal details yet</Text>
              <Text style={styles.stateText}>
                This restaurant has not had detailed halal information added.
              </Text>
            </View>
          ) : null}

          {!isLoading && !errorMessage && details ? (
            <View style={styles.checklist}>
              {buildChecklist(details).map((item) => (
                <View key={item.label} style={styles.checklistRow}>
                  <Text style={styles.checkLabel}>{item.label}</Text>
                  <Text style={[styles.checkValue, { color: accentColor }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={noop}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: accentColor },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.actionLabel, styles.primaryButtonLabel]}>Directions</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={noop}
              style={({ pressed }) => [
                styles.actionButton,
                { borderColor: accentColor },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.actionLabel, { color: accentColor }]}>Call</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSaved }}
              disabled={isSaving}
              onPress={handleToggleSaved}
              style={({ pressed }) => [
                styles.actionButton,
                isSaved ? { backgroundColor: accentColor } : { borderColor: accentColor },
                (pressed || isSaving) && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.actionLabel,
                  isSaved ? styles.primaryButtonLabel : { color: accentColor },
                ]}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={noop}
              style={({ pressed }) => [
                styles.actionButton,
                { borderColor: accentColor },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.actionLabel, { color: accentColor }]}>Report Change</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function buildChecklist(details: FoodDetails): ChecklistItem[] {
  return [
    {
      label: 'Meat provider confirmed halal',
      value: formatBoolean(details.meat_provider_confirmed_halal),
    },
    {
      label: 'Halal certified',
      value: formatBoolean(details.halal_certified),
    },
    {
      label: 'Certificate expiry',
      value: formatDate(details.halal_certificate_expiry),
    },
    {
      label: 'Hand slaughtered',
      value: formatText(details.hand_slaughtered),
    },
    {
      label: 'No pork',
      value: formatBoolean(details.no_pork),
    },
    {
      label: 'No alcohol',
      value: formatBoolean(details.no_alcohol),
    },
    {
      label: 'Details last updated',
      value: formatDate(details.details_last_updated),
    },
    {
      label: 'Verification source',
      value: formatText(details.verification_source),
    },
    {
      label: 'Confidence level',
      value: formatText(details.confidence_level),
    },
  ];
}

function formatBoolean(value: boolean) {
  return value ? 'Yes' : 'No';
}

function formatText(value: string | null) {
  if (!value) {
    return 'Not provided';
  }

  return value
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not provided';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function noop() {
  return undefined;
}

const styles = StyleSheet.create({
  overlay: {
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backdrop: {
    backgroundColor: 'rgba(21, 25, 34, 0.28)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D7DCE2',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#151922',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  meta: {
    color: '#59606B',
    fontSize: 14,
    fontWeight: '800',
  },
  address: {
    color: '#3F4652',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  distance: {
    fontSize: 14,
    fontWeight: '900',
  },
  closeButton: {
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: '#EEF1F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  closeLabel: {
    color: '#3F4652',
    fontSize: 13,
    fontWeight: '900',
  },
  content: {
    gap: 14,
    paddingTop: 18,
    paddingBottom: 8,
  },
  checklist: {
    gap: 8,
  },
  checklistRow: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#F4F6F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkLabel: {
    flex: 1,
    color: '#303742',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  checkValue: {
    maxWidth: '44%',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    minHeight: 44,
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  stateContainer: {
    borderRadius: 8,
    backgroundColor: '#F4F6F8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
  },
  stateText: {
    color: '#4C5360',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#151922',
    fontSize: 17,
    fontWeight: '900',
  },
  errorTitle: {
    color: '#9E2F24',
    fontSize: 17,
    fontWeight: '900',
  },
  retryButton: {
    minHeight: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  pressed: {
    opacity: 0.76,
  },
});
