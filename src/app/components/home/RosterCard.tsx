import { ClipboardCopy, Copy, MoreVertical, Trash2 } from "lucide-react";
import { getSpecies } from "../../../data/speciesLexicon";
import { useLongPress } from "../../../hooks/useLongPress";
import { getSpriteUrl } from "../../../lib/sprites";
import type { Roster } from "../../../types";

interface RosterCardProps {
  roster: Roster;
  isSelected: boolean;
  menuOpen: boolean;
  onSelect: () => void;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopyPaste: () => void;
}

/**
 * One saved-roster card. Edit menu opens via kebab button, right-click
 * (desktop), or long press (touch). Sized ~72vw on phones (capped for the
 * 430px column) so one card + a peek of the next is visible; touch-callout
 * suppressed so iOS long-press opens our menu, not the image-save sheet.
 */
export function RosterCard({
  roster,
  isSelected,
  menuOpen,
  onSelect,
  onOpenMenu,
  onCloseMenu,
  onDuplicate,
  onDelete,
  onCopyPaste,
}: RosterCardProps) {
  const longPress = useLongPress(onOpenMenu);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      onContextMenu={(e) => {
        e.preventDefault();
        onOpenMenu();
      }}
      {...longPress}
      style={{ WebkitTouchCallout: "none" }}
      className={`relative snap-start w-[min(72vw,280px)] flex-shrink-0 h-[220px] bg-panel rounded-xl p-3 flex flex-col shadow-md text-left transition-colors border cursor-pointer select-none ${
        isSelected ? "border-aura/60" : "border-white/5 hover:border-white/15"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wide">
          {roster.name}
        </h3>
        {/* 44pt touch target (negative margin keeps the visual compact) */}
        <button
          aria-label={`Edit ${roster.name}`}
          onClick={(e) => {
            e.stopPropagation();
            menuOpen ? onCloseMenu() : onOpenMenu();
          }}
          className="w-11 h-11 -m-3 flex items-center justify-center text-muted hover:text-ink transition-colors"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* 3×2 grid that actually fills the card — 48px sprites (sprint 7) */}
      <div className="grid grid-cols-3 grid-rows-2 gap-1 bg-night rounded-lg p-2 border border-white/5 flex-1">
        {roster.species.length > 0 ? (
          roster.species.map((name, i) => {
            const species = getSpecies(name);
            return (
              <div key={i} className="flex items-center justify-center">
                {species ? (
                  <img
                    src={getSpriteUrl(species.id)}
                    alt={name}
                    title={name}
                    draggable={false}
                    className="w-14 h-14 object-contain opacity-90"
                    onError={(e) =>
                      (e.currentTarget.style.visibility = "hidden")
                    }
                  />
                ) : (
                  <span className="text-[8px] font-bold text-muted">
                    {name.slice(0, 3).toUpperCase()}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <span className="col-span-3 row-span-2 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-muted">
            Empty slot
          </span>
        )}
      </div>

      {menuOpen && (
        <div
          className="absolute top-8 right-2 z-30 bg-night border border-white/10 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.6)] py-1 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onDuplicate}
            className="w-full flex items-center space-x-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-white/5 transition-colors"
          >
            <Copy size={12} />
            <span>Duplicate</span>
          </button>
          <button
            onClick={onCopyPaste}
            className="w-full flex items-center space-x-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-white/5 transition-colors"
          >
            <ClipboardCopy size={12} />
            <span>Copy paste</span>
          </button>
          <button
            onClick={onDelete}
            className="w-full flex items-center space-x-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-loss hover:bg-loss/10 transition-colors"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
