import { getSpecies } from "../../../data/speciesLexicon";
import { getSpriteUrl } from "../../../lib/sprites";
import type { UsageEntry } from "../../../types";
import { TypeBadge } from "../shared/TypeBadge";

interface UsageRowProps {
  entry: UsageEntry;
  onSelect: () => void;
}

export function UsageRow({ entry, onSelect }: UsageRowProps) {
  const species = getSpecies(entry.name);
  const games = entry.wins + entry.losses + entry.ties;

  return (
    <button
      onClick={onSelect}
      className="w-full bg-panel rounded-xl border border-white/5 p-3 flex items-center shadow-lg hover:border-white/15 transition-colors text-left"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 64px" }}
    >
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#4B5563] to-[#1F2937] border border-white/10 flex items-center justify-center shadow-inner mr-3">
        <span className="text-xs font-bold text-white">{entry.rank}</span>
      </div>

      <div className="w-10 h-10 bg-night rounded-full border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 mr-3">
        {species ? (
          <img
            src={getSpriteUrl(species.id)}
            alt={entry.name}
            loading="lazy"
            className="w-10 h-10 object-contain scale-[1.35]"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
        ) : (
          <span className="text-[10px] font-bold text-muted">
            {entry.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-ink tracking-wider uppercase truncate mb-1">
          {entry.name}
        </p>
        <div className="flex gap-1">
          {species?.types.map((type) => <TypeBadge key={type} type={type} />)}
        </div>
      </div>

      <div className="flex flex-col items-end flex-shrink-0 ml-2">
        <span className="text-[10px] font-bold text-white tracking-wide whitespace-nowrap">
          {entry.winRate !== null ? `${entry.winRate.toFixed(1)}% WIN` : "— WIN"}
        </span>
        <span className="text-[9px] font-mono text-muted mt-0.5">
          {entry.usagePct !== null
            ? `${entry.usagePct.toFixed(1)}% USE`
            : `${games.toLocaleString()} GAMES`}
        </span>
      </div>
    </button>
  );
}
