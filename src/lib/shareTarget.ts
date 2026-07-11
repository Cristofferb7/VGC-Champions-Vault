/** Mirrors src/sw.ts — the SW writes, the app consumes. */
const SHARE_CACHE = "share-target";
const SHARE_KEY = "/shared-screenshot";

/**
 * Pop the screenshot an Android share intent left in Cache Storage
 * (see the share_target handler in src/sw.ts). Returns null when there
 * is nothing pending. One-shot: the entry is deleted on read.
 */
export async function consumeSharedScreenshot(): Promise<Blob | null> {
  if (!("caches" in window)) return null;
  try {
    const cache = await caches.open(SHARE_CACHE);
    const hit = await cache.match(SHARE_KEY);
    if (!hit) return null;
    const blob = await hit.blob();
    await cache.delete(SHARE_KEY);
    return blob;
  } catch {
    return null;
  }
}

/** True when the app was launched by the OS share sheet. */
export function launchedViaShareTarget(): boolean {
  return new URLSearchParams(window.location.search).has("shared");
}

/** Strip the ?shared flag so reloads don't re-trigger the flow. */
export function clearShareTargetFlag(): void {
  window.history.replaceState({}, "", window.location.pathname);
}
