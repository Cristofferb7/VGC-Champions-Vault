import { useState } from "react";
import { AlertTriangle, Check, Save, Search, Sparkles, X } from "lucide-react";
import { getSpecies } from "../../../data/speciesLexicon";
import type { useTeamBuilder } from "../../../hooks/useTeamBuilder";
import { useUsageSearch } from "../../../hooks/useUsageSearch";
import { formatMultiplier } from "../../../lib/matchup";
import { getSpriteUrl } from "../../../lib/sprites";
import { TYPE_COLORS } from "../../../data/typeColors";
import type { UsageEntry } from "../../../types";
import { TypeBadge } from "../shared/TypeBadge";

interface TeamBuilderProps {
  builder: ReturnType<typeof useTeamBuilder>;
  entries: UsageEntry[];
  onSave: (name: string, species: string[]) => void;
  onBrowseTopTeams: () => void;
}

/**
 * Manual 6-slot builder over the cached meta list, with live weakness
 * and coverage analysis as members are added.
 */
export function TeamBuilder({
  builder,
  entries,
  onSave,
  onBrowseTopTeams,
}: TeamBuilderProps) {
  const {
    draftName,
    setDraftName,
    species,
    toggleSpecies,
    clearDraft,
    weaknesses,
    coverage,
  } = builder;
  const { query, setQuery, results } = useUsageSearch(entries);
  const [saved, setSaved] = useState(false);

  const pickedNames = new Set(species.map((name) => name.toLowerCase()));
  const coveredCount = coverage.filter((entry) => entry.covered).length;

  if (species.length === 0 && !query) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-panel border border-white/5 flex items-center justify-center mb-3 shadow-inner">
          <Sparkles size={20} className="text-muted" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink mb-1">
          Draft a new roster
        </p>
        <p className="text-[10px] text-muted tracking-wide mb-4">
          Start from a proven team or search the meta from scratch.
        </p>
        <div className="flex space-x-2">
          <button
            onClick={onBrowseTopTeams}
            className="px-4 py-2 bg-aura/10 text-aura border border-aura/30 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-aura/20 transition-colors"
          >
            Start from a top team
          </button>
          <button
            onClick={() => setQuery(" ")}
            className="px-4 py-2 bg-panel text-muted border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider hover:text-ink transition-colors"
          >
            Build from scratch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-4 pb-6 space-y-4">
      {/* Draft header */}
      <div className="bg-panel rounded-xl border border-white/5 p-3 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value.toUpperCase())}
            aria-label="Team name"
            className="bg-transparent text-sm font-bold text-ink uppercase tracking-wide focus:outline-none focus:border-b focus:border-aura/50 w-40"
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={clearDraft}
              aria-label="Clear draft"
              className="p-1.5 bg-night rounded-lg border border-white/5 text-muted hover:text-loss transition-colors"
            >
              <X size={14} />
            </button>
            <button
              disabled={species.length === 0 || saved}
              onClick={() => {
                onSave(draftName, species);
                setSaved(true);
                setTimeout(() => setSaved(false), 1600);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                saved
                  ? "bg-win/15 text-win border-win/40"
                  : "bg-aura/10 text-aura border-aura/30 hover:bg-aura/20 disabled:opacity-40"
              }`}
            >
              {saved ? <Check size={12} /> : <Save size={12} />}
              <span>{saved ? "Saved" : "Save Roster"}</span>
            </button>
          </div>
        </div>

        {/* 6 slots */}
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }, (_, i) => {
            const name = species[i];
            const info = name ? getSpecies(name) : null;
            return (
              <button
                key={i}
                onClick={() => name && toggleSpecies(name)}
                disabled={!name}
                title={name ?? "Empty slot"}
                className={`aspect-square rounded-lg border flex items-center justify-center ${
                  name
                    ? "bg-night border-white/10 hover:border-loss/50"
                    : "bg-night/40 border-dashed border-white/10"
                }`}
              >
                {name ? (
                  info ? (
                    <img
                      src={getSpriteUrl(info.id)}
                      alt={name}
                      className="w-9 h-9 object-contain"
                      onError={(e) =>
                        (e.currentTarget.style.visibility = "hidden")
                      }
                    />
                  ) : (
                    <span className="text-[8px] font-bold text-muted">
                      {name.slice(0, 3).toUpperCase()}
                    </span>
                  )
                ) : (
                  <span className="text-[10px] text-muted">{i + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live analysis */}
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {weaknesses.length > 0 ? (
              weaknesses.map(({ type, members }) => (
                <span
                  key={type}
                  title={members
                    .map((m) => `${m.name} ${formatMultiplier(m.multiplier)}`)
                    .join(", ")}
                  className="flex items-center px-2 py-0.5 rounded border bg-warn/10 text-warn border-warn/30 text-[9px] font-bold uppercase tracking-widest"
                >
                  <AlertTriangle size={9} className="mr-1" />
                  {type} ×{members.length}
                </span>
              ))
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-widest text-win">
                No shared weaknesses
              </span>
            )}
          </div>

          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted mb-1">
              STAB coverage · {coveredCount}/18 types
            </p>
            <div className="flex flex-wrap gap-1">
              {coverage.map(({ type, covered }) => (
                <span
                  key={type}
                  className={`text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-sm border ${
                    covered
                      ? "text-white border-white/10"
                      : "text-muted/50 border-white/5 bg-night"
                  }`}
                  style={
                    covered
                      ? { backgroundColor: `${TYPE_COLORS[type]}80` }
                      : undefined
                  }
                >
                  {type.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Species search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the meta…"
          className="w-full bg-panel border border-white/5 rounded-full pl-9 pr-4 py-2.5 text-[12px] text-ink placeholder:text-muted focus:outline-none focus:border-aura/50 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        {results.slice(0, 30).map((entry) => {
          const info = getSpecies(entry.name);
          const picked = pickedNames.has(entry.name.toLowerCase());
          const full = !picked && species.length >= 6;
          return (
            <button
              key={entry.name}
              disabled={full}
              onClick={() => toggleSpecies(entry.name)}
              className={`w-full flex items-center rounded-lg border p-2 transition-colors text-left ${
                picked
                  ? "bg-aura/10 border-aura/40"
                  : full
                    ? "bg-panel border-white/5 opacity-40"
                    : "bg-panel border-white/5 hover:border-white/20"
              }`}
            >
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mr-2">
                {info && (
                  <img
                    src={getSpriteUrl(info.id)}
                    alt=""
                    className="w-8 h-8 object-contain"
                    onError={(e) =>
                      (e.currentTarget.style.visibility = "hidden")
                    }
                  />
                )}
              </div>
              <span className="flex-1 text-[10px] font-bold uppercase tracking-wider text-ink truncate">
                {entry.name}
              </span>
              <div className="flex gap-1 mr-2">
                {info?.types.map((type) => (
                  <TypeBadge key={type} type={type} />
                ))}
              </div>
              <span className="text-[9px] font-mono text-muted flex-shrink-0">
                #{entry.rank}
              </span>
            </button>
          );
        })}
        {entries.length === 0 && (
          <p className="text-[10px] text-muted tracking-wide text-center py-6">
            Sync the meta database first (Database tab) to search species.
          </p>
        )}
      </div>
    </div>
  );
}
