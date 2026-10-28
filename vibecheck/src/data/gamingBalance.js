export function activityBand(recentMinutes) {
  const average = Number.isFinite(recentMinutes) && recentMinutes > 0 ? recentMinutes / 14 : 0;
  if (average === 0) return { label: 'No recent activity', average };
  if (average < 60) return { label: 'Occasional player', average };
  if (average <= 180) return { label: 'Regular player', average };
  return { label: 'Avid player', average };
}

export function parseTarget(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const hours = Number(value);
  return Number.isFinite(hours) && hours >= 0 && hours <= 24 && Number.isInteger(hours * 4) ? hours : null;
}

export function targetComparison(averageMinutes, targetHours) {
  if (!Number.isFinite(targetHours) || targetHours < 0 || targetHours > 24) return null;
  const difference = averageMinutes / 60 - targetHours;
  return { above: difference > 0.000001, difference: Math.abs(difference) };
}
