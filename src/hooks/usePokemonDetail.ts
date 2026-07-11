import { useEffect, useState } from "react";
import { FORMAT_CODE, SNAPSHOT_TTL_MS } from "../config";
import { metaCache } from "../lib/metaCache";
import { fetchPokemonDetail } from "../lib/pikalytics";
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
      const cached = await metaCache
        .getDetail(FORMAT_CODE, name)
        .catch(() => null);
      if (cancelled) return;

      if (cached && Date.now() - cached.fetchedAt < SNAPSHOT_TTL_MS) {
        setState({ detail: cached, loading: false, error: false });
        return;
      }
      if (cached) setState({ detail: cached, loading: true, error: false });

      try {
        const fresh = await fetchPokemonDetail(name);
        await metaCache.setDetail(FORMAT_CODE, fresh).catch(() => {});
        if (!cancelled) setState({ detail: fresh, loading: false, error: false });
      } catch {
        if (!cancelled)
          setState({ detail: cached, loading: false, error: !cached });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [name]);

  return state;
}
