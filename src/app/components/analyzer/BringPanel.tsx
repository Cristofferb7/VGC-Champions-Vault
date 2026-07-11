import { motion } from "motion/react";
import { Users } from "lucide-react";
import { getSpecies } from "../../../data/speciesLexicon";
import type { BringEstimate } from "../../../lib/bringLikelihood";
import { getSpriteUrl } from "../../../lib/sprites";

interface BringPanelProps {
  estimates: BringEstimate[] | null;
  loading: boolean;
}

/**
 * Ranks which 4 of the opponent's 6 they most likely bring. Rendered only
 * for a complete preview; estimates are usage-derived, never real bring
 * rates, and the footer says so.
 */
export function BringPanel({ estimates, loading }: BringPanelProps) {
  if (!estimates && !loading) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center text-xs font-semibold tracking-wider text-ink uppercase">
          <Users size={12} className="mr-1.5 text-muted" />
          Likely Brings (4 of 6)
        </h2>
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted">
          Usage-based likelihood
        </span>
      </div>

      <div className="bg-panel rounded-xl border border-white/5 p-3 shadow-lg">
        {loading && !estimates ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-8 bg-white/5 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {estimates?.map((estimate, index) => {
              const species = getSpecies(estimate.name);
              const likelyBring = index < 4;
              return (
                <div
                  key={estimate.name}
                  className={`flex items-center rounded-lg border px-2 py-1.5 ${
                    likelyBring
                      ? "bg-night border-aura/20"
                      : "bg-night/40 border-white/5 opacity-60"
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mr-2">
                    {species && (
                      <img
                        src={getSpriteUrl(species.id)}
                        alt=""
                        className="w-8 h-8 object-contain"
                        onError={(e) =>
                          (e.currentTarget.style.visibility = "hidden")
                        }
                      />
                    )}
                  </div>
                  <span className="flex-1 text-[10px] font-bold uppercase tracking-wider text-ink truncate">
                    {estimate.name}
                  </span>
                  {estimate.synergies > 0 && (
                    <span
                      className="text-[8px] font-bold uppercase tracking-wider text-aura mr-2"
                      title={`Listed as a common teammate by ${estimate.synergies} of the other 5`}
                    >
                      ×{estimate.synergies} synergy
                    </span>
                  )}
                  <div className="w-20 h-1.5 bg-night rounded-full overflow-hidden border border-white/5 mr-2">
                    <motion.div
                      className={`h-full rounded-full ${likelyBring ? "bg-aura" : "bg-muted"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${estimate.pct}%` }}
                      transition={{ delay: index * 0.04, duration: 0.4 }}
                    />
                  </div>
                  <span className="w-9 text-right text-[10px] font-mono font-bold text-ink">
                    {estimate.pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[8px] text-muted tracking-wide mt-2.5 pt-2 border-t border-white/5">
          Derived from overall ladder usage (games) + teammate co-occurrence.
          Real bring rates aren't published — treat as a prior, not a read.
        </p>
      </div>
    </section>
  );
}
