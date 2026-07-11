import { useScrollEdges } from "../../../hooks/useScrollEdges";
import { getSpriteUrl } from "../../../lib/sprites";
import type {
  MatchupCellResult,
  MatchupVerdict,
  Pokemon,
} from "../../../types";

const VERDICT_STYLES: Record<MatchupVerdict, string> = {
  Good: "bg-win/15 text-win border-win/30",
  Bad: "bg-loss/15 text-loss border-loss/30",
  Neutral: "bg-white/[0.03] text-muted border-white/10",
};

/** Width of the sticky "your team" column, used for snap padding + fades. */
const STICKY_COL_PX = 76;

interface MatchupGridProps {
  myTeam: Pokemon[];
  opponentTeam: Pokemon[];
  matrix: MatchupCellResult[][];
  selected: { row: number; col: number } | null;
  onSelectCell: (row: number, col: number) => void;
}

/**
 * The threat matrix: opponent's six across the top, user's team down the
 * side, each cell carrying an explicit Good / Bad / Neutral text status.
 * Scrolls horizontally with a sticky team column, snap-to-column, and
 * edge fades as scroll hints.
 */
export function MatchupGrid({
  myTeam,
  opponentTeam,
  matrix,
  selected,
  onSelectCell,
}: MatchupGridProps) {
  const { ref, atStart, atEnd } = useScrollEdges<HTMLDivElement>();
  const gridTemplateColumns = `${STICKY_COL_PX}px repeat(${opponentTeam.length}, 56px)`;

  return (
    <div className="relative">
      <div
        ref={ref}
        className="overflow-x-auto scrollbar-hide snap-x"
        style={{ scrollPaddingLeft: STICKY_COL_PX }}
      >
        <div className="min-w-max">
          {/* Header row: opponent sprites */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns }}>
            <div className="sticky left-0 z-20 bg-panel flex items-end justify-start pb-1">
              <span className="text-[8px] font-bold uppercase tracking-widest text-muted">
                You ▼ / Opp ►
              </span>
            </div>
            {opponentTeam.map((poke, col) => (
              <div
                key={col}
                className="flex flex-col items-center pb-1 snap-start"
              >
                <div className="w-9 h-9 bg-panel rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
                  <img
                    src={getSpriteUrl(poke.id)}
                    alt={poke.name}
                    className="w-9 h-9 object-contain scale-125"
                  />
                </div>
                <span className="text-[7px] font-bold uppercase tracking-wide text-muted mt-1 max-w-[56px] truncate">
                  {poke.name}
                </span>
              </div>
            ))}
          </div>

          {/* One row per Pokémon on the user's team */}
          {myTeam.map((mine, row) => (
            <div
              key={row}
              className="grid gap-1 mb-1"
              style={{ gridTemplateColumns }}
            >
              <div className="sticky left-0 z-20 bg-panel flex items-center space-x-1.5 pr-1">
                <div className="w-7 h-7 bg-panel rounded-full border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={getSpriteUrl(mine.id)}
                    alt={mine.name}
                    className="w-7 h-7 object-contain scale-125"
                  />
                </div>
                <span className="text-[7px] font-bold uppercase tracking-wide text-ink truncate">
                  {mine.name}
                </span>
              </div>

              {matrix[row].map((cell, col) => {
                const isSelected =
                  selected?.row === row && selected?.col === col;
                return (
                  <button
                    key={col}
                    onClick={() => onSelectCell(row, col)}
                    className={`h-11 rounded-md border flex items-center justify-center transition-all ${
                      VERDICT_STYLES[cell.verdict]
                    } ${isSelected ? "ring-1 ring-aura border-aura/60" : ""}`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      {cell.verdict}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Edge fades: scroll affordances over the clipped columns */}
      {!atEnd && (
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-panel to-transparent pointer-events-none z-30" />
      )}
      {!atStart && (
        <div
          className="absolute top-0 bottom-0 w-6 bg-gradient-to-r from-panel to-transparent pointer-events-none z-30"
          style={{ left: STICKY_COL_PX }}
        />
      )}
    </div>
  );
}
