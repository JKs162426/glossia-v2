import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { errorMessage } from "../lib/utils";

// Responses kept for the rest of the visit, by path (see `cache` below).
const kept = new Map();

// GET `path` whenever it changes. `loading` is derived (the stored result
// belongs to another path) so the effect never sets state synchronously.
//
// `cache: true` keeps the response until the page reloads and reuses it
// instead of asking again. Only for content that is the same for every user
// and doesn't change during a visit, like the decks and their words.
export function useApi(path, { cache = false } = {}) {
  const [result, setResult] = useState({ path: null, data: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const cached = cache ? kept.get(path) : undefined;

  useEffect(() => {
    if (!path || cached !== undefined) return;
    let cancelled = false;
    api.get(path).then(
      (res) => {
        if (cache) kept.set(path, res.data);
        if (!cancelled) setResult({ path, data: res.data, error: null });
      },
      (err) =>
        !cancelled &&
        setResult({ path, data: null, error: errorMessage(err, "Couldn't load data") }),
    );
    return () => {
      cancelled = true;
    };
  }, [path, reloadKey, cache, cached]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const setData = useCallback(
    (update) =>
      setResult((r) => ({
        ...r,
        data: typeof update === "function" ? update(r.data) : update,
      })),
    [],
  );

  if (cached !== undefined) {
    return { data: cached, error: null, loading: false, reload, setData };
  }
  const loading = Boolean(path) && result.path !== path;
  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    reload,
    setData,
  };
}
