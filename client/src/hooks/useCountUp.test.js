import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCountUp } from "./useCountUp";

describe("useCountUp", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.matchMedia;
  });

  it("counts from 0 up to the target, then stops there", () => {
    const { result } = renderHook(() => useCountUp(15, 600));
    expect(result.current).toBe(0);

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(15);

    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe(15);
  });

  it("shows the target right away when the user prefers reduced motion", () => {
    window.matchMedia = (query) => ({ matches: query.includes("reduce") });
    const { result } = renderHook(() => useCountUp(15, 600));
    expect(result.current).toBe(15);
  });

  it("never goes past the target, even when a frame comes late (background tab)", () => {
    vi.useRealTimers();
    const frames = [];
    const realRaf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = (callback) => frames.push(callback);
    try {
      const { result } = renderHook(() => useCountUp(15, 600));
      act(() => frames.shift()(0));
      act(() => frames.shift()(900)); // 300 ms after the animation should have ended
      expect(result.current).toBe(15);
    } finally {
      globalThis.requestAnimationFrame = realRaf;
    }
  });

  it("stays at 0 for a target of 0", () => {
    const { result } = renderHook(() => useCountUp(0, 600));
    act(() => vi.advanceTimersByTime(700));
    expect(result.current).toBe(0);
  });
});
