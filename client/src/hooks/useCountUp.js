import { useEffect, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

// Counts from 0 up to `target`, e.g. the "+15 XP" on the results screen.
// With reduced motion the final number is shown right away.
export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0);
  const instant = prefersReducedMotion();

  useEffect(() => {
    if (instant) return;
    let frame;
    let start;
    const tick = (now) => {
      start ??= now;
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out: fast at first, slowing down near the target.
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, instant]);

  return instant ? target : value;
}
