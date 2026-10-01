import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { errorMessage } from "../lib/utils";

// GET `path` whenever it changes. `loading` is derived (the stored result
// belongs to another path) so the effect never sets state synchronously.
export function useApi(path) {
  const [result, setResult] = useState({ path: null, data: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    api.get(path).then(
      (res) => !cancelled && setResult({ path, data: res.data, error: null }),
      (err) =>
        !cancelled &&
        setResult({ path, data: null, error: errorMessage(err, "Couldn't load data") }),
    );
    return () => {
      cancelled = true;
    };
  }, [path, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const setData = useCallback(
    (update) =>
      setResult((r) => ({
        ...r,
        data: typeof update === "function" ? update(r.data) : update,
      })),
    [],
  );

  const loading = Boolean(path) && result.path !== path;
  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    reload,
    setData,
  };
}
