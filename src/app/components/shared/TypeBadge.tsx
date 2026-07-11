import { TYPE_COLORS } from "../../../data/typeColors";
import type { TypeName } from "../../../types";

interface TypeBadgeProps {
  type: TypeName;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span
      className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border border-white/10 shadow-sm text-white"
      style={{ backgroundColor: `${TYPE_COLORS[type]}80` }}
    >
      {type}
    </span>
  );
}
