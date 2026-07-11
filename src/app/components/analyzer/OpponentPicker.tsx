import { Search, X } from "lucide-react";
import { getSpecies } from "../../../data/speciesLexicon";
import { useUsageSearch } from "../../../hooks/useUsageSearch";
import { getSpriteUrl } from "../../../lib/sprites";
import type { Pokemon, UsageEntry } from "../../../types";
import { TypeBadge } from "../shared/TypeBadge";

interface OpponentPickerProps {
  entries: UsageEntry[];
  opponentTeam: Pokemon[];
  onToggle: (name: string) => void;
  onClear: () => void;
}

/**
 * Manual opponent entry: search the cached usage list, pick up to 6.
 * (Screenshot recognition is deferred per the brief — this is the v1 path.)
 */
export function OpponentPicker({
  entries,
  opponentTeam,
  onToggle,
  onClear,
}: OpponentPickerProps) {
  const { query, setQuery, results } = useUsageSearch(entries);
  const pickedNames = new Set(
    opponentTeam.map((poke) => poke.name.toLowerCase()),
  );

  return (
    <div>
      {/* Current selection */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted">
          Opponent preview · {opponentTeam.length}/6
        </span>
        {opponentTeam.length > 0 && (
          <button
            onClick={onClear}
            className="text-[9px] font-bold uppercase tracking-wider text-loss hover:text-loss/80 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3 min-h-[26px]">
        {opponentTeam.map((poke) => (
          <button
            key={poke.name}
            onClick={() => onToggle(poke.name)}
            className="flex items-center space-x-1 bg-aura/10 border border-aura/30 rounded-full pl-1 pr-2 py-0.5 hover:bg-aura/20 transition-colors"
          >
            {poke.id > 0 && (
              <img
                src={getSpriteUrl(poke.id)}
                alt=""
                className="w-5 h-5 object-contain"
                onError={(e) => (e.currentTarget.style.visibility = "hidden")}
              />
            )}
            <span className="text-[9px] font-bold uppercase tracking-wider text-aura">
              {poke.name}
            </span>
            <X size={10} className="text-aura" />
          </button>
        ))}
        {opponentTeam.length === 0 && (
          <span className="text-[10px] text-muted tracking-wide">
            Pick the Pokémon you saw in team preview.
          </span>
        )}
      </div>

      {/* Search the cached meta list */}
      <div className="relative mb-3">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search species…"
          className="w-full bg-night border border-white/5 rounded-full pl-9 pr-4 py-2 text-[12px] text-ink placeholder:text-muted focus:outline-none focus:border-aura/50 transition-colors"
        />
      </div>

      <div className="space-y-1.5 max-h-[38vh] overflow-y-auto">
        {results.map((entry) => {
          const species = getSpecies(entry.name);
          const picked = pickedNames.has(entry.name.toLowerCase());
          const full = !picked && opponentTeam.length >= 6;
          return (
            <button
              key={entry.name}
              disabled={full}
              onClick={() => onToggle(entry.name)}
              className={`w-full flex items-center rounded-lg border p-2 transition-colors text-left ${
                picked
                  ? "bg-aura/10 border-aura/40"
                  : full
                    ? "bg-night border-white/5 opacity-40"
                    : "bg-night border-white/5 hover:border-white/20"
              }`}
            >
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mr-2">
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
              <span className="flex-1 text-[10px] font-bold uppercase tracking-wider text-ink truncate">
                {entry.name}
              </span>
              <div className="flex gap-1 mr-2">
                {species?.types.map((type) => (
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
