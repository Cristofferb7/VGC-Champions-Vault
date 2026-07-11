import { useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useMetaData } from "../../hooks/useMetaData";
import { usePokemonDetail } from "../../hooks/usePokemonDetail";
import { useSmogon } from "../../hooks/useSmogon";
import { useScrollEdges } from "../../hooks/useScrollEdges";
import { useUsageSearch, type UsageSort } from "../../hooks/useUsageSearch";
import { TIER_LABELS, type SmogonTierId } from "../../lib/smogon";
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
  const smogon = useSmogon();
  const [smogonTier, setSmogonTier] = useState<SmogonTierId>("all");
  const hasSmogon = (smogon?.months.length ?? 0) > 0;
  const { ref: pillsRef, atEnd: pillsAtEnd } =
    useScrollEdges<HTMLDivElement>();

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

      {/* Sort pills (right fade = "more pills" scroll affordance, QA s6) */}
      <div className="relative">
        {!pillsAtEnd && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-night to-transparent pointer-events-none z-10" />
        )}
      <div
        ref={pillsRef}
        className="mt-4 mb-2 flex space-x-2 overflow-x-auto scrollbar-hide pb-1"
      >
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

        {/* Smogon cutoff toggle — affects the Showdown-derived sections
            in the detail sheet (spread distribution, lead usage). */}
        {hasSmogon &&
          (["all", "top"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSmogonTier(tier)}
              title={`Showdown ${TIER_LABELS[tier]} · ${smogon?.monthLabel}`}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors border ${
                smogonTier === tier
                  ? "bg-[#8B5CF6]/10 text-[#c4b5fd] border-[#8B5CF6]/40"
                  : "bg-panel text-muted border-white/5 hover:border-white/20"
              }`}
            >
              {/* Short label — the long TIER_LABELS clip in this row (QA). */}
              SD {tier === "all" ? "All ladder" : "Top ladder"}
            </button>
          ))}
      </div>
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
          {snapshot?.dataDate && ` · snapshot ${snapshot.dataDate}`} ·{" "}
          <a
            href="https://www.smogon.com/stats/"
            target="_blank"
            rel="noreferrer"
            className="text-aura underline underline-offset-2"
          >
            Smogon
          </a>{" "}
          ·{" "}
          <a
            href="https://play.limitlesstcg.com"
            target="_blank"
            rel="noreferrer"
            className="text-aura underline underline-offset-2"
          >
            Limitless
          </a>{" "}
          · unofficial; not affiliated with Nintendo, Creatures, GAME FREAK, or
          The Pokémon Company
        </p>
      </footer>

      <BottomSheet
        open={selectedName !== null}
        onClose={() => setSelectedName(null)}
        title="Meta Breakdown"
      >
        {selectedName && (
          <PokemonDetailSheet
            name={selectedName}
            state={detailState}
            smogon={hasSmogon ? smogon : null}
            smogonTier={smogonTier}
          />
        )}
      </BottomSheet>
    </main>
  );
}
