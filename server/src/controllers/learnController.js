import {
  buildPath,
  computeStatuses,
  getLevelCards,
  getNode,
  getNodeCards,
  nextNodeAfter,
} from "../services/curriculumService.js";
import { baseLanguageFor } from "../config/languages.js";
import {
  getLessonProgress,
  saveLessonResult,
  recordWordResults,
  addXp,
} from "../models/progressModel.js";

const starsFor = (score) => (score >= 90 ? 3 : score >= 70 ? 2 : 1);

// Loads the node and refuses access while it's still locked for this user.
const loadPlayableNode = async (userId, lessonId, language) => {
  const node = getNode(lessonId);
  if (!node) return { error: [404, "Lesson not found"] };

  const progress = await getLessonProgress(userId, language);
  const status = computeStatuses(new Set(progress.keys())).get(node.id);
  if (status === "locked") {
    return { error: [403, "Finish the previous lessons to unlock this one"] };
  }
  return { node, progress, status };
};

export const getPath = async (req, res) => {
  const { language } = req.query;
  const progress = await getLessonProgress(req.user.id, language);
  res.json({
    language,
    baseLanguage: baseLanguageFor(language),
    levels: buildPath(progress),
  });
};

export const getLesson = async (req, res) => {
  const { language } = req.query;
  const { node, error } = await loadPlayableNode(
    req.user.id,
    req.params.lessonId,
    language,
  );
  if (error) return res.status(error[0]).json({ message: error[1] });

  res.json({
    id: node.id,
    type: node.type,
    title: node.title,
    level: node.level,
    unitTitle: node.unitTitle,
    unitIcon: node.unitIcon,
    language,
    baseLanguage: baseLanguageFor(language),
    cards: getNodeCards(node, language),
    distractors: getLevelCards(node.level, language),
  });
};

export const completeLesson = async (req, res) => {
  const { language, correct, total } = req.body;
  const { node, status, error } = await loadPlayableNode(
    req.user.id,
    req.params.lessonId,
    language,
  );
  if (error) return res.status(error[0]).json({ message: error[1] });

  const score = Math.round((correct / total) * 100);
  const stars = starsFor(score);
  const firstCompletion = status !== "completed";
  const baseXp = node.type === "checkpoint" ? 20 : 10;
  const xp = (firstCompletion ? baseXp : 5) + (score === 100 ? 5 : 0);

  await saveLessonResult(req.user.id, language, node.id, score, stars);
  await recordWordResults(
    req.user.id,
    language,
    getNodeCards(node, language).map((card) => ({ word: card.term, correct: true })),
  );
  await addXp(req.user.id, xp);

  const next = nextNodeAfter(node.id);
  res.json({
    score,
    stars,
    xp,
    firstCompletion,
    levelCompleted: firstCompletion && (!next || next.level !== node.level),
    nextLessonId: next?.id || null,
  });
};
