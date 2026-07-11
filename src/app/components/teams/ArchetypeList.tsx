import { Trophy, Copy } from "lucide-react";
import { getSpecies } from "../../../data/speciesLexicon";
import { getSpriteUrl } from "../../../lib/sprites";
import type { ArchetypeCluster, LimitlessSnapshot } from "../../../lib/limitless";

interface ArchetypeListProps {
  snapshot: LimitlessSnapshot | null;
  onCloneCore: (cluster: ArchetypeCluster) => void;
}

/**
 * Archetype cards clustered from real Limitless tournament team sheets.
 * Numbers are tournament data (share of sheets, placing percentile) —
 * labeled as such, never blended silently with ladder stats.
 */
export function ArchetypeList({ snapshot, onCloneCore }: ArchetypeListProps) {
  if (!snapshot) {
    return (
      <div className="px-4 mt-4 space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-32 bg-panel rounded-xl border border-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const named = snapshot.clusters.filter((c) => c.id !== -1);
  const other = snapshot.clusters.find((c) => c.id === -1);

  return (
    <div className="px-4 mt-4 pb-4">
      <p className="text-[9px] font-mono text-muted tracking-wide mb-3">
        Clustered from {snapshot.teamCount.toLocaleString()} team sheets ·{" "}
        {snapshot.tournamentCount} tournaments · Limitless · updated{" "}
        {snapshot.updated}
      </p>

      <div className="space-y-3">
        {named.map((cluster) => (
          <div
            key={cluster.id}
            className="bg-panel rounded-xl border border-white/5 p-3 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink truncate mr-2">
                {cluster.name}
              </h3>
              <span className="text-[10px] font-mono font-bold text-aura flex-shrink-0">
                {cluster.sharePct}% of teams
              </span>
            </div>

            {/* Core species with in-cluster frequency */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {cluster.core.slice(0, 6).map((member) => {
                const species = getSpecies(member.name);
                return (
                  <span
                    key={member.name}
                    title={`${member.name} — in ${member.freq}% of ${cluster.name} teams`}
                    className="flex items-center space-x-1 bg-night rounded-full border border-white/10 pl-1 pr-2 py-0.5"
                  >
                    {species && (
                      <img
                        src={getSpriteUrl(species.id)}
                        alt=""
                        className="w-5 h-5 object-contain"
                        onError={(e) =>
                          (e.currentTarget.style.visibility = "hidden")
                        }
                      />
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-wider text-ink">
                      {member.name}
                      <span className="text-muted font-mono"> {Math.round(member.freq)}%</span>
                    </span>
                  </span>
                );
              })}
            </div>

            {cluster.avgPlacingPctl !== null && (
              <p className="text-[9px] text-muted tracking-wide mb-2 flex items-center">
                <Trophy size={10} className="mr-1" />
                Avg finish: top {Math.round(100 - cluster.avgPlacingPctl)}% ·{" "}
                {cluster.teams.toLocaleString()} teams
              </p>
            )}

            {/* Real example teams */}
            {cluster.examples.length > 0 && (
              <div className="border-t border-white/5 pt-2 mb-2 space-y-0.5">
                {cluster.examples.slice(0, 2).map((example) => (
                  <p
                    key={`${example.player}-${example.event}`}
                    className="text-[9px] text-muted tracking-wide truncate"
                    title={example.species.join(", ")}
                  >
                    <span className="text-ink font-bold">#{example.placing}</span>{" "}
                    {example.player} · {example.event}
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={() => onCloneCore(cluster)}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-aura/10 text-aura border border-aura/30 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-aura/20 transition-colors"
            >
              <Copy size={11} />
              <span>Clone core &amp; edit</span>
            </button>
          </div>
        ))}
      </div>

      {other && other.teams > 0 && (
        <p className="text-[9px] text-muted tracking-wide mt-3 text-center">
          +{other.teams.toLocaleString()} teams ({other.sharePct}%) don't fit a
          named archetype — never force-fit.
        </p>
      )}
    </div>
  );
}
