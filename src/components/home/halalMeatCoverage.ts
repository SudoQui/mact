const HALAL_MEAT_COVERAGE_LABELS: Record<string, string> = {
  only_chicken: 'Chicken only',
  only_beef: 'Beef only',
  both: 'Chicken & beef',
  unknown: 'Meat coverage unknown',
};

export function formatHalalMeatCoverage(
  value: string | null | undefined,
  options: { expandedBothLabel?: boolean } = {}
) {
  if (options.expandedBothLabel && value === 'both') {
    return 'Chicken and beef confirmed';
  }

  return HALAL_MEAT_COVERAGE_LABELS[value ?? 'unknown'] ?? HALAL_MEAT_COVERAGE_LABELS.unknown;
}
