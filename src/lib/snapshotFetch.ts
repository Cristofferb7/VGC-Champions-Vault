import { API_ORIGIN, withApiOrigin } from "../config";

/**
 * Fetch a repo-committed snapshot file. On web this is a plain
 * same-origin fetch. In the APK the deployed origin is tried first
 * (weekly-fresh data), falling back to the copy bundled into the app at
 * build time — so first launch works fully offline, just with
 * build-date data.
 */
export async function fetchSnapshot(path: string): Promise<Response> {
  const res = await fetch(withApiOrigin(path)).catch(() => null);
  if (res?.ok) return res;
  if (API_ORIGIN) {
    const bundled = await fetch(path);
    if (bundled.ok) return bundled;
  }
  throw new Error(`snapshot unavailable: ${path}`);
}
