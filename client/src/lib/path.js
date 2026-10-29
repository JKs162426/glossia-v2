// What to celebrate on the learning path when the learner comes back from
// finishing `justCompletedId` for the first time: that node, the node it
// unlocked and, when the unlocked node starts a new level, that level.
export function celebrationFor(levels, justCompletedId) {
  const none = { completedId: null, unlockedId: null, openedLevelId: null };
  if (!levels || !justCompletedId) return none;

  const nodes = levels.flatMap((level) =>
    level.units.flatMap((unit) => unit.nodes.map((node) => ({ ...node, level: level.id }))),
  );
  const i = nodes.findIndex((node) => node.id === justCompletedId);
  if (i === -1 || nodes[i].status !== "completed") return none;

  const next = nodes[i + 1]?.status === "current" ? nodes[i + 1] : null;
  return {
    completedId: justCompletedId,
    unlockedId: next?.id ?? null,
    openedLevelId: next && next.level !== nodes[i].level ? next.level : null,
  };
}
