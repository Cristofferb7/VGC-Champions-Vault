import { useEffect, useState } from "react";
import { computeBringLikelihood, type BringEstimate } from "../lib/bringLikelihood";
import { loadDetailCached } from "../lib/detailLoader";
import type { Pokemon, PokemonDetail, UsageEntry } from "../types";

/**
 * Bring-likelihood estimates for a complete (6-mon) opponent preview.
 * Fetches all six details in parallel (cache-first) for teammate signals.
 */
export function useBringLikelihood(
  opponentTeam: Pokemon[],
  entries: UsageEntry[],
) {
  const [estimates, setEstimates] = useState<BringEstimate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const complete = opponentTeam.length === 6;

  useEffect(() => {
    if (!complete || entries.length === 0) {
      setEstimates(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const pairs = await Promise.all(
        opponentTeam.map(
          async (poke) =>
            [poke.name, await loadDetailCached(poke.name)] as const,
        ),
      );
      if (cancelled) return;
      const details: Record<string, PokemonDetail | null> =
        Object.fromEntries(pairs);
      setEstimates(
        computeBringLikelihood(
          opponentTeam.map((poke) => poke.name),
          entries,
          details,
        ),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [opponentTeam, entries, complete]);

  return { estimates, loading, complete };
}
