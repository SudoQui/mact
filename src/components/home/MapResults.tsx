import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BookmarkButton } from '@/components/home/BookmarkIconButton';
import {
  getConfidenceBadgeConfig,
  getFoodCardBadges,
  getTrustBadgeStyle,
  type TrustBadge,
} from '@/components/home/trustBadges';
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

export type HomeResultSection = {
  count: number;
  emptyMessage?: string;
  key: string;
  results: HomeResult[];
  subtitle?: string;
  title: string;
  variant?: 'primary' | 'outside';
};

type MapResultsProps = {
  accentColor: string;
  contentBottomPadding?: number;
  emptyMessage: string;
  emptyTitle?: string;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing?: boolean;
  isUpdatingArea?: boolean;
  listCount?: number;
  listCountSuffix?: string;
  listTitle?: string;
  onPressFoodPlace: (place: Place) => void;
  onRefresh?: () => void;
  onRetry: () => void;
  onToggleSavedPlace: (placeId: string) => void;
  results: HomeResult[];
  savedPlaceIds: string[];
  sections?: HomeResultSection[];
  selectedPlaceId?: string | null;
  isCollapsedPreview?: boolean;
};

export function MapResults({
  accentColor,
  contentBottomPadding = 18,
  emptyMessage,
  emptyTitle = 'No results found',
  errorMessage,
  isLoading,
  isRefreshing = false,
  isUpdatingArea = false,
  listCount,
  listCountSuffix,
  listTitle,
  onPressFoodPlace,
  onRefresh,
  onRetry,
  onToggleSavedPlace,
  results,
  savedPlaceIds,
  sections,
  selectedPlaceId,
  isCollapsedPreview = false,
}: MapResultsProps) {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const visibleResults = isCollapsedPreview ? results.slice(0, 1) : results;
  const visibleSections = isCollapsedPreview || !sections?.length
    ? [{ count: visibleResults.length, key: 'all-results', results: visibleResults, title: '' }]
    : sections;
  const shouldShowHeaderUpdating =
    isUpdatingArea && !visibleSections.some((section) => section.variant === 'primary');
  const visibleResultKey = visibleResults
    .map((result) => `${result.kind}:${result.item.id}`)
    .join('|');

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    });

    return () => cancelAnimationFrame(frameId);
  }, [visibleResultKey]);

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
          ]}
        >
          <Text style={styles.retryLabel}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const resolvedListCount = listCount ?? results.length;
  const resolvedListCountSuffix =
    listCountSuffix ?? `halal ${results.length === 1 ? 'place' : 'places'}`;

  return (
    <View style={styles.resultsContainer}>
      <ListHeader
        count={resolvedListCount}
        isCollapsedPreview={isCollapsedPreview}
        isUpdatingArea={shouldShowHeaderUpdating}
        suffix={resolvedListCountSuffix}
        title={listTitle}
      />
      {results.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.stateText}>{emptyMessage}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: contentBottomPadding }]}
          ref={scrollViewRef}
          refreshControl={
            onRefresh && !isCollapsedPreview ? (
              <RefreshControl
                colors={[accentColor]}
                onRefresh={onRefresh}
                refreshing={isRefreshing}
                tintColor={accentColor}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {visibleSections.map((section) => (
            <View
              key={section.key}
              style={[
                styles.resultSection,
                section.variant === 'outside' && styles.outsideResultSection,
              ]}
            >
              {section.variant === 'outside' ? (
                <OutsideSectionDivider count={section.count} subtitle={section.subtitle} title={section.title} />
              ) : section.title ? (
                <SectionHeader
                  count={section.count}
                  isUpdatingArea={isUpdatingArea && section.variant === 'primary'}
                  title={section.title}
                />
              ) : null}
              {section.emptyMessage ? (
                <Text style={styles.sectionEmptyText}>{section.emptyMessage}</Text>
              ) : null}
              {section.results.map((result) => (
                <View key={`${result.kind}-${result.item.id}`} style={styles.resultCardWrapper}>
                  <ResultCard
                    accentColor={accentColor}
                    onPressFoodPlace={onPressFoodPlace}
                    onToggleSavedPlace={onToggleSavedPlace}
                    result={result}
                    savedPlaceIds={savedPlaceIds}
                    selectedPlaceId={selectedPlaceId}
                  />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function ListHeader({
  count,
  isCollapsedPreview,
  isUpdatingArea,
  suffix,
  title,
}: {
  count: number;
  isCollapsedPreview: boolean;
  isUpdatingArea: boolean;
  suffix: string;
  title?: string;
}) {
  return (
    <View style={styles.listHeader}>
      {title ? (
        <AnimatedCountTitle count={count} suffix={suffix} title={title} />
      ) : (
        <AnimatedCountTitle count={count} suffix={suffix} />
      )}
      {isCollapsedPreview ? (
        <Text style={styles.previewHint}>Map view</Text>
      ) : isUpdatingArea ? (
        <Text style={styles.updatingLabel}>Updating area...</Text>
      ) : null}
    </View>
  );
}

function SectionHeader({
  count,
  isUpdatingArea,
  title,
}: {
  count: number;
  isUpdatingArea: boolean;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSeparator}>-</Text>
        <PulsingCount count={count} />
        <Text style={styles.sectionCountSuffix}>{count === 1 ? 'place' : 'places'}</Text>
      </View>
      {isUpdatingArea ? <Text style={styles.updatingLabel}>Updating area...</Text> : null}
    </View>
  );
}

function OutsideSectionDivider({
  count,
  subtitle,
  title,
}: {
  count: number;
  subtitle?: string;
  title: string;
}) {
  return (
    <View style={styles.outsideDivider}>
      <View style={styles.outsideDividerHeader}>
        <View style={styles.outsideTitleRow}>
          <View style={styles.outsideDot} />
          <Text style={styles.outsideTitle}>{title}</Text>
        </View>
        <View style={styles.outsideCountRow}>
          <PulsingCount count={count} />
          <Text style={styles.outsideCountSuffix}>{count === 1 ? 'place' : 'places'}</Text>
        </View>
      </View>
      {subtitle ? <Text style={styles.outsideSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function PulsingCount({ count }: { count: number }) {
  const [scaleAnim] = useState(() => new RNAnimated.Value(1));

  useEffect(() => {
    RNAnimated.sequence([
      RNAnimated.timing(scaleAnim, {
        duration: 90,
        toValue: 1.08,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scaleAnim, {
        duration: 120,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [count, scaleAnim]);

  return (
    <RNAnimated.Text style={[styles.sectionCount, { transform: [{ scale: scaleAnim }] }]}>
      {count}
    </RNAnimated.Text>
  );
}

function AnimatedCountTitle({
  count,
  suffix,
  title,
}: {
  count: number;
  suffix: string;
  title?: string;
}) {
  const [displayCount, setDisplayCount] = useState(count);
  const previousCountRef = useRef(count);

  useEffect(() => {
    const previousCount = previousCountRef.current;
    if (previousCount === count) {
      setDisplayCount(count);
      return;
    }

    let frameId = 0;
    const startedAt = Date.now();
    const durationMs = 220;

    const tick = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
      const easedProgress = 1 - (1 - progress) ** 3;
      setDisplayCount(Math.round(previousCount + (count - previousCount) * easedProgress));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      previousCountRef.current = count;
      setDisplayCount(count);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [count]);

  return (
    <Text style={styles.listTitle}>{title ?? `${displayCount} ${suffix}`}</Text>
  );
}

type ResultCardProps = {
  accentColor: string;
  onPressFoodPlace: (place: Place) => void;
  onToggleSavedPlace: (placeId: string) => void;
  result: HomeResult;
  savedPlaceIds: string[];
  selectedPlaceId?: string | null;
};

function ResultCard({
  accentColor,
  onPressFoodPlace,
  onToggleSavedPlace,
  result,
  savedPlaceIds,
  selectedPlaceId,
}: ResultCardProps) {
  if (result.kind === 'event') {
    return <EventCard accentColor={accentColor} event={result.item} />;
  }

  return (
    <PlaceCard
      accentColor={accentColor}
      isSaved={savedPlaceIds.includes(result.item.id)}
      isSelected={selectedPlaceId === result.item.id}
      onPressFoodPlace={onPressFoodPlace}
      onToggleSavedPlace={onToggleSavedPlace}
      place={result.item}
    />
  );
}

type PlaceCardProps = {
  accentColor: string;
  isSaved: boolean;
  onPressFoodPlace: (place: Place) => void;
  onToggleSavedPlace: (placeId: string) => void;
  place: Place;
  isSelected: boolean;
};

function PlaceCard({
  accentColor,
  isSaved,
  isSelected,
  onPressFoodPlace,
  onToggleSavedPlace,
  place,
}: PlaceCardProps) {
  const detail = [place.cuisine ?? place.category, place.suburb].filter(Boolean).join(' - ');
  const distance = formatDistance(place.distance_meters);
  const confidenceBadge = getConfidenceBadgeConfig(place.confidence_level);
  const trustBadges = getFoodCardBadges(place);
  const card = (
    <>
      <View style={styles.cardHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.cardTitle}>{place.name}</Text>
          {distance ? <Text style={[styles.distance, { color: accentColor }]}>{distance}</Text> : null}
        </View>
        <BookmarkButton
          accentColor={accentColor}
          isSaved={isSaved}
          onPress={(event) => {
            event.stopPropagation();
            onToggleSavedPlace(place.id);
          }}
          style={styles.bookmarkButton}
        />
      </View>
      {detail ? <Text style={styles.meta}>{detail}</Text> : null}
      {place.description ? (
        <Text numberOfLines={1} style={styles.bodyText}>{place.description}</Text>
      ) : null}
      <View style={styles.statusRow}>
        <TrustBadgePill badge={confidenceBadge} />
        {trustBadges.map((badge) => (
          <TrustBadgePill key={badge.key} badge={badge} />
        ))}
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
      ]}
    >
      {card}
    </Pressable>
  );
}

function TrustBadgePill({ badge }: { badge: TrustBadge }) {
  const colors = getTrustBadgeStyle(badge.tone);

  return (
    <View
      style={[
        styles.infoTag,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
        },
      ]}
    >
      <Text style={[styles.infoTagText, { color: colors.color }]}>{badge.label}</Text>
    </View>
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
  resultsContainer: {
    flex: 1,
    minHeight: 0,
  },
  listHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 2,
  },
  listTitle: {
    flexShrink: 1,
    color: '#2B302D',
    fontSize: 14,
    fontWeight: '900',
  },
  previewHint: {
    color: '#777D79',
    fontSize: 12,
    fontWeight: '700',
  },
  updatingLabel: {
    color: '#7A817D',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    flexGrow: 1,
    paddingTop: 2,
  },
  resultSection: {
    gap: 7,
  },
  outsideResultSection: {
    marginTop: 16,
    gap: 10,
  },
  resultCardWrapper: {
    transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
  },
  sectionHeader: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 2,
    paddingTop: 3,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  sectionTitle: {
    color: '#59605C',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionSeparator: {
    color: '#9AA19D',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionCount: {
    color: '#303733',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionCountSuffix: {
    color: '#59605C',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionEmptyText: {
    color: '#6B736E',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  outsideDivider: {
    borderWidth: 1,
    borderColor: '#FFD89A',
    borderRadius: 8,
    backgroundColor: '#FFF4E5',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  outsideDividerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  outsideTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  outsideDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  outsideTitle: {
    flexShrink: 1,
    color: '#7A3E12',
    fontSize: 12,
    fontWeight: '900',
  },
  outsideSubtitle: {
    color: '#9A5B00',
    fontSize: 11,
    fontWeight: '700',
  },
  outsideCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  outsideCountSuffix: {
    color: '#7A3E12',
    fontSize: 11,
    fontWeight: '800',
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
    color: '#151922',
    fontSize: 16,
    fontWeight: '900',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  distance: {
    fontSize: 13,
    fontWeight: '900',
  },
  bookmarkButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  meta: {
    color: '#59606B',
    fontSize: 13,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 3,
  },
  infoTag: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  infoTagText: {
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
