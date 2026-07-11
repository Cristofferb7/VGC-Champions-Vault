import { AlertTriangle, Check, Download, Loader2, Share, X } from "lucide-react";
import { formatMultiplier } from "../../../lib/matchup";
import type { Pokemon, TeamWeakness, TypeName } from "../../../types";

const SHARE_ICONS = {
  idle: Share,
  working: Loader2,
  shared: Check,
  copied: Check,
  error: X,
} as const;

export type ShareState = keyof typeof SHARE_ICONS;
import { SpriteOrb } from "../shared/SpriteOrb";
import { TypeBadge } from "../shared/TypeBadge";

interface ActiveTeamCardProps {
  team: Pokemon[];
  record: { wins: number; losses: number };
  formatLabel: string;
  weaknesses: TeamWeakness[];
  expandedWeakness: TypeName | null;
  onToggleWeakness: (type: TypeName) => void;
  shareState: ShareState;
  onShareImage: () => void;
  onCopyPaste: () => void;
}

export function ActiveTeamCard({
  team,
  record,
  formatLabel,
  weaknesses,
  expandedWeakness,
  onToggleWeakness,
  shareState,
  onShareImage,
  onCopyPaste,
}: ActiveTeamCardProps) {
  const ShareIcon = SHARE_ICONS[shareState];
  const expanded = weaknesses.find((w) => w.type === expandedWeakness);

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wider text-ink uppercase mb-3">
        Active Team
      </h2>

      {/* Holographic border wrapper */}
      <div className="relative rounded-[20px] p-[2px] bg-gradient-to-br from-aura via-[#8B5CF6] to-[#EC4899] animate-holo shadow-[0_8px_30px_rgba(139,92,246,0.2)]">
        <div className="bg-panel rounded-[18px] p-4 h-full w-full flex flex-col">
          {/* Card header */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col space-y-2">
              <span className="px-2.5 py-1 bg-night rounded-full text-[10px] font-bold text-ink uppercase tracking-wider border border-white/10 shadow-inner w-max">
                {formatLabel}
              </span>
              <div className="flex items-center space-x-2 bg-night/50 rounded-md px-2 py-1 w-max border border-white/5">
                <span className="text-[11px] font-mono font-bold text-win">
                  W: {record.wins}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#4B5563]">
                  |
                </span>
                <span className="text-[11px] font-mono font-bold text-loss">
                  L: {record.losses}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  aria-label="Share team sheet image"
                  title="Share / download team-sheet image"
                  onClick={onShareImage}
                  disabled={shareState === "working"}
                  className={`flex items-center justify-center p-1.5 bg-night rounded-lg border border-white/5 shadow-sm transition-colors hover:text-ink ${
                    shareState === "shared"
                      ? "text-win"
                      : shareState === "error"
                        ? "text-loss"
                        : "text-muted"
                  }`}
                >
                  <ShareIcon
                    size={14}
                    className={shareState === "working" ? "animate-spin" : ""}
                  />
                </button>
                <button
                  aria-label="Copy Showdown paste"
                  title="Copy team as Showdown paste"
                  onClick={onCopyPaste}
                  className={`flex items-center justify-center p-1.5 bg-night rounded-lg border border-white/5 shadow-sm transition-colors hover:text-ink ${
                    shareState === "copied" ? "text-win" : "text-muted"
                  }`}
                >
                  {shareState === "copied" ? (
                    <Check size={14} />
                  ) : (
                    <Download size={14} />
                  )}
                </button>
              </div>

              {/* Shared weaknesses: "TYPE ×N MONS" = N members hit super-effectively */}
              <div className="flex flex-col items-end gap-1">
                {weaknesses.map(({ type, members }) => (
                  <button
                    key={type}
                    onClick={() => onToggleWeakness(type)}
                    className={`flex items-center px-2 py-1 rounded border transition-colors ${
                      expandedWeakness === type
                        ? "bg-warn/25 text-warn border-warn/60"
                        : "bg-warn/10 text-warn border-warn/30"
                    }`}
                  >
                    <AlertTriangle size={10} className="mr-1.5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">
                      {type} ×{members.length} mons
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expanded weakness: who's affected and how hard */}
          {expanded && (
            <div className="mb-2 px-3 py-2 bg-night/60 rounded-lg border border-warn/20 flex flex-wrap gap-x-4 gap-y-1">
              {expanded.members.map((member) => (
                <span
                  key={member.name}
                  className="text-[9px] font-bold uppercase tracking-wider text-ink"
                >
                  {member.name}{" "}
                  <span className="font-mono text-warn">
                    {formatMultiplier(member.multiplier)}
                  </span>
                </span>
              ))}
            </div>
          )}

          <div className="mb-5 pb-1 border-b border-white/5" />

          {/* 3x2 team grid */}
          <div className="grid grid-cols-3 gap-y-6 gap-x-2">
            {team.map((poke) => (
              <div key={poke.id} className="flex flex-col items-center">
                <div className="mb-2">
                  <SpriteOrb spriteId={poke.id} alt={poke.name} />
                </div>
                <span className="text-[10px] font-bold text-ink tracking-wider mb-1.5 text-center w-full truncate px-1">
                  {poke.name}
                </span>
                <div className="flex flex-wrap justify-center gap-1">
                  {poke.types.map((type) => (
                    <TypeBadge key={type} type={type} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
