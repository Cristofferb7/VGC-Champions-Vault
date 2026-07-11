import { useEffect, useState } from "react";

/**
 * Ask the browser for persistent storage on boot so IndexedDB (rosters +
 * meta snapshot) survives storage pressure — meaningful on iOS 17+
 * home-screen installs. Result is surfaced in the sync pill tooltip.
 */
export function useStoragePersist(): boolean | null {
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!navigator.storage?.persist) return;
    navigator.storage
      .persisted()
      .then((already) => (already ? true : navigator.storage.persist()))
      .then(setPersisted)
      .catch(() => setPersisted(null));
  }, []);

  return persisted;
}
