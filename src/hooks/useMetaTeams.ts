import { useMemo, useState } from "react";
import type { TeamsSort, TeamsView, TopTeam } from "../types";
import { useMetaData } from "./useMetaData";

export interface RankedTopTeam extends TopTeam {
  /** Tournament win rate from the record. */
  winRate: number;
  /** Win-rate bar width on a fixed 40–100% scale, identical for all rows. */
  barWidth: string;
}

/** Fixed zoomed scale for win-rate bars; the same for every row. */
const BAR_SCALE = { min: 40, max: 100 };

/** Owns the Teams Registry: view toggle, sorting, real Pikalytics teams. */
export function useMetaTeams() {
  const [view, setView] = useState<TeamsView>("top");
  const [sortBy, setSortBy] = useState<TeamsSort>("mostTeams");
  const { snapshot, status } = useMetaData();

  const teams = useMemo<RankedTopTeam[]>(() => {
    const ranked = (snapshot?.topTeams ?? []).map((team) => {
      const games = team.wins + team.losses + team.ties;
      const winRate = games ? (team.wins / games) * 100 : 0;
      const clamped = Math.min(Math.max(winRate, BAR_SCALE.min), BAR_SCALE.max);
      return {
        ...team,
        winRate,
        barWidth: `${Math.round(
          ((clamped - BAR_SCALE.min) / (BAR_SCALE.max - BAR_SCALE.min)) * 100,
        )}%`,
      };
    });

    return ranked.sort((a, b) => {
      switch (sortBy) {
        case "winRate":
          return b.winRate - a.winRate;
        case "record":
          return b.wins - b.losses - (a.wins - a.losses);
        case "mostTeams":
          return a.rank - b.rank;
      }
    });
  }, [snapshot, sortBy]);

  return { view, setView, sortBy, setSortBy, teams, status };
}
