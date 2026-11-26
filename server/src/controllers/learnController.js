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
import { starsFor, xpFor } from "../services/scoringService.js";
import { buildExercises, gradeAnswers } from "../services/exerciseService.js";
import { createAttempt, lockAttempt, finishAttempt } from "../models/lessonAttemptModel.js";
import { withTransaction } from "../config/db.js";

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

const lessonInfo = (node, language) => ({
  id: node.id,
  type: node.type,
  title: node.title,
  level: node.level,
  unitTitle: node.unitTitle,
  unitIcon: node.unitIcon,
  language,
  baseLanguage: baseLanguageFor(language),
});

// The lesson and its words. The app plays lessons through startAttempt; this
// is the content on its own.
export const getLesson = async (req, res) => {
  const { language } = req.query;
  const { node, error } = await loadPlayableNode(
    req.user.id,
    req.params.lessonId,
    language,
  );
  if (error) return res.status(error[0]).json({ message: error[1] });

  res.json({
    ...lessonInfo(node, language),
    cards: getNodeCards(node, language),
    distractors: getLevelCards(node.level, language),
  });
};

// Opens a lesson: builds its exercises and keeps them, answers included, to
// grade what comes back (completeLesson).
export const startAttempt = async (req, res) => {
  const { language, canSpeak = false } = req.body;
  const userId = req.user.id;
  const { node, error } = await loadPlayableNode(userId, req.params.lessonId, language);
  if (error) return res.status(error[0]).json({ message: error[1] });

  const exercises = buildExercises({
    type: node.type,
    cards: getNodeCards(node, language),
    distractors: getLevelCards(node.level, language),
    language,
    canSpeak,
  });
  const attemptId = await createAttempt(userId, language, node.id, exercises);
  res.status(201).json({ ...lessonInfo(node, language), attemptId, exercises });
};

const ATTEMPT_GONE = "This lesson has expired. Start it again to save your progress.";

// Finishes an attempt: grades the learner's first answer to each exercise
// against the exercises the server built, then saves the score and the XP.
export const completeLesson = async (req, res) => {
  const { language, attemptId, answers } = req.body;
  const userId = req.user.id;
  const { node, error } = await loadPlayableNode(userId, req.params.lessonId, language);
  if (error) return res.status(error[0]).json({ message: error[1] });

  // All or nothing: the attempt, progress, words and XP are saved together.
  const outcome = await withTransaction(async (conn) => {
    const attempt = await lockAttempt(conn, { id: attemptId, userId, lessonId: node.id, language });
    if (!attempt || (attempt.expired && !attempt.completed)) return { status: 404, body: { message: ATTEMPT_GONE } };
    // Already saved (a retry after a lost response): same answer, no new XP.
    if (attempt.completed) return { status: 200, body: attempt.result };
    if (answers.length !== attempt.exercises.length) {
      return { status: 400, body: { message: "This result doesn't match the lesson" } };
    }

    const right = gradeAnswers(attempt.exercises, answers, language).filter(Boolean).length;
    const score = Math.round((right / answers.length) * 100);
    const stars = starsFor(score);
    const firstCompletion = await saveLessonResult(userId, language, node.id, score, stars, conn);
    const xp = xpFor({ type: node.type, firstCompletion, score });
    await recordWordResults(
      userId,
      language,
      getNodeCards(node, language).map((card) => ({ word: card.term, correct: true })),
      conn,
    );
    await addXp(userId, xp, req.today, conn);

    const next = nextNodeAfter(node.id);
    const result = {
      score,
      stars,
      xp,
      firstCompletion,
      levelCompleted: firstCompletion && (!next || next.level !== node.level),
      nextLessonId: next?.id || null,
    };
    await finishAttempt(conn, attemptId, result);
    return { status: 200, body: result };
  });

  res.status(outcome.status).json(outcome.body);
};
