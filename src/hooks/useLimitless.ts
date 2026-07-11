import { useEffect, useState } from "react";
import { loadLimitless, type LimitlessSnapshot } from "../lib/limitless";

/** Module-level cache: all consumers share one load. Null while loading. */
let snapshotPromise: Promise<LimitlessSnapshot | null> | null = null;

export function useLimitless(): LimitlessSnapshot | null {
  const [snapshot, setSnapshot] = useState<LimitlessSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    snapshotPromise ??= loadLimitless();
    snapshotPromise.then((loaded) => {
      if (!cancelled) setSnapshot(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return snapshot;
}
