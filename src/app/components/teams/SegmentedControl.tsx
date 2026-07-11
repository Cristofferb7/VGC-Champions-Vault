import type { TeamsView } from "../../../types";

const SEGMENTS: Array<{ id: TeamsView; label: string }> = [
  { id: "top", label: "Top Teams" },
  { id: "builder", label: "Team Builder" },
];

interface SegmentedControlProps {
  view: TeamsView;
  onChange: (view: TeamsView) => void;
}

export function SegmentedControl({ view, onChange }: SegmentedControlProps) {
  return (
    <div className="px-4 mt-5">
      <div className="flex bg-panel p-1 rounded-full border border-white/5 shadow-inner">
        {SEGMENTS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 relative py-2 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all ${
              view === id
                ? "text-ink bg-night shadow-md"
                : "text-muted hover:text-ink"
            }`}
          >
            {label}
            {view === id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-aura rounded-t-md shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
