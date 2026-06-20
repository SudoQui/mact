export function formatDistance(distanceMeters?: number) {
  if (typeof distanceMeters !== 'number' || Number.isNaN(distanceMeters)) {
    return null;
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m away`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km away`;
}
