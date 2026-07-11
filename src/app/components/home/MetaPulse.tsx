import { useMemo } from "react";
import { Activity, ChevronRight, Network } from "lucide-react";
import { getSpecies } from "../../../data/speciesLexicon";
import { useLimitless } from "../../../hooks/useLimitless";
import { useSmogon } from "../../../hooks/useSmogon";
import { getSpriteUrl } from "../../../lib/sprites";
import type { MetaSnapshot } from "../../../types";

/** Ladder sample floor — win rates on fewer games are noise. */
const MIN_GAMES = 5000;

interface MetaPulseProps {
  snapshot: MetaSnapshot | null;
  onOpenDetail: (name: string) => void;
  onOpenArchetypes: () => void;
}

/**
 * Glanceable dashboard strip (sprint 9): top-3 win rates + top archetype,
 * entirely from already-cached snapshots — zero new fetches. Trend arrows
 * stay dormant until ≥2 Smogon months exist (same pattern as the
 * sparkline; lights up ~Aug 6). Sits at the bottom of Home and absorbs
 * tall-viewport slack so the gap is data, not dead space.
 */
export function MetaPulse({
  snapshot,
  onOpenDetail,
  onOpenArchetypes,
}: MetaPulseProps) {
  const limitless = useLimitless();
  const smogon = useSmogon();

  const top3 = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.entries
      .map((entry) => {
        const games = entry.wins + entry.losses + entry.ties;
        return { name: entry.name, games, winPct: (entry.wins / games) * 100 };
      })
      .filter((entry) => entry.games >= MIN_GAMES)
      .sort((a, b) => b.winPct - a.winPct)
      .slice(0, 3);
  }, [snapshot]);

  // Dormant until ≥2 cached months: usage direction vs last month.
  const trendFor = (name: string) => {
    if (!smogon || smogon.months.length < 2) return null;
    const series = smogon.history(name);
    if (series.length < 2) return null;
    const [prev, last] = series.slice(-2);
    if (last.usage === prev.usage) return null;
    return {
      up: last.usage > prev.usage,
      title: `Smogon usage ${prev.usage.toFixed(1)}% → ${last.usage.toFixed(1)}% (vs last month)`,
    };
  };

  const topArchetype = limitless?.clusters.find((c) => c.id !== -1) ?? null;
  if (!snapshot || top3.length === 0) return null;

  return (
    <section className="!mt-auto pt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center text-xs font-semibold tracking-wider text-muted uppercase">
          <Activity size={12} className="mr-1.5" />
          Meta Pulse
        </h2>
        {snapshot.dataDate && (
          <span className="text-[9px] font-mono text-muted tracking-wide">
            snapshot {snapshot.dataDate}
          </span>
        )}
      </div>

      <div className="bg-panel rounded-xl border border-white/5 shadow-lg divide-y divide-white/5">
        {top3.map((entry) => {
          const species = getSpecies(entry.name);
          const trend = trendFor(entry.name);
          return (
            <button
              key={entry.name}
              onClick={() => onOpenDetail(entry.name)}
              className="w-full flex items-center px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 mr-2.5 bg-night rounded-full border border-white/5">
                {species && (
                  <img
                    src={getSpriteUrl(species.id)}
                    alt=""
                    className="w-8 h-8 object-contain"
                    onError={(e) =>
                      (e.currentTarget.style.visibility = "hidden")
                    }
                  />
                )}
              </div>
              <span className="flex-1 text-[11px] font-bold uppercase tracking-wider text-ink truncate">
                {entry.name}
                {trend && (
                  <span
                    title={trend.title}
                    className={`ml-1.5 ${trend.up ? "text-win" : "text-loss"}`}
                  >
                    {trend.up ? "▲" : "▼"}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-mono font-bold text-win mr-2">
                {entry.winPct.toFixed(1)}% WR
              </span>
              <span className="text-[9px] font-mono text-muted mr-1">
                {entry.games.toLocaleString()} games
              </span>
              <ChevronRight size={12} className="text-muted flex-shrink-0" />
            </button>
          );
        })}

        {topArchetype && (
          <button
            onClick={onOpenArchetypes}
            className="w-full flex items-center px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
          >
            <Network size={14} className="text-aura mr-2.5 flex-shrink-0" />
            <span className="flex-1 text-[10px] font-bold uppercase tracking-wider text-ink truncate">
              Top archetype: {topArchetype.name}
            </span>
            <span className="text-[10px] font-mono font-bold text-aura mr-1">
              {topArchetype.sharePct}% of teams
            </span>
            <ChevronRight size={12} className="text-muted flex-shrink-0" />
          </button>
        )}
      </div>

      <p className="text-[9px] text-muted tracking-wide mt-2">
        Win rates: Pikalytics ladder ({MIN_GAMES.toLocaleString()}+ games) ·
        archetype: Limitless tournaments · trends: Smogon monthly
      </p>
    </section>
  );
}
