import {
  getCounts,
  getActivityDays,
  getRecentFavorites,
  getRecentSessions,
} from "../models/statsModel.js";
import { getLessonProgress } from "../models/progressModel.js";
import { buildPath, findCurrentNode } from "../services/curriculumService.js";
import { computeStreak, lastSevenDays } from "../services/activityService.js";

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
