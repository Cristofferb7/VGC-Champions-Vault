import { useCallback, useMemo, useState } from "react";
import { ACTIVE_TEAM, OPPONENT_TEAM } from "../data/teams";
import { getSpecies } from "../data/speciesLexicon";
import { blendWithRealData, evaluateMatchup } from "../lib/matchup";
import { useSmogon } from "./useSmogon";
import type { MatchupCellResult, Pokemon } from "../types";

export interface SelectedMatchup {
  row: number;
  col: number;
  mine: Pokemon;
  theirs: Pokemon;
  result: MatchupCellResult;
}

/**
 * Owns the threat matrix: the opponent's entered team (manual picker;
 * screenshot recognition stays deferred per brief), the full verdict grid,
 * and which cell is expanded for detail.
 */
export function useMatchupAnalysis() {
  const [opponentTeam, setOpponentTeam] = useState<Pokemon[]>(OPPONENT_TEAM);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(
    null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const smogon = useSmogon();

  // Type math everywhere; upgraded per-cell with real C&C evidence where
  // the Smogon snapshot has the pairing (cell gets tagged via `real`).
  const matrix = useMemo(
    () =>
      ACTIVE_TEAM.map((mine) =>
        opponentTeam.map((theirs) => {
          const base = evaluateMatchup(mine, theirs);
          return smogon && smogon.months.length > 0
            ? blendWithRealData(base, mine, theirs, smogon)
            : base;
        }),
      ),
    [opponentTeam, smogon],
  );

  const selectCell = useCallback((row: number, col: number) => {
    setSelected((current) =>
      current?.row === row && current?.col === col ? null : { row, col },
    );
  }, []);

  const clearSelection = useCallback(() => setSelected(null), []);

  /** Add/remove a species from the opponent preview (max 6). */
  const toggleOpponent = useCallback((name: string) => {
    setSelected(null);
    setOpponentTeam((current) => {
      const existing = current.find(
        (poke) => poke.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) return current.filter((poke) => poke !== existing);
      if (current.length >= 6) return current;
      const species = getSpecies(name);
      return [
        ...current,
        {
          id: species?.id ?? 0,
          name: name.toUpperCase(),
          types: species?.types ?? [],
        },
      ];
    });
  }, []);

  const clearOpponents = useCallback(() => {
    setSelected(null);
    setOpponentTeam([]);
  }, []);

  /** Replace the whole preview (screenshot recognition applies here). */
  const setOpponentsByNames = useCallback((names: string[]) => {
    setSelected(null);
    setOpponentTeam(
      names.slice(0, 6).map((name) => {
        const species = getSpecies(name);
        return {
          id: species?.id ?? 0,
          name: name.toUpperCase(),
          types: species?.types ?? [],
        };
      }),
    );
  }, []);

  const selectedMatchup: SelectedMatchup | null =
    selected && opponentTeam[selected.col]
      ? {
          ...selected,
          mine: ACTIVE_TEAM[selected.row],
          theirs: opponentTeam[selected.col],
          result: matrix[selected.row][selected.col],
        }
      : null;

  return {
    myTeam: ACTIVE_TEAM,
    opponentTeam,
    matrix,
    selectedMatchup,
    selectCell,
    clearSelection,
    toggleOpponent,
    clearOpponents,
    setOpponentsByNames,
    pickerOpen,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
  };
}
