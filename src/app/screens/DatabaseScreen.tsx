import { useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useMetaData } from "../../hooks/useMetaData";
import { usePokemonDetail } from "../../hooks/usePokemonDetail";
import { useUsageSearch, type UsageSort } from "../../hooks/useUsageSearch";
import { PokemonDetailSheet } from "../components/database/PokemonDetailSheet";
import { UsageRow } from "../components/database/UsageRow";
import { BottomSheet } from "../components/shared/BottomSheet";
import { PIKA_ATTRIBUTION_URL } from "../../config";

const SORTS: Array<{ id: UsageSort; label: string }> = [
  { id: "rank", label: "By Rank" },
  { id: "winRate", label: "Highest Win Rate" },
  { id: "games", label: "Most Games" },
];

function RowSkeletons() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="h-16 bg-panel rounded-xl border border-white/5 animate-pulse"
        />
      ))}
    </div>
  );
}

export function DatabaseScreen() {
  const { status, snapshot, refresh } = useMetaData();
  const { query, setQuery, sortBy, setSortBy, results } = useUsageSearch(
    snapshot?.entries ?? [],
  );
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const detailState = usePokemonDetail(selectedName);

  return (
    <main className="flex-1 flex flex-col overflow-y-auto px-4">
      {/* Search */}
      <div className="mt-5 relative">
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

      {/* Sort pills */}
      <div className="mt-4 mb-2 flex space-x-2 overflow-x-auto scrollbar-hide pb-1">
        {SORTS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setSortBy(id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors border ${
              sortBy === id
                ? "bg-aura/10 text-aura border-aura/30"
                : "bg-panel text-muted border-white/5 hover:border-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Usage list */}
      <div className="mt-2 space-y-3 pb-4">
        {!snapshot && status !== "error" && <RowSkeletons />}

        {status === "error" && !snapshot && (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink mb-1">
              Couldn't reach Pikalytics
            </p>
            <p className="text-[10px] text-muted tracking-wide mb-4">
              No cached snapshot yet — analysis needs one first sync.
            </p>
            <button
              onClick={refresh}
              className="flex items-center space-x-2 px-4 py-2 bg-aura/10 text-aura border border-aura/30 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-aura/20 transition-colors"
            >
              <RefreshCw size={12} />
              <span>Retry Sync</span>
            </button>
          </div>
        )}

        {snapshot && results.length === 0 && (
          <p className="text-[10px] text-muted tracking-wide text-center py-10">
            No Pokémon match “{query}”.
          </p>
        )}

        {results.map((entry) => (
          <UsageRow
            key={entry.name}
            entry={entry}
            onSelect={() => setSelectedName(entry.name)}
          />
        ))}
      </div>

      {/* Required attribution */}
      <footer className="pb-2 text-center">
        <p className="text-[9px] text-muted tracking-wide">
          Data:{" "}
          <a
            href={PIKA_ATTRIBUTION_URL}
            target="_blank"
            rel="noreferrer"
            className="text-aura underline underline-offset-2"
          >
            Pikalytics
          </a>
          {snapshot?.dataDate && ` · snapshot ${snapshot.dataDate}`} · unofficial;
          not affiliated with Nintendo, Creatures, GAME FREAK, or The Pokémon
          Company
        </p>
      </footer>

      <BottomSheet
        open={selectedName !== null}
        onClose={() => setSelectedName(null)}
        title="Meta Breakdown"
      >
        {selectedName && (
          <PokemonDetailSheet name={selectedName} state={detailState} />
        )}
      </BottomSheet>
    </main>
  );
}
