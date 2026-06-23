import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatDistance } from '@/lib/distance';
import type { CommunityEvent } from '@/services/eventsService';
import type { Place } from '@/services/placesService';

export type HomeResult =
  | {
      kind: 'place';
      item: Place;
    }
  | {
      kind: 'event';
      item: CommunityEvent;
    };

type MapResultsProps = {
  accentColor: string;
  emptyMessage: string;
  errorMessage: string | null;
  isLoading: boolean;
  onPressFoodPlace: (place: Place) => void;
  onRetry: () => void;
  results: HomeResult[];
  selectedPlaceId?: string | null;
  isCollapsedPreview?: boolean;
};

export function MapResults({
  accentColor,
  emptyMessage,
  errorMessage,
  isLoading,
  onPressFoodPlace,
  onRetry,
  results,
  selectedPlaceId,
  isCollapsedPreview = false,
}: MapResultsProps) {
  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator color={accentColor} size="large" />
        <Text style={styles.stateText}>Finding halal food around Canberra...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorTitle}>Could not load halal food places.</Text>
        <Text style={styles.stateText}>Check your connection and try again.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: accentColor },
            pressed && styles.pressed,
          ]}>
          <Text style={styles.retryLabel}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.stateText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.resultsContainer}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{results.length} halal {results.length === 1 ? 'place' : 'places'}</Text>
        {isCollapsedPreview ? <Text style={styles.previewHint}>Map view</Text> : null}
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {(isCollapsedPreview ? results.slice(0, 1) : results).map((result) => (
        <ResultCard
          accentColor={accentColor}
          key={`${result.kind}-${result.item.id}`}
          onPressFoodPlace={onPressFoodPlace}
          result={result}
          selectedPlaceId={selectedPlaceId}
        />
      ))}
      </ScrollView>
    </View>
  );
}

type ResultCardProps = {
  accentColor: string;
  onPressFoodPlace: (place: Place) => void;
  result: HomeResult;
  selectedPlaceId?: string | null;
};

function ResultCard({ accentColor, onPressFoodPlace, result, selectedPlaceId }: ResultCardProps) {
  if (result.kind === 'event') {
    return <EventCard accentColor={accentColor} event={result.item} />;
  }

  return (
    <PlaceCard
      accentColor={accentColor}
      isSelected={selectedPlaceId === result.item.id}
      onPressFoodPlace={onPressFoodPlace}
      place={result.item}
    />
  );
}

type PlaceCardProps = {
  accentColor: string;
  onPressFoodPlace: (place: Place) => void;
  place: Place;
  isSelected: boolean;
};

function PlaceCard({ accentColor, isSelected, onPressFoodPlace, place }: PlaceCardProps) {
  const detail = [place.cuisine ?? place.category, place.suburb].filter(Boolean).join(' · ');
  const distance = formatDistance(place.distance_meters);
  const confidence = formatConfidence(place.confidence_level);
  const card = (
    <>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{place.name}</Text>
        {distance ? <Text style={[styles.distance, { color: accentColor }]}>{distance}</Text> : null}
      </View>
      {detail ? <Text style={styles.meta}>{detail}</Text> : null}
      {place.description ? (
        <Text numberOfLines={1} style={styles.bodyText}>{place.description}</Text>
      ) : null}
      <View style={styles.statusRow}>
        <View style={[styles.confidenceChip, { backgroundColor: `${accentColor}12` }]}>
          <Text style={[styles.confidenceText, { color: accentColor }]}>{confidence}</Text>
        </View>
      </View>
    </>
  );

  if (place.mode !== 'food') {
    return <View style={[styles.card, { borderLeftColor: accentColor }]}>{card}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPressFoodPlace(place)}
      style={({ pressed }) => [
        styles.card,
        isSelected ? styles.selectedCard : null,
        isSelected ? { borderColor: accentColor } : null,
        pressed && styles.pressed,
      ]}>
      {card}
    </Pressable>
  );
}

function formatConfidence(value: Place['confidence_level']) {
  if (!value) return 'Needs review';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)} confidence`;
}

type EventCardProps = {
  accentColor: string;
  event: CommunityEvent;
};

function EventCard({ accentColor, event }: EventCardProps) {
  const detail = [event.event_type, event.host_name].filter(Boolean).join(' | ');
  const location = event.suburb ?? event.address;

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <Text style={styles.cardTitle}>{event.title}</Text>
      {detail ? <Text style={styles.meta}>{detail}</Text> : null}
      <Text style={styles.bodyText}>{formatEventDate(event.starts_at)}</Text>
      {location ? (
        <Text numberOfLines={1} style={styles.locationText}>
          {location}
        </Text>
      ) : null}
    </View>
  );
}

function formatEventDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  resultsContainer: {
    flex: 1,
    minHeight: 0,
  },
  listHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  listTitle: {
    color: '#2B302D',
    fontSize: 14,
    fontWeight: '900',
  },
  previewHint: {
    color: '#777D79',
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 7,
    paddingTop: 2,
    paddingBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: '#EBE5DC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#FFF7F2',
    borderWidth: 2,
  },
  cardTitle: {
    flex: 1,
    color: '#151922',
    fontSize: 16,
    fontWeight: '900',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  distance: {
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  meta: {
    color: '#59606B',
    fontSize: 13,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 3,
  },
  confidenceChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '900',
  },
  bodyText: {
    color: '#3F4652',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  locationText: {
    color: '#68707B',
    fontSize: 13,
    fontWeight: '600',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 22,
  },
  stateText: {
    color: '#4C5360',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '900',
  },
  errorTitle: {
    color: '#9E2F24',
    fontSize: 18,
    fontWeight: '900',
  },
  retryButton: {
    minHeight: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  retryLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.76,
  },
});
