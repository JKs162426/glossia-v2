import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useApi } from "./useApi";

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../services/api", () => ({ default: api }));

// Kept responses last until the page reloads, so each test uses its own path.
const load = async (path, options) => {
  const hook = renderHook(() => useApi(path, options));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook.result.current;
};

beforeEach(() => {
  api.get.mockReset();
  api.get.mockResolvedValue({ data: { words: ["perro"] } });
});

describe("useApi", () => {
  it("asks again every time without the cache", async () => {
    await load("/favorites");
    await load("/favorites");
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("with the cache, reuses the first response instead of asking again", async () => {
    await load("/categories/1/deck", { cache: true });
    const { result } = renderHook(() => useApi("/categories/1/deck", { cache: true }));

    // Ready on the first render: no loader flashes.
    expect(result.current).toMatchObject({ loading: false, data: { words: ["perro"] } });
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("doesn't keep an error, so the next visit tries again", async () => {
    api.get.mockRejectedValueOnce(new Error("offline"));
    expect((await load("/categories/2/deck", { cache: true })).error).toBeTruthy();

    expect((await load("/categories/2/deck", { cache: true })).data).toEqual({ words: ["perro"] });
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
