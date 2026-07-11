import { FORMAT_CODE, SNAPSHOT_TTL_MS } from "../config";
import { metaCache } from "./metaCache";
import { fetchPokemonDetail } from "./pikalytics";
import type { PokemonDetail } from "../types";

/**
 * Cache-first detail loader shared by usePokemonDetail and the bring
 * panel: fresh cache wins, otherwise fetch and persist, otherwise fall
 * back to whatever stale cache exists. Null = no data anywhere.
 */
export async function loadDetailCached(
  name: string,
): Promise<PokemonDetail | null> {
  const cached = await metaCache.getDetail(FORMAT_CODE, name).catch(() => null);
  if (cached && Date.now() - cached.fetchedAt < SNAPSHOT_TTL_MS) return cached;
  try {
    const fresh = await fetchPokemonDetail(name);
    await metaCache.setDetail(FORMAT_CODE, fresh).catch(() => {});
    return fresh;
  } catch {
    return cached;
  }
}
