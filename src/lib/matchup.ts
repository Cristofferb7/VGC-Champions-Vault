import { TYPE_CHART } from "../data/typeChart";
import type { SmogonStore } from "./smogon";
import type { MatchupCellResult, Pokemon, TypeName } from "../types";

/**
 * Best STAB multiplier the attacker can land on the defender's type combo.
 * (Multipliers stack across the defender's types; we take the attacker's
 * best option since a player will always click their strongest move.)
 */
export function offensiveEdge(
  attackTypes: TypeName[],
  defendTypes: TypeName[],
): number {
  // Unknown typing (species outside the lexicon) → neutral, never fake.
  if (attackTypes.length === 0 || defendTypes.length === 0) return 1;
  return Math.max(
    ...attackTypes.map((attack) =>
      defendTypes.reduce(
        (multiplier, defend) => multiplier * (TYPE_CHART[attack][defend] ?? 1),
        1,
      ),
    ),
  );
}

/**
 * Verdict for one grid cell: compare the user's best offensive multiplier
 * against the opponent's. Whoever hits harder "wins" the cell.
 */
export function evaluateMatchup(
  mine: Pokemon,
  theirs: Pokemon,
): MatchupCellResult {
  const myEdge = offensiveEdge(mine.types, theirs.types);
  const theirEdge = offensiveEdge(theirs.types, mine.types);

  if (myEdge > theirEdge) return { verdict: "Good", myEdge, theirEdge };
  if (theirEdge > myEdge) return { verdict: "Bad", myEdge, theirEdge };
  return { verdict: "Neutral", myEdge, theirEdge };
}

export function formatMultiplier(value: number): string {
  return `${value % 1 === 0 ? value : value.toFixed(2).replace(/0+$/, "")}x`;
}

/**
 * Upgrade a type-math verdict with real Checks & Counters evidence where
 * the pairing appears in the Smogon data (all-ladder tier — see smogon.ts).
 * A qualifying C&C entry means "reliably KOs or forces out" (Smogon score
 * p−4d > 0, n ≥ 20), so it overrides type math; when both directions
 * qualify (mutual pressure), the higher score wins. Cells that used real
 * data carry `real` so the grid can tag them and the detail sheet can
 * explain the evidence.
 */
export function blendWithRealData(
  base: MatchupCellResult,
  mine: Pokemon,
  theirs: Pokemon,
  smogon: SmogonStore,
): MatchupCellResult {
  // counters(X) lists what beats X.
  const mineBeatsTheirs = smogon
    .counters(theirs.name)
    .find((c) => c.name.toUpperCase() === mine.name.toUpperCase());
  const theirsBeatsMine = smogon
    .counters(mine.name)
    .find((c) => c.name.toUpperCase() === theirs.name.toUpperCase());

  const winner =
    (mineBeatsTheirs?.score ?? 0) >= (theirsBeatsMine?.score ?? 0)
      ? mineBeatsTheirs
      : theirsBeatsMine;
  if (!winner) return base;

  const favors = winner === mineBeatsTheirs ? "mine" : "theirs";
  return {
    ...base,
    verdict: favors === "mine" ? "Good" : "Bad",
    real: { favors, p: winner.p, n: winner.n, score: winner.score },
  };
}
