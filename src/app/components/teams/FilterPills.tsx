import type { TeamsSort } from "../../../types";

const FILTERS: Array<{ id: TeamsSort; label: string }> = [
  { id: "mostTeams", label: "By Rank" },
  { id: "winRate", label: "Highest Win Rate" },
  { id: "record", label: "Best Record" },
];

interface FilterPillsProps {
  sortBy: TeamsSort;
  onChange: (sort: TeamsSort) => void;
}

export function FilterPills({ sortBy, onChange }: FilterPillsProps) {
  return (
    <div className="px-4 mt-5 mb-2">
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
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
    </div>
  );
}
