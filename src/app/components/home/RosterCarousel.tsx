import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { Roster } from "../../../types";
import { RosterCard } from "./RosterCard";

interface RosterCarouselProps {
  rosters: Roster[];
  selectedId: number;
  onSelect: (id: number) => void;
  onAdd: () => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onCopyPaste: (id: number) => void;
}

export function RosterCarousel({
  rosters,
  selectedId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onCopyPaste,
}: RosterCarouselProps) {
  const [menuRosterId, setMenuRosterId] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // Start at the first card. Chrome restores element scroll positions
  // ASYNCHRONOUSLY after a reload, so a mount-time reset alone gets
  // overridden — reset again shortly after (found in sprint 7 QA pass).
  useEffect(() => {
    const reset = () => {
      if (scroller.current) scroller.current.scrollLeft = 0;
    };
    reset();
    const timer = window.setTimeout(reset, 150);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wider text-muted uppercase mb-4">
        Your Rosters{" "}
        <span className="text-[10px] normal-case tracking-normal ml-1 pointer-fine:hidden">
          (Long press to edit)
        </span>
        <span className="text-[10px] normal-case tracking-normal ml-1 pointer-coarse:hidden">
          (Right-click to edit)
        </span>
      </h2>

      {/* Horizontal carousel */}
      {/* pan-x pan-y (NOT bare pan-x, which would block vertical page
          scrolls starting here): browser axis-locks so horizontal swipes
          scroll the carousel, vertical ones the page — never both. The
          contained overscroll stops edge-fling chaining (sprint 7). */}
      <div
        ref={scroller}
        className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide snap-x pr-4 [touch-action:pan-x_pan-y] overscroll-x-contain"
      >
        {rosters.map((roster) => (
          <RosterCard
            key={roster.id}
            roster={roster}
            isSelected={roster.id === selectedId}
            menuOpen={menuRosterId === roster.id}
            onSelect={() => onSelect(roster.id)}
            onOpenMenu={() => setMenuRosterId(roster.id)}
            onCloseMenu={() => setMenuRosterId(null)}
            onDuplicate={() => {
              onDuplicate(roster.id);
              setMenuRosterId(null);
            }}
            onDelete={() => {
              onDelete(roster.id);
              setMenuRosterId(null);
            }}
            onCopyPaste={() => {
              onCopyPaste(roster.id);
              setMenuRosterId(null);
            }}
          />
        ))}

        {/* Add-team card */}
        <button
          onClick={onAdd}
          className="snap-start min-w-[140px] h-[220px] border-2 border-dashed border-muted/40 rounded-xl flex flex-col items-center justify-center text-muted bg-panel/50 transition-all hover:border-muted/70 hover:text-ink flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-full bg-night flex items-center justify-center mb-2 shadow-inner">
            <Plus size={24} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            New Team
          </span>
        </button>
      </div>

      {/* Click-away layer for the edit menu */}
      {menuRosterId !== null && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setMenuRosterId(null)}
        />
      )}
    </section>
  );
}
