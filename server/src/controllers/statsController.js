import {
  getCounts,
  getActivityDays,
  getRecentFavorites,
  getRecentSessions,
} from "../models/statsModel.js";
import { getLessonProgress } from "../models/progressModel.js";
import { buildPath, findCurrentNode } from "../services/curriculumService.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const toDay = (iso) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (ms) => new Date(ms).toISOString().slice(0, 10);

// Consecutive active days ending today — or yesterday, so the streak isn't
// shown as lost before the user had a chance to practice today.
const computeStreak = (days, today) => {
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

const lastSevenDays = (days, today) => {
  const xpByDay = new Map(days.map((d) => [d.day, d.xp]));
  return Array.from({ length: 7 }, (_, i) => {
    const day = toIso(toDay(today) - (6 - i) * DAY_MS);
    return { day, xp: xpByDay.get(day) || 0 };
  });
};

export const getOverview = async (req, res) => {
  const userId = req.user.id;
  const { language } = req.query;

  const [counts, activity, recentFavorites, recentSessions, progress] =
    await Promise.all([
      getCounts(userId, language),
      getActivityDays(userId),
      getRecentFavorites(userId),
      getRecentSessions(userId),
      getLessonProgress(userId, language),
    ]);

  const levels = buildPath(progress);
  const current = findCurrentNode(new Set(progress.keys()));

  res.json({
    ...counts,
    streak: computeStreak(activity.rows, activity.today),
    week: lastSevenDays(activity.rows, activity.today),
    recentFavorites,
    recentSessions,
    levels: levels.map(({ id, title, completed, total }) => ({
      id,
      title,
      completed,
      total,
    })),
    nextLesson: current && {
      id: current.id,
      type: current.type,
      title: current.title,
      level: current.level,
      unitTitle: current.unitTitle,
      unitIcon: current.unitIcon,
    },
  });
};
