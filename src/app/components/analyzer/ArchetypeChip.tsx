import { Network } from "lucide-react";
import { normalizeSpeciesName } from "../../../lib/smogon";
import type { ArchetypeMatch } from "../../../lib/limitless";
import type { Pokemon } from "../../../types";

interface ArchetypeChipProps {
  /** Null = no clear match (below threshold) — said outright, never forced. */
  match: ArchetypeMatch | null;
  opponentTeam: Pokemon[];
  teamCount: number;
}

/** "Closest archetype" readout above Likely Brings (tournament data). */
export function ArchetypeChip({ match, opponentTeam, teamCount }: ArchetypeChipProps) {
  if (!match) {
    return (
      <div className="bg-panel rounded-xl border border-white/5 px-3 py-2 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center">
          <Network size={11} className="mr-1.5" />
          No clear archetype match
        </p>
        <p className="text-[8px] font-mono text-muted mt-0.5">
          tournament data · Limitless · n={teamCount.toLocaleString()} teams
        </p>
      </div>
    );
  }

  const opponentSet = new Set(
    opponentTeam.map((poke) => normalizeSpeciesName(poke.name)),
  );

  return (
    <div className="bg-panel rounded-xl border border-aura/20 px-3 py-2 mb-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink flex items-center truncate mr-2">
          <Network size={11} className="mr-1.5 text-aura flex-shrink-0" />
          Closest archetype: {match.cluster.name}
        </p>
        <span className="text-[10px] font-mono font-bold text-aura flex-shrink-0">
          {Math.round(match.similarity * 100)}% similar
        </span>
      </div>
      {/* Matched core, with the opponent's actual members highlighted */}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {match.cluster.core.slice(0, 6).map((member) => {
          const present = opponentSet.has(normalizeSpeciesName(member.name));
          return (
            <span
              key={member.name}
              className={`px-1.5 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider ${
                present
                  ? "bg-aura/10 text-aura border-aura/30"
                  : "bg-night text-muted border-white/5"
              }`}
            >
              {member.name}
            </span>
          );
        })}
      </div>
      <p className="text-[8px] font-mono text-muted mt-1.5">
        tournament data · Limitless · n={match.cluster.teams.toLocaleString()}{" "}
        {match.cluster.name} teams of {teamCount.toLocaleString()}
      </p>
    </div>
  );
}
