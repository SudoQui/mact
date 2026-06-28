import type { FoodDetails, Place } from '@/services/placesService';

export type TrustBadgeTone = 'green' | 'orange' | 'red' | 'neutral';

export type TrustBadge = {
  key: string;
  label: string;
  tone: TrustBadgeTone;
};

export const TRUST_BADGE_COLORS: Record<
  TrustBadgeTone,
  { backgroundColor: string; borderColor: string; color: string }
> = {
  green: {
    backgroundColor: '#E7F6EC',
    borderColor: '#BBE7C7',
    color: '#166534',
  },
  orange: {
    backgroundColor: '#FFF4E5',
    borderColor: '#FFD89A',
    color: '#9A5B00',
  },
  red: {
    backgroundColor: '#FDECEC',
    borderColor: '#F5B5B5',
    color: '#991B1B',
  },
  neutral: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    color: '#374151',
  },
};

export function getFoodStatusBadges(details: FoodDetails | null | undefined): TrustBadge[] {
  return [
    getCertifiedBadge(details),
    getPorkBadge(details),
    getAlcoholBadge(details),
    getCrossContaminationBadge(details),
  ];
}

export function getFoodCardBadges(place: Place): TrustBadge[] {
  return getFoodStatusBadges(place.food_details).slice(0, 3);
}

export function getFoodDetailBadges(details: FoodDetails): TrustBadge[] {
  return [
    ...getFoodStatusBadges(details),
    {
      key: 'confidence',
      label: `${formatTitle(details.confidence_level)} confidence`,
      tone: getConfidenceTone(details.confidence_level),
    },
    {
      key: 'verification-source',
      label: `Source: ${formatTitle(details.verification_source)}`,
      tone: details.verification_source === 'unknown' ? 'orange' : 'neutral',
    },
    {
      key: 'details-last-updated',
      label: details.details_last_updated
        ? `Updated ${formatDisplayDate(details.details_last_updated)}`
        : 'Needs review',
      tone: details.details_last_updated ? 'neutral' : 'orange',
    },
  ];
}

export function getTrustBadgeStyle(tone: TrustBadgeTone) {
  return TRUST_BADGE_COLORS[tone];
}

export function getConfidenceBadgeConfig(
  confidence: FoodDetails['confidence_level'] | null | undefined
): TrustBadge {
  if (confidence === 'high') {
    return { key: 'confidence', label: 'High confidence', tone: 'green' };
  }

  if (confidence === 'medium') {
    return { key: 'confidence', label: 'Medium confidence', tone: 'orange' };
  }

  if (confidence === 'low') {
    return { key: 'confidence', label: 'Low confidence', tone: 'red' };
  }

  return { key: 'confidence', label: 'Confidence unknown', tone: 'neutral' };
}

function getCertifiedBadge(details: FoodDetails | null | undefined): TrustBadge {
  if (details?.halal_certified === true) {
    return { key: 'certified', label: 'Certified', tone: 'green' };
  }

  return {
    key: 'certified',
    label: details ? 'Not certified' : 'Certification unknown',
    tone: 'orange',
  };
}

function getPorkBadge(details: FoodDetails | null | undefined): TrustBadge {
  if (details?.pork_status === 'none_served') {
    return { key: 'pork', label: 'No pork', tone: 'green' };
  }

  if (details?.pork_status === 'served') {
    return { key: 'pork', label: 'Serves pork', tone: 'red' };
  }

  return { key: 'pork', label: 'Pork unknown', tone: 'orange' };
}

function getAlcoholBadge(details: FoodDetails | null | undefined): TrustBadge {
  if (details?.alcohol_status === 'none_served') {
    return { key: 'alcohol', label: 'No alcohol', tone: 'green' };
  }

  if (details?.alcohol_status === 'served') {
    return { key: 'alcohol', label: 'Serves alcohol', tone: 'red' };
  }

  return { key: 'alcohol', label: 'Alcohol unknown', tone: 'orange' };
}

function getCrossContaminationBadge(details: FoodDetails | null | undefined): TrustBadge {
  const risk = details?.cross_contamination_risk as string | undefined;

  if (risk === 'no') {
    return {
      key: 'cross-contamination',
      label: 'No cross-contamination risk known',
      tone: 'green',
    };
  }

  if (
    risk === 'yes' ||
    risk === 'low' ||
    risk === 'medium' ||
    risk === 'high'
  ) {
    return {
      key: 'cross-contamination',
      label: 'Cross-contamination risk',
      tone: 'orange',
    };
  }

  return {
    key: 'cross-contamination',
    label: 'Cross-contamination unknown',
    tone: 'orange',
  };
}

function getConfidenceTone(confidence: FoodDetails['confidence_level']): TrustBadgeTone {
  if (confidence === 'high') return 'green';
  if (confidence === 'medium') return 'orange';
  return 'red';
}

function formatTitle(value: string) {
  return value
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function formatDisplayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
