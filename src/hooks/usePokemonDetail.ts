import { useEffect, useState } from "react";
import { loadDetailCached } from "../lib/detailLoader";
import type { PokemonDetail } from "../types";

interface DetailState {
  detail: PokemonDetail | null;
  loading: boolean;
  error: boolean;
}

/** Lazily loads one Pokémon's Pikalytics detail, cache-first. */
export function usePokemonDetail(name: string | null): DetailState {
  const [state, setState] = useState<DetailState>({
    detail: null,
    loading: false,
    error: false,
  });

  useEffect(() => {
    if (!name) {
      setState({ detail: null, loading: false, error: false });
      return;
    }

    let cancelled = false;
    setState({ detail: null, loading: true, error: false });

    (async () => {
      const detail = await loadDetailCached(name);
      if (!cancelled) setState({ detail, loading: false, error: !detail });
    })();

    return () => {
      cancelled = true;
    };
  }, [name]);

  return state;
}
