import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BookmarkButton } from '@/components/home/BookmarkIconButton';
import { formatDistance } from '@/lib/distance';
import { getFoodDetails, type FoodDetails, type Place } from '@/services/placesService';

type RestaurantDetailSheetProps = {
  accentColor: string;
  bottomOffset?: number;
  isSaved: boolean;
  onSavedChange?: () => void;
  onToggleSavedPlace: (placeId: string) => Promise<void>;
  onClose: () => void;
  place: Place | null;
};

type ChecklistItem = { label: string; value: string };

export function RestaurantDetailSheet({
  accentColor,
  bottomOffset = 0,
  isSaved,
  onSavedChange,
  onToggleSavedPlace,
  onClose,
  place,
}: RestaurantDetailSheetProps) {
  const [details, setDetails] = useState<FoodDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { height: screenHeight } = useWindowDimensions();
  const cardMaxHeight = Math.min(Math.round(screenHeight * 0.52), 430);
  const [translateY] = useState(() => new Animated.Value(cardMaxHeight));

  const resetSheetPosition = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 2,
    }).start();
  }, [translateY]);

  const dismissSheet = useCallback(() => {
    Animated.timing(translateY, {
      toValue: cardMaxHeight,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [cardMaxHeight, onClose, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_event, gesture) => {
          translateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > 96 || gesture.vy > 0.8) {
            dismissSheet();
          } else {
            resetSheetPosition();
          }
        },
        onPanResponderTerminate: resetSheetPosition,
      }),
    [dismissSheet, resetSheetPosition, translateY]
  );

  const loadDetails = useCallback(async () => {
    if (!place) return;

    if (place.food_details) {
      setDetails(place.food_details);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setDetails(null);
      setErrorMessage(null);
      setDetails(await getFoodDetails(place.id));
    } catch {
      setDetails(null);
      setErrorMessage('Could not load halal details. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [place]);

  const handleToggleSaved = useCallback(async () => {
    if (!place || isSaving) return;

    try {
      setIsSaving(true);
      await onToggleSavedPlace(place.id);
      onSavedChange?.();
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSavedChange, onToggleSavedPlace, place]);

  useEffect(() => {
    if (place) {
      void Promise.resolve().then(loadDetails);
    }
  }, [loadDetails, place]);

  useEffect(() => {
    if (!place) return;

    translateY.setValue(cardMaxHeight);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [cardMaxHeight, place, translateY]);

  if (!place) return null;

  const distance = formatDistance(place.distance_meters);
  const meta = [place.cuisine ?? place.category, place.suburb].filter(Boolean).join(' - ');

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.overlay, { bottom: bottomOffset, transform: [{ translateY }] }]}
    >
      <View style={[styles.card, { maxHeight: cardMaxHeight }]}>
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.handle} />
        </View>

        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text numberOfLines={2} style={styles.title}>{place.name}</Text>
              <BookmarkButton
                accentColor={accentColor}
                disabled={isSaving}
                isSaved={isSaved}
                onPress={handleToggleSaved}
              />
            </View>
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            <Text numberOfLines={2} style={styles.address}>{place.address}</Text>
            {distance ? <Text style={[styles.distance, { color: accentColor }]}>{distance}</Text> : null}
          </View>

          <Pressable
            accessibilityLabel="Close restaurant details"
            accessibilityRole="button"
            hitSlop={8}
            onPress={dismissSheet}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeLabel}>X</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <ActionButton
            accentColor={accentColor}
            label="Directions"
            onPress={() => openDirections(place)}
            primary
          />
          <ActionButton
            accentColor={accentColor}
            disabled={!place.phone}
            label="Call"
            onPress={() => openPhone(place.phone)}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
        >
          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator color={accentColor} />
              <Text style={styles.stateText}>Checking halal details...</Text>
            </View>
          ) : null}

          {!isLoading && errorMessage ? (
            <View style={styles.stateContainer}>
              <Text style={styles.errorTitle}>Unable to load details</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={loadDetails}
                style={({ pressed }) => [styles.retryButton, { backgroundColor: accentColor }, pressed && styles.pressed]}
              >
                <Text style={styles.primaryLabel}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && !errorMessage && !details ? (
            <View style={styles.stateContainer}>
              <Text style={styles.emptyTitle}>Halal details need review</Text>
              <Text style={styles.stateText}>Detailed verification has not been added yet.</Text>
            </View>
          ) : null}

          {!isLoading && !errorMessage && details ? (
            <>
              <View style={styles.checklist}>
                {buildChecklist(details).map((item) => (
                  <View key={item.label} style={styles.checklistRow}>
                    <Text style={styles.checkLabel}>{item.label}</Text>
                    <Text style={[styles.checkValue, { color: accentColor }]}>{item.value}</Text>
                  </View>
                ))}
              </View>
              {details.halal_notes ? (
                <View style={styles.notesCard}>
                  <Text style={styles.notesTitle}>Halal notes</Text>
                  <Text style={styles.notesText}>{details.halal_notes}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

function ActionButton({
  accentColor,
  disabled = false,
  label,
  onPress,
  primary = false,
  selected = false,
}: {
  accentColor: string;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  primary?: boolean;
  selected?: boolean;
}) {
  const filled = primary || selected;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        filled ? { backgroundColor: accentColor } : { borderColor: accentColor },
        (pressed || disabled) && styles.pressed,
      ]}
    >
      <Text style={[styles.actionLabel, { color: filled ? '#FFFFFF' : accentColor }]}>{label}</Text>
    </Pressable>
  );
}

function buildChecklist(details: FoodDetails): ChecklistItem[] {
  return [
    {
      label: 'Halal meat coverage',
      value: formatText(details.halal_meat_coverage) ||
        (details.meat_provider_confirmed_halal ? 'Confirmed' : 'Needs review'),
    },
    { label: 'Halal certified', value: formatBoolean(details.halal_certified) },
    { label: 'Hand slaughtered', value: formatText(details.hand_slaughtered) },
    formatPorkChecklist(details),
    formatAlcoholChecklist(details),
    { label: 'Cross contamination risk', value: formatText(details.cross_contamination_risk) },
    { label: 'Verification source', value: formatText(details.verification_source) },
    { label: 'Confidence level', value: formatText(details.confidence_level) },
    { label: 'Details last updated', value: formatDate(details.details_last_updated) },
  ];
}

function formatAlcoholChecklist(details: FoodDetails): ChecklistItem {
  if (details.alcohol_status === 'none_served') return { label: 'Alcohol status', value: 'None served' };
  if (details.alcohol_status === 'served') return { label: 'Alcohol status', value: 'Served' };
  return { label: 'Alcohol status', value: 'Needs review' };
}

function formatPorkChecklist(details: FoodDetails): ChecklistItem {
  if (details.pork_status === 'none_served') return { label: 'Pork status', value: 'None served' };
  if (details.pork_status === 'served') return { label: 'Pork status', value: 'Served' };
  return { label: 'Pork status', value: 'Needs review' };
}

function formatBoolean(value: boolean) {
  return value ? 'Yes' : 'No';
}

function formatText(value: string | null | undefined) {
  if (!value) return '';
  return value
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function formatDate(value: string | null) {
  if (!value) return 'Needs review';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function openDirections(place: Place) {
  const destination = encodeURIComponent(`${place.latitude},${place.longitude}`);
  void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
}

function openPhone(phone: string | null) {
  if (phone) void Linking.openURL(`tel:${phone}`);
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 200,
    elevation: 200,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#FFFCF7',
    overflow: 'hidden',
    paddingTop: 9,
    paddingHorizontal: 18,
    paddingBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 24,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D8D2C9',
    alignSelf: 'center',
  },
  dragArea: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  titleBlock: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, color: '#202421', fontSize: 20, fontWeight: '900', lineHeight: 24 },
  meta: { color: '#656B67', fontSize: 13, fontWeight: '800' },
  address: { color: '#4B514D', fontSize: 12, fontWeight: '600', lineHeight: 17 },
  distance: { fontSize: 12, fontWeight: '900' },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0ECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: { color: '#303531', fontSize: 15, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: '900' },
  scrollArea: { flexShrink: 1 },
  content: { gap: 10, paddingTop: 12, paddingBottom: 18 },
  checklist: { gap: 6 },
  checklistRow: {
    minHeight: 40,
    borderRadius: 11,
    backgroundColor: '#F4F1EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  checkLabel: { flex: 1, color: '#3C423E', fontSize: 12, fontWeight: '800' },
  checkValue: { maxWidth: '45%', fontSize: 12, fontWeight: '900', textAlign: 'right' },
  notesCard: { borderRadius: 12, backgroundColor: '#FFF0E8', gap: 4, padding: 12 },
  notesTitle: { color: '#6F2D1F', fontSize: 13, fontWeight: '900' },
  notesText: { color: '#4B403C', fontSize: 13, fontWeight: '600', lineHeight: 19 },
  stateContainer: {
    borderRadius: 12,
    backgroundColor: '#F4F1EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  stateText: { color: '#555C57', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  emptyTitle: { color: '#252A27', fontSize: 15, fontWeight: '900' },
  errorTitle: { color: '#9E2F24', fontSize: 15, fontWeight: '900' },
  retryButton: { minHeight: 40, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 18 },
  primaryLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.68 },
});
