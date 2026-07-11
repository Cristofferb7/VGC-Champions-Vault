export type TypeName =
  | "Normal"
  | "Fire"
  | "Water"
  | "Electric"
  | "Grass"
  | "Ice"
  | "Fighting"
  | "Poison"
  | "Ground"
  | "Flying"
  | "Psychic"
  | "Bug"
  | "Rock"
  | "Ghost"
  | "Dragon"
  | "Dark"
  | "Steel"
  | "Fairy";

export interface Pokemon {
  /** National dex number — also drives the sprite URL. */
  id: number;
  name: string;
  types: TypeName[];
}

export interface Roster {
  id: number;
  name: string;
  /** Species names (Pikalytics naming); sprites/types via the lexicon. */
  species: string[];
}

/** A real ladder/tournament team parsed from the Pikalytics index. */
export interface TopTeam {
  rank: number;
  author: string;
  event: string;
  wins: number;
  losses: number;
  ties: number;
  species: string[];
}

export interface TeamWeakness {
  type: TypeName;
  /** Team members hit super-effectively by this type, with their multiplier. */
  members: Array<{ name: string; multiplier: number }>;
}

export type MatchupVerdict = "Good" | "Bad" | "Neutral";

/** Real ladder matchup evidence (Smogon Checks & Counters). */
export interface RealMatchupSignal {
  /** Which side the data says reliably wins the pairing. */
  favors: "mine" | "theirs";
  /** KO-or-forced-switch rate of the losing side, 0–100. */
  p: number;
  /** Weighted encounter sample behind the number. */
  n: number;
  /** Smogon's p − 4d confidence score, 0–100. */
  score: number;
}

export interface MatchupCellResult {
  verdict: MatchupVerdict;
  /** Best offensive type multiplier of the user's Pokémon vs the opponent's. */
  myEdge: number;
  /** Best offensive type multiplier of the opponent's Pokémon vs the user's. */
  theirEdge: number;
  /** Present when the verdict came from real C&C data, not type math. */
  real?: RealMatchupSignal;
}

export type TabId = "home" | "database" | "teams" | "tools";

/** One row of the format's usage table. Null = source reports N/A. */
export interface UsageEntry {
  rank: number;
  name: string;
  usagePct: number | null;
  winRate: number | null;
  wins: number;
  losses: number;
  ties: number;
}

export interface MetaSnapshot {
  formatCode: string;
  dataDate: string | null;
  fetchedAt: number;
  /** Last-Modified response header, echoed back as If-Modified-Since. */
  lastModified: string | null;
  entries: UsageEntry[];
  topTeams: TopTeam[];
}

export type SyncStatus = "loading" | "syncing" | "fresh" | "stale" | "error";

/** A name + percentage pair; pct null when the source omits it. */
export interface NamedPct {
  name: string;
  pct: number | null;
}

export interface StatLine {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface PokemonDetail {
  name: string;
  winRate: number | null;
  record: string | null;
  weakTo: string[];
  resists: string[];
  immuneTo: string[];
  moves: NamedPct[];
  abilities: NamedPct[];
  items: NamedPct[];
  teammates: NamedPct[];
  spread: { nature: string | null; evs: string; pct: number | null } | null;
  baseStats: StatLine | null;
  fetchedAt: number;
}

export type TeamsView = "top" | "archetypes" | "builder";

export type TeamsSort = "mostTeams" | "winRate" | "record";
