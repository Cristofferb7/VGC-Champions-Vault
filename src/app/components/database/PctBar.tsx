import { motion } from "motion/react";

interface PctBarProps {
  label: string;
  pct: number | null;
  index?: number;
  color?: string;
}

/** Horizontal percentage bar, animated on mount. Null pct = no bar, no fake. */
export function PctBar({ label, pct, index = 0, color = "bg-aura" }: PctBarProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="w-[110px] flex-shrink-0 text-[10px] font-bold text-ink tracking-wide truncate">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-night rounded-full overflow-hidden border border-white/5">
        {pct !== null && (
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ delay: index * 0.03, duration: 0.4, ease: "easeOut" }}
          />
        )}
      </div>
      <span className="w-11 flex-shrink-0 text-right text-[10px] font-mono font-bold text-muted">
        {pct !== null ? `${pct.toFixed(1)}%` : "—"}
      </span>
    </div>
  );
}
