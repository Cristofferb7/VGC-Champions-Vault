import { metaCache } from "./metaCache";
import { fetchSnapshot } from "./snapshotFetch";

/**
 * Client for the repo-committed monthly Smogon snapshots
 * (public/snapshots/smogon/, built by scripts/build-smogon-snapshot.mjs).
 * Same-origin fetch — no CORS, no proxy. Monthly files are immutable once
 * published, so they cache in IndexedDB forever; only index.json is
 * re-fetched.
 *
 * Every number from here is SHOWDOWN LADDER data, not cartridge — callers
 * must render the source label (`monthLabel`, tier name) next to it.
 */

export type SmogonTierId = "all" | "top";

export const TIER_LABELS: Record<SmogonTierId, string> = {
  all: "all ladder",
  top: "top ladder (1760+)",
};

export interface SmogonCounter {
  name: string;
  /** Weighted encounter sample. */
  n: number;
  /** KO-or-forced-switch rate, 0–100. */
  p: number;
  /** Smogon confidence score (p − 4d), 0–100. */
  score: number;
}

export interface SmogonSpread {
  nature: string;
  /** Champions 0–32 training values, HP/Atk/Def/SpA/SpD/Spe. */
  evs: string;
  pct: number;
}

export interface SmogonTier {
  usage: number;
  moves: Array<{ name: string; pct: number }>;
  items: Array<{ name: string; pct: number }>;
  abilities: Array<{ name: string; pct: number }>;
  spreads: SmogonSpread[];
  teammates: Array<{ name: string; pct: number }>;
  counters: SmogonCounter[];
  leadPct: number | null;
}

export interface SmogonSnapshot {
  format: string;
  month: string;
  source: string;
  generated: string;
  battles: Record<SmogonTierId, number>;
  species: Record<string, Partial<Record<SmogonTierId, SmogonTier>>>;
}

export interface UsageHistoryPoint {
  month: string;
  usage: number;
}

/** Join key across Pikalytics/Smogon/lexicon name spellings. */
export function normalizeSpeciesName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function fetchJson<T>(path: string): Promise<T> {
  // Deployed-origin first, bundled copy second inside the APK (on web
  // this is a plain same-origin fetch) — see snapshotFetch.
  const res = await fetchSnapshot(path);
  return res.json() as Promise<T>;
}

export interface SmogonStore {
  /** Months available, oldest → newest. Empty = data unavailable. */
  months: string[];
  latest: SmogonSnapshot | null;
  /** e.g. "Jun 2026" — REQUIRED next to any Smogon-derived number. */
  monthLabel: string;
  lookup: (name: string, tier: SmogonTierId) => SmogonTier | null;
  /**
   * C&C always reads the all-ladder tier: at the 1760 cutoff the weighted
   * samples collapse and nearly every species has zero qualifying entries.
   */
  counters: (name: string) => SmogonCounter[];
  /** Usage-over-time for the sparkline (all-ladder tier). */
  history: (name: string) => UsageHistoryPoint[];
}

const EMPTY_STORE: SmogonStore = {
  months: [],
  latest: null,
  monthLabel: "",
  lookup: () => null,
  counters: () => [],
  history: () => [],
};

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`;
}

async function loadMonth(month: string): Promise<SmogonSnapshot | null> {
  const cached = await metaCache
    .getSmogonMonth<SmogonSnapshot>(month)
    .catch(() => null);
  if (cached) return cached;
  try {
    const snap = await fetchJson<SmogonSnapshot>(
      `/snapshots/smogon/${month}.json`,
    );
    await metaCache.setSmogonMonth(month, snap).catch(() => {});
    return snap;
  } catch {
    return null;
  }
}

export async function loadSmogonStore(): Promise<SmogonStore> {
  let months: string[];
  try {
    ({ months } = await fetchJson<{ months: string[] }>(
      "/snapshots/smogon/index.json",
    ));
  } catch {
    return EMPTY_STORE; // offline with no cache — features simply hide
  }

  const snapshots = (
    await Promise.all(months.map((month) => loadMonth(month)))
  ).filter((snap): snap is SmogonSnapshot => snap !== null);
  if (snapshots.length === 0) return EMPTY_STORE;

  const latest = snapshots[snapshots.length - 1];

  // Normalized-name lookup per snapshot.
  const maps = snapshots.map(
    (snap) =>
      new Map(
        Object.entries(snap.species).map(([name, tiers]) => [
          normalizeSpeciesName(name),
          tiers,
        ]),
      ),
  );
  const latestMap = maps[maps.length - 1];

  return {
    months: snapshots.map((snap) => snap.month),
    latest,
    monthLabel: formatMonthLabel(latest.month),
    lookup: (name, tier) =>
      latestMap.get(normalizeSpeciesName(name))?.[tier] ?? null,
    counters: (name) =>
      latestMap.get(normalizeSpeciesName(name))?.all?.counters ?? [],
    history: (name) => {
      const key = normalizeSpeciesName(name);
      return snapshots.flatMap((snap, i) => {
        const tier = maps[i].get(key)?.all;
        return tier ? [{ month: snap.month, usage: tier.usage }] : [];
      });
    },
  };
}
