import { metaCache } from "./metaCache";
import { normalizeSpeciesName } from "./smogon";
import { fetchSnapshot } from "./snapshotFetch";

/**
 * Client for the repo-committed Limitless archetype snapshot
 * (public/snapshots/limitless/, built weekly by
 * scripts/build-limitless-snapshot.mjs). Clusters come from real
 * tournament team sheets — label every number "tournament data ·
 * Limitless · n=X teams". Network-first (the file changes weekly),
 * IndexedDB fallback for offline.
 */

export interface ArchetypeExample {
  player: string;
  event: string;
  placing: number;
  species: string[];
}

export interface ArchetypeCluster {
  id: number;
  name: string;
  teams: number;
  sharePct: number;
  avgPlacingPctl: number | null;
  core: Array<{ name: string; freq: number }>;
  /** Sparse centroid: species → in-cluster frequency % (≥5%). */
  centroid: Record<string, number>;
  examples: ArchetypeExample[];
}

export interface LimitlessSnapshot {
  regulation: string;
  source: string;
  updated: string;
  tournamentCount: number;
  teamCount: number;
  clusters: ArchetypeCluster[];
}

const CACHE_KEY = "limitless:reg-mb";

export async function loadLimitless(): Promise<LimitlessSnapshot | null> {
  try {
    const res = await fetchSnapshot("/snapshots/limitless/reg-mb.json");
    if (!res.ok) throw new Error(String(res.status));
    const snap = (await res.json()) as LimitlessSnapshot;
    await metaCache.setSmogonMonth(CACHE_KEY, snap).catch(() => {});
    return snap;
  } catch {
    return metaCache
      .getSmogonMonth<LimitlessSnapshot>(CACHE_KEY)
      .catch(() => null);
  }
}

export interface ArchetypeMatch {
  cluster: ArchetypeCluster;
  /** Cosine similarity 0–1 between the team and the cluster centroid. */
  similarity: number;
}

/**
 * Below this we say "no clear archetype match" rather than force-fitting.
 * Calibrated against real cluster members (2026-07): centroids are diffuse,
 * so even true members score 0.57–0.88 and a correct borderline match sat
 * at 0.46; 0.5 rejected ~30% of genuine members, 0.45 keeps them while
 * junk teams still score ≤0.07 on wrong clusters.
 */
export const ARCHETYPE_MATCH_THRESHOLD = 0.45;

/** Best-matching archetype for a 6-species team, or null under threshold. */
export function matchArchetype(
  species: string[],
  clusters: ArchetypeCluster[],
): ArchetypeMatch | null {
  const team = new Set(species.map(normalizeSpeciesName));
  let best: ArchetypeMatch | null = null;

  for (const cluster of clusters) {
    if (cluster.id === -1) continue; // "Other" is not a match target
    const entries = Object.entries(cluster.centroid);
    if (entries.length === 0) continue;
    let dot = 0;
    let centroidNorm = 0;
    for (const [name, freqPct] of entries) {
      const w = freqPct / 100;
      centroidNorm += w * w;
      if (team.has(normalizeSpeciesName(name))) dot += w;
    }
    const similarity =
      dot / (Math.sqrt(team.size) * Math.sqrt(centroidNorm) || 1);
    if (!best || similarity > best.similarity) best = { cluster, similarity };
  }

  return best && best.similarity >= ARCHETYPE_MATCH_THRESHOLD ? best : null;
}
