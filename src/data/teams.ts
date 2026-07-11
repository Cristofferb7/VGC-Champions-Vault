import type { Pokemon, Roster } from "../types";

/** The user's saved competitive team (Home hero card + matchup grid rows). */
export const ACTIVE_TEAM: Pokemon[] = [
  { id: 445, name: "GARCHOMP", types: ["Dragon", "Ground"] },
  { id: 448, name: "LUCARIO", types: ["Fighting", "Steel"] },
  { id: 282, name: "GARDEVOIR", types: ["Psychic", "Fairy"] },
  { id: 727, name: "INCINEROAR", types: ["Fire", "Dark"] },
  { id: 812, name: "RILLABOOM", types: ["Grass"] },
  { id: 987, name: "FLUTTER MANE", types: ["Ghost", "Fairy"] },
];

export const ACTIVE_TEAM_RECORD = { wins: 14, losses: 4 };

/** Sample opponent preview being analyzed (matchup grid columns). */
export const OPPONENT_TEAM: Pokemon[] = [
  { id: 6, name: "CHARIZARD", types: ["Fire", "Flying"] },
  { id: 445, name: "GARCHOMP", types: ["Dragon", "Ground"] },
  { id: 983, name: "KINGAMBIT", types: ["Dark", "Steel"] },
  { id: 987, name: "FLUTTER MANE", types: ["Ghost", "Fairy"] },
  { id: 727, name: "INCINEROAR", types: ["Fire", "Dark"] },
  { id: 812, name: "RILLABOOM", types: ["Grass"] },
];

/**
 * Seed rosters for first launch only — IndexedDB is the source of truth
 * once the user touches anything (see useRosters). Built from real Reg M-B
 * archetypes (Pikalytics top cores/teams, 2026-05 snapshot) and named
 * self-aware so nobody mistakes them for the user's teams.
 */
export const SEED_ROSTERS: Roster[] = [
  {
    id: 1,
    name: "SAMPLE CORE",
    species: [
      "Charizard-Mega-Y",
      "Garchomp",
      "Kingambit",
      "Whimsicott",
      "Basculegion",
      "Incineroar",
    ],
  },
  {
    id: 2,
    name: "SAMPLE RAIN",
    species: [
      "Archaludon",
      "Pelipper",
      "Swampert-Mega",
      "Sinistcha",
      "Gholdengo",
      "Milotic",
    ],
  },
  {
    id: 3,
    name: "SAMPLE SUN",
    species: [
      "Charizard-Mega-Y",
      "Venusaur",
      "Farigiraf",
      "Garchomp",
      "Incineroar",
      "Sylveon",
    ],
  },
];
