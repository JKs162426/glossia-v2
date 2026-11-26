import request from "supertest";
import app from "../../src/app.js";

// Lessons, played through the API like the app does.

export const startLesson = (user, id, { language = "es", canSpeak = false } = {}) =>
  request(app)
    .post(`/api/learn/lessons/${id}/attempts`)
    .set("Cookie", user.cookie)
    .send({ language, canSpeak });

// The answers of a learner who knows every word, except the first `wrong`
// exercises (not counting the match), answered with a wrong option or text.
export const answersFor = (exercises, { wrong = 0 } = {}) => {
  let missed = 0;
  return exercises.map((e) => {
    if (e.type === "match") return e.pairs.map((p) => [p.term, p.term]);
    if (missed < wrong) {
      missed += 1;
      return e.options ? e.options.find((o) => o !== e.answer) : "not the word";
    }
    return e.answer;
  });
};

export const finishLesson = (user, id, body, { zone } = {}) => {
  const req = request(app).post(`/api/learn/lessons/${id}/complete`).set("Cookie", user.cookie);
  if (zone) req.set("X-Time-Zone", zone);
  return req.send({ language: "es", ...body });
};

// Opens a lesson and finishes it; `wrong` exercises are answered wrong.
export const playLesson = async (user, id, { language = "es", wrong = 0, zone } = {}) => {
  const attempt = await startLesson(user, id, { language });
  if (attempt.status !== 201) return attempt;
  return finishLesson(
    user,
    id,
    { language, attemptId: attempt.body.attemptId, answers: answersFor(attempt.body.exercises, { wrong }) },
    { zone },
  );
};
