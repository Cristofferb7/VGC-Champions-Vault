import { TYPE_CHART } from "../data/typeChart";
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
