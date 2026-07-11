import { useEffect, useState } from "react";
import { loadSmogonStore, type SmogonStore } from "../lib/smogon";

/** Module-level cache: all consumers share one load. */
let storePromise: Promise<SmogonStore> | null = null;

/**
 * Smogon snapshot access. Null while loading; a store with empty `months`
 * means the data is unavailable (offline, no cache) and Smogon-derived UI
 * should not render.
 */
export function useSmogon(): SmogonStore | null {
  const [store, setStore] = useState<SmogonStore | null>(null);

  useEffect(() => {
    let cancelled = false;
    storePromise ??= loadSmogonStore();
    storePromise.then((loaded) => {
      if (!cancelled) setStore(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return store;
}
