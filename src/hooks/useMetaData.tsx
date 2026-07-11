import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FORMAT_CODE, SNAPSHOT_TTL_MS } from "../config";
import { metaCache } from "../lib/metaCache";
import { fetchFormatSnapshot } from "../lib/pikalytics";
import type { MetaSnapshot, SyncStatus } from "../types";

interface MetaDataStore {
  status: SyncStatus;
  snapshot: MetaSnapshot | null;
  /** Re-sync from Pikalytics (retry CTA / pull-to-refresh). */
  refresh: () => void;
}

const MetaDataContext = createContext<MetaDataStore | null>(null);

/**
 * Owns the format meta snapshot: boots from IndexedDB, then revalidates
 * against Pikalytics with If-Modified-Since. One instance for the whole
 * app so the header sync pill and every screen agree on cache state.
 */
function useMetaDataStore(): MetaDataStore {
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [snapshot, setSnapshot] = useState<MetaSnapshot | null>(null);
  const syncing = useRef(false);

  const sync = useCallback(async () => {
    if (syncing.current) return;
    syncing.current = true;

    const cached = await metaCache.getSnapshot(FORMAT_CODE).catch(() => null);
    if (cached) {
      setSnapshot(cached);
      setStatus(
        Date.now() - cached.fetchedAt < SNAPSHOT_TTL_MS ? "fresh" : "stale",
      );
    }

    setStatus("syncing");
    try {
      const result = await fetchFormatSnapshot(cached?.lastModified ?? null);
      const next: MetaSnapshot =
        result === "not-modified"
          ? { ...cached!, fetchedAt: Date.now() }
          : result;
      await metaCache.setSnapshot(next).catch(() => {});
      setSnapshot(next);
      setStatus("fresh");
    } catch {
      // Offline or API down: cached snapshot keeps working, honestly labeled.
      setStatus(cached ? "stale" : "error");
    } finally {
      syncing.current = false;
    }
  }, []);

  useEffect(() => {
    void sync();
  }, [sync]);

  return { status, snapshot, refresh: sync };
}

export function MetaDataProvider({ children }: { children: ReactNode }) {
  const store = useMetaDataStore();
  return (
    <MetaDataContext.Provider value={store}>
      {children}
    </MetaDataContext.Provider>
  );
}

export function useMetaData(): MetaDataStore {
  const store = useContext(MetaDataContext);
  if (!store) throw new Error("useMetaData requires MetaDataProvider");
  return store;
}
