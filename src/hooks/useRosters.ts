import { useCallback, useEffect, useRef, useState } from "react";
import { SEED_ROSTERS } from "../data/teams";
import { metaCache } from "../lib/metaCache";
import type { Roster } from "../types";

function nextRosterId(current: Roster[]): number {
  return current.length
    ? Math.max(...current.map((roster) => roster.id)) + 1
    : 1;
}

/**
 * Owns saved rosters: selection, creation, editing. IndexedDB is the
 * source of truth; data/teams.ts only seeds the very first launch.
 */
export function useRosters() {
  const [rosters, setRostersState] = useState<Roster[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      const stored = await metaCache.getRosters().catch(() => null);
      const initial = stored ?? SEED_ROSTERS;
      setRostersState(initial);
      setSelectedId((current) => current || (initial[0]?.id ?? 0));
      hydrated.current = true;
      setLoaded(true);
    })();
  }, []);

  /** Single write path: update state and persist. */
  const setRosters = useCallback((next: Roster[]) => {
    setRostersState(next);
    if (hydrated.current) void metaCache.setRosters(next).catch(() => {});
  }, []);

  const selectRoster = useCallback((id: number) => setSelectedId(id), []);

  const addRoster = useCallback(
    (name?: string, species: string[] = []) => {
      const nextId = nextRosterId(rosters);
      const created: Roster = {
        id: nextId,
        name: name ?? `TEAM ${nextId}`,
        species,
      };
      setRosters([...rosters, created]);
      setSelectedId(nextId);
      return created;
    },
    [rosters, setRosters],
  );

  const duplicateRoster = useCallback(
    (id: number) => {
      const source = rosters.find((roster) => roster.id === id);
      if (!source) return;
      const nextId = nextRosterId(rosters);
      setRosters([
        ...rosters,
        { id: nextId, name: `${source.name} COPY`, species: [...source.species] },
      ]);
      setSelectedId(nextId);
    },
    [rosters, setRosters],
  );

  const removeRoster = useCallback(
    (id: number) => {
      const remaining = rosters.filter((roster) => roster.id !== id);
      setRosters(remaining);
      if (selectedId === id) setSelectedId(remaining[0]?.id ?? 0);
    },
    [rosters, selectedId, setRosters],
  );

  return {
    rosters,
    loaded,
    selectedId,
    selectRoster,
    addRoster,
    duplicateRoster,
    removeRoster,
  };
}
