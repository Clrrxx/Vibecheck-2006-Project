const traitKeys = ['O', 'C', 'E', 'A', 'N'];

// Project the existing user assessment into the only fields matching needs.
// Do not return the user record, raw answers, email, Steam data or block list.
export function matchingProfilesFromUsers(users, currentUid) {
  const profiles = {};
  for (const [uid, user] of Object.entries(users || {})) {
    if (uid === currentUid) continue;
    const report = user?.questResults?.latest;
    const scores = Object.fromEntries(traitKeys.map(key => [key, report?.traits?.[key]?.position]));
    if (!traitKeys.every(key => Number.isFinite(scores[key]) && scores[key] >= 0 && scores[key] <= 100)) continue;
    if (typeof report?.title !== 'string' || !report.title.trim()) continue;
    profiles[uid] = {
      name: typeof report.name === 'string' && report.name.trim() ? report.name.trim() : 'Adventurer',
      title: report.title,
      scores,
    };
  }
  return profiles;
}
