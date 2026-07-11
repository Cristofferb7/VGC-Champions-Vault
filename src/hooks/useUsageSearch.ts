import { useMemo, useState } from "react";
import { fuzzyFilter } from "../lib/fuzzy";
import type { UsageEntry } from "../types";

export type UsageSort = "rank" | "winRate" | "games";

/** Search + sort state for the Database usage list. */
export function useUsageSearch(entries: UsageEntry[]) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<UsageSort>("rank");

  const results = useMemo(() => {
    const matched = fuzzyFilter(query, entries, (entry) => entry.name);
    if (query.trim()) return matched; // fuzzy relevance order wins
    return [...matched].sort((a, b) => {
      switch (sortBy) {
        case "winRate":
          return (b.winRate ?? -1) - (a.winRate ?? -1);
        case "games":
          return b.wins + b.losses + b.ties - (a.wins + a.losses + a.ties);
        case "rank":
          return a.rank - b.rank;
      }
    });
  }, [entries, query, sortBy]);

  return { query, setQuery, sortBy, setSortBy, results };
}
