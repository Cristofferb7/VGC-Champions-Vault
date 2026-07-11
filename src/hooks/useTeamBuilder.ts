import { useCallback, useMemo, useState } from "react";
import {
  computeTeamWeaknesses,
  offensiveCoverage,
  toPokemon,
} from "../lib/teamAnalysis";

/**
 * Owns the Team Builder draft: up to 6 species plus live derived analysis
 * (shared weaknesses + offensive coverage) that updates per pick.
 */
export function useTeamBuilder() {
  const [draftName, setDraftName] = useState("NEW TEAM");
  const [species, setSpecies] = useState<string[]>([]);

  const toggleSpecies = useCallback((name: string) => {
    setSpecies((current) => {
      const existing = current.find(
        (entry) => entry.toLowerCase() === name.toLowerCase(),
      );
      if (existing) return current.filter((entry) => entry !== existing);
      return current.length >= 6 ? current : [...current, name];
    });
  }, []);

  /** Clone & edit: preload the draft from an existing team. */
  const loadDraft = useCallback((name: string, source: string[]) => {
    setDraftName(name);
    setSpecies(source.slice(0, 6));
  }, []);

  const clearDraft = useCallback(() => {
    setDraftName("NEW TEAM");
    setSpecies([]);
  }, []);

  const team = useMemo(() => species.map(toPokemon), [species]);
  const weaknesses = useMemo(() => computeTeamWeaknesses(team), [team]);
  const coverage = useMemo(() => offensiveCoverage(team), [team]);

  return {
    draftName,
    setDraftName,
    species,
    toggleSpecies,
    loadDraft,
    clearDraft,
    team,
    weaknesses,
    coverage,
  };
}
