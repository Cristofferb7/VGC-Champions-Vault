import type { PokemonDetail, UsageEntry } from "../types";

export interface BringEstimate {
  name: string;
  /** Usage-based likelihood this Pokémon is among the 4 brings (0–99%). */
  pct: number;
  /** Ladder games backing the estimate (0 = species not in usage data). */
  games: number;
  /** How many of the other five list this one as a common teammate. */
  synergies: number;
}

/** Boost per teammate co-occurrence — a shape prior, not a fitted weight. */
const SYNERGY_BOOST = 0.15;
/**
 * Blend weight for archetype evidence (sprint 6): when the opponent team
 * confidently matches a tournament cluster, a species carried by (say)
 * 80% of that cluster's teams gets up to a 1 + 0.5×0.8 = 1.4× boost.
 * A shape prior like SYNERGY_BOOST — documented, not fitted.
 */
const ARCHETYPE_BLEND_WEIGHT = 0.5;

/**
 * Rank which 4 of the opponent's 6 they most likely bring (doubles).
 * Signal is honest but indirect: overall ladder usage (games played) as a
 * popularity prior, boosted when other team members list this species as
 * a common teammate. These are NOT real bring rates — the API doesn't
 * publish any — and the UI must say so.
 */
export function computeBringLikelihood(
  team: string[],
  entries: UsageEntry[],
  details: Record<string, PokemonDetail | null>,
  /** name(normalized-ish) → in-cluster carry frequency % from Limitless. */
  archetypeFreq?: Record<string, number>,
): BringEstimate[] {
  const archetypeLookup = new Map(
    Object.entries(archetypeFreq ?? {}).map(([name, freq]) => [
      name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      freq,
    ]),
  );
  const gamesByName = new Map(
    entries.map((entry) => [
      entry.name.toLowerCase(),
      entry.wins + entry.losses + entry.ties,
    ]),
  );
  const minGames = Math.min(
    ...team.map((name) => gamesByName.get(name.toLowerCase()) ?? Infinity),
    Infinity,
  );

  const scored = team.map((name) => {
    // Species absent from usage data get the weakest teammate's weight —
    // conservative, and avoids zeroing out legitimate off-meta picks.
    const games =
      gamesByName.get(name.toLowerCase()) ??
      (Number.isFinite(minGames) ? minGames : 1);

    const synergies = team.filter(
      (other) =>
        other !== name &&
        details[other]?.teammates.some(
          (mate) => mate.name.toLowerCase() === name.toLowerCase(),
        ),
    ).length;

    const clusterFreq =
      archetypeLookup.get(name.toLowerCase().replace(/[^a-z0-9]/g, "")) ?? 0;
    return {
      name,
      games,
      synergies,
      score:
        games *
        (1 + SYNERGY_BOOST * synergies) *
        (1 + ARCHETYPE_BLEND_WEIGHT * (clusterFreq / 100)),
    };
  });

  const total = scored.reduce((sum, entry) => sum + entry.score, 0) || 1;
  return scored
    .map(({ name, synergies, score }) => ({
      name,
      games: gamesByName.get(name.toLowerCase()) ?? 0,
      synergies,
      // 4 brings out of 6 → likelihoods sum to ~400%.
      pct: Math.min(99, Math.round((score / total) * 400)),
    }))
    .sort((a, b) => b.pct - a.pct);
}
