import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SEED_ROSTERS } from "../data/teams";
import { metaCache } from "../lib/metaCache";
import type { Roster } from "../types";

/**
 * Roster persistence rules (QA round 2 asked for these to be explicit):
 *
 * 1. IndexedDB (`rosters:v1`) is the single source of truth. SEED_ROSTERS
 *    apply ONLY when the key has never been written (`stored === null`).
 * 2. Deleting every roster persists `[]`, which is a real value — the app
 *    does NOT re-seed on next boot.
 * 3. One store instance app-wide (context provider). The earlier design had
 *    a hook instance per screen; two live instances could clobber each
 *    other's IndexedDB writes (e.g. saving a clone from a Teams-screen
 *    instance that hydrated before a Home-screen write landed).
 * 4. Mutations are ignored until hydration completes, so a tap racing the
 *    initial IndexedDB read can never overwrite stored rosters with seeds.
 *
 * (The sprint-log "missing clone" scare was a red herring — the carousel
 * was horizontally scrolled; IndexedDB had all four rosters. The races
 * above were real hazards regardless, hence the provider.)
 */

function nextRosterId(current: Roster[]): number {
  return current.length
    ? Math.max(...current.map((roster) => roster.id)) + 1
    : 1;
}

interface RostersStore {
  rosters: Roster[];
  loaded: boolean;
  selectedId: number;
  selectRoster: (id: number) => void;
  addRoster: (name?: string, species?: string[]) => void;
  duplicateRoster: (id: number) => void;
  removeRoster: (id: number) => void;
}

const RostersContext = createContext<RostersStore | null>(null);

function useRostersStore(): RostersStore {
  const [rosters, setRostersState] = useState<Roster[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      const stored = await metaCache.getRosters().catch(() => null);
      const initial = stored ?? SEED_ROSTERS; // rule 1: seed only on null
      setRostersState(initial);
      setSelectedId((current) => current || (initial[0]?.id ?? 0));
      hydrated.current = true;
      setLoaded(true);
    })();
  }, []);

  /** Single write path: update state and persist (rules 3–4). */
  const setRosters = useCallback((next: Roster[]) => {
    if (!hydrated.current) return;
    setRostersState(next);
    void metaCache.setRosters(next).catch(() => {});
  }, []);

  const selectRoster = useCallback((id: number) => setSelectedId(id), []);

  const addRoster = useCallback(
    (name?: string, species: string[] = []) => {
      const nextId = nextRosterId(rosters);
      setRosters([
        ...rosters,
        { id: nextId, name: name ?? `TEAM ${nextId}`, species },
      ]);
      setSelectedId(nextId);
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

export function RostersProvider({ children }: { children: ReactNode }) {
  const store = useRostersStore();
  return (
    <RostersContext.Provider value={store}>{children}</RostersContext.Provider>
  );
}

export function useRosters(): RostersStore {
  const store = useContext(RostersContext);
  if (!store) throw new Error("useRosters requires RostersProvider");
  return store;
}
