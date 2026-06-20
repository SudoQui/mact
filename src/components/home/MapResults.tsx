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
};

export function MapResults({
  accentColor,
  emptyMessage,
  errorMessage,
  isLoading,
  onPressFoodPlace,
  onRetry,
  results,
}: MapResultsProps) {
  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator color={accentColor} size="large" />
        <Text style={styles.stateText}>Loading results...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorTitle}>Unable to load results</Text>
        <Text style={styles.stateText}>{errorMessage}</Text>
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
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {results.map((result) => (
        <ResultCard
          accentColor={accentColor}
          key={`${result.kind}-${result.item.id}`}
          onPressFoodPlace={onPressFoodPlace}
          result={result}
        />
      ))}
    </ScrollView>
  );
}

type ResultCardProps = {
  accentColor: string;
  onPressFoodPlace: (place: Place) => void;
  result: HomeResult;
};

function ResultCard({ accentColor, onPressFoodPlace, result }: ResultCardProps) {
  if (result.kind === 'event') {
    return <EventCard accentColor={accentColor} event={result.item} />;
  }

  return (
    <PlaceCard accentColor={accentColor} onPressFoodPlace={onPressFoodPlace} place={result.item} />
  );
}

type PlaceCardProps = {
  accentColor: string;
  onPressFoodPlace: (place: Place) => void;
  place: Place;
};

function PlaceCard({ accentColor, onPressFoodPlace, place }: PlaceCardProps) {
  const detail = [place.cuisine ?? place.category, place.suburb].filter(Boolean).join(' | ');
  const distance = formatDistance(place.distance_meters);
  const card = (
    <>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{place.name}</Text>
        {distance ? <Text style={[styles.distance, { color: accentColor }]}>{distance}</Text> : null}
      </View>
      {detail ? <Text style={styles.meta}>{detail}</Text> : null}
      <Text numberOfLines={2} style={styles.bodyText}>
        {place.description ?? place.address}
      </Text>
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
        { borderLeftColor: accentColor },
        pressed && styles.pressed,
      ]}>
      {card}
    </Pressable>
  );
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
  list: {
    gap: 10,
    paddingTop: 4,
    paddingBottom: 8,
  },
  card: {
    borderLeftWidth: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
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
