// Streak and weekly XP from activity_days rows ({ day: "YYYY-MM-DD", xp }).
// Dates are handled as UTC midnights so the math never shifts with DST.

const DAY_MS = 24 * 60 * 60 * 1000;
const toDay = (iso) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (ms) => new Date(ms).toISOString().slice(0, 10);

// Consecutive active days ending today — or yesterday, so the streak isn't
// shown as lost before the user had a chance to practice today.
export const computeStreak = (days, today) => {
  const active = new Set(days.map((d) => d.day));
  let cursor = toDay(today);
  if (!active.has(today)) cursor -= DAY_MS;

  let streak = 0;
  while (active.has(toIso(cursor))) {
    streak++;
    cursor -= DAY_MS;
  }
  return streak;
};

// XP for each of the last 7 days, oldest first, with 0 for inactive days.
export const lastSevenDays = (days, today) => {
  const xpByDay = new Map(days.map((d) => [d.day, d.xp]));
  return Array.from({ length: 7 }, (_, i) => {
    const day = toIso(toDay(today) - (6 - i) * DAY_MS);
    return { day, xp: xpByDay.get(day) || 0 };
  });
};
