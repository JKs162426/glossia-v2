// The last streak the dashboard showed, per user and only in this browser,
// so the "+1" next to the streak appears once, the first time it goes up.
const keyFor = (userId) => `glossia:last-streak:${userId}`;

// How much the streak grew since the last visit (0 on the first visit).
export function streakIncrease(userId, streak) {
  try {
    const last = localStorage.getItem(keyFor(userId));
    return last === null ? 0 : Math.max(0, streak - Number(last));
  } catch {
    return 0; // storage blocked (private mode, disabled cookies)
  }
}

export function rememberStreak(userId, streak) {
  try {
    localStorage.setItem(keyFor(userId), String(streak));
  } catch {
    /* storage blocked: the "+1" just won't show */
  }
}
