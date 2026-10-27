// Rewards for a finished lesson or checkpoint, from its 0–100 score.

export const starsFor = (score) => (score >= 90 ? 3 : score >= 70 ? 2 : 1);

// The first completion pays the full reward (checkpoints pay double); a replay
// still earns a little so practice counts. A perfect score adds a bonus.
export const xpFor = ({ type, firstCompletion, score }) => {
  const baseXp = type === "checkpoint" ? 20 : 10;
  return (firstCompletion ? baseXp : 5) + (score === 100 ? 5 : 0);
};
