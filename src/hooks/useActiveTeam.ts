import { useCallback, useMemo, useState } from "react";
import { ACTIVE_TEAM, ACTIVE_TEAM_RECORD } from "../data/teams";
import { computeTeamWeaknesses } from "../lib/teamAnalysis";
import type { TypeName } from "../types";

/**
 * The user's saved team plus derived facts the hero card displays:
 * ladder record and the team's shared defensive weaknesses (a chip per
 * type that threatens 2+ members; tap to see who).
 */
export function useActiveTeam() {
  const weaknesses = useMemo(() => computeTeamWeaknesses(ACTIVE_TEAM), []);

  const [expandedWeakness, setExpandedWeakness] = useState<TypeName | null>(
    null,
  );

  const toggleWeakness = useCallback((type: TypeName) => {
    setExpandedWeakness((current) => (current === type ? null : type));
  }, []);

  return {
    team: ACTIVE_TEAM,
    record: ACTIVE_TEAM_RECORD,
    formatLabel: "Reg M-B | Season 3",
    weaknesses,
    expandedWeakness,
    toggleWeakness,
  };
}
