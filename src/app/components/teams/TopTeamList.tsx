import { motion } from "motion/react";
import { CopyPlus } from "lucide-react";
import { getSpecies } from "../../../data/speciesLexicon";
import type { RankedTopTeam } from "../../../hooks/useMetaTeams";
import { getSpriteUrl } from "../../../lib/sprites";

interface TopTeamListProps {
  teams: RankedTopTeam[];
  loading: boolean;
  onClone: (team: RankedTopTeam) => void;
}

/** Real recent top teams from Pikalytics; tap a row to clone & edit it. */
export function TopTeamList({ teams, loading, onClone }: TopTeamListProps) {
  if (loading && teams.length === 0) {
    return (
      <div className="px-4 mt-2 space-y-3 pb-6">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="h-[72px] bg-panel rounded-xl border border-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 mt-2 space-y-3 pb-6">
      {teams.map((team, index) => {
        const record = `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ""}`;
        return (
          <motion.button
            key={team.rank}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.25 }}
            onClick={() => onClone(team)}
            className="w-full bg-panel rounded-xl border border-white/5 p-3 shadow-lg hover:border-aura/40 transition-colors text-left group"
          >
            <div className="flex items-center justify-between">
              {/* Rank circle */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#4B5563] to-[#1F2937] border border-white/10 flex items-center justify-center shadow-inner mr-3">
                <span className="text-xs font-bold text-white">{team.rank}</span>
              </div>

              {/* Overlapping roster sprites */}
              <div className="flex-1 flex -space-x-3 overflow-visible">
                {team.species.map((name, idx) => {
                  const species = getSpecies(name);
                  return (
                    <div
                      key={idx}
                      className="w-10 h-10 bg-night rounded-full border border-white/10 flex items-center justify-center relative shadow-md"
                      style={{ zIndex: team.species.length - idx }}
                      title={name}
                    >
                      {species ? (
                        <img
                          src={getSpriteUrl(species.id)}
                          alt={name}
                          className="w-10 h-10 object-contain scale-[1.35] drop-shadow-sm"
                          onError={(e) =>
                            (e.currentTarget.style.visibility = "hidden")
                          }
                        />
                      ) : (
                        <span className="text-[8px] font-bold text-muted">
                          {name.slice(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Record + win bar */}
              <div className="flex flex-col items-end flex-shrink-0 ml-2 w-[72px]">
                <span className="text-[10px] font-bold text-white tracking-wide whitespace-nowrap mb-1.5">
                  {record} · {team.winRate.toFixed(0)}%
                </span>
                <div className="w-full h-1.5 bg-night rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <div
                    className="h-full bg-win rounded-full"
                    style={{ width: team.barWidth }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-[9px] text-muted tracking-wide truncate mr-2">
                {team.author} · {team.event}
              </span>
              <span className="flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider text-aura opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <CopyPlus size={10} />
                <span>Clone & edit</span>
              </span>
            </div>
          </motion.button>
        );
      })}
      {!loading && teams.length === 0 && (
        <p className="text-[10px] text-muted tracking-wide text-center py-10">
          No top teams in the snapshot yet — sync the Database tab first.
        </p>
      )}
    </div>
  );
}
