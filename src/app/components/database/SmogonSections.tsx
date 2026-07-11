import { getSpecies } from "../../../data/speciesLexicon";
import { getSpriteUrl } from "../../../lib/sprites";
import {
  TIER_LABELS,
  formatMonthLabel,
  type SmogonStore,
  type SmogonTierId,
} from "../../../lib/smogon";

/**
 * Smogon-derived detail sections (spread distribution, Checks & Counters,
 * lead usage, usage trend). Every block carries its source label — this is
 * Showdown ladder data, not cartridge, per the brief's honesty rules.
 */

function SourceTag({ label }: { label: string }) {
  return (
    <span className="text-[8px] font-mono normal-case tracking-normal text-muted">
      {label}
    </span>
  );
}

/** Inline usage-trend sparkline; renders only with ≥2 monthly snapshots. */
function TrendSparkline({
  points,
}: {
  points: Array<{ month: string; usage: number }>;
}) {
  if (points.length < 2) return null;
  const w = 96;
  const h = 24;
  const max = Math.max(...points.map((p) => p.usage));
  const min = Math.min(...points.map((p) => p.usage));
  const span = max - min || 1;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * (w - 4) + 2;
      const y = h - 3 - ((p.usage - min) / span) * (h - 6);
      return `${x},${y}`;
    })
    .join(" ");
  const rising = points[points.length - 1].usage >= points[0].usage;

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={points
        .map((p) => `${formatMonthLabel(p.month)}: ${p.usage}%`)
        .join(" · ")}
    >
      <svg width={w} height={h} className="block">
        <polyline
          points={coords}
          fill="none"
          stroke={rising ? "#10B981" : "#EF4444"}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className={`text-[9px] font-mono font-bold ${rising ? "text-win" : "text-loss"}`}>
        {points[0].usage}% → {points[points.length - 1].usage}%
      </span>
    </span>
  );
}

interface SmogonSectionsProps {
  name: string;
  tier: SmogonTierId;
  store: SmogonStore;
}

export function SmogonSections({ name, tier, store }: SmogonSectionsProps) {
  const data = store.lookup(name, tier);
  if (!data) return null;

  const counters = store.counters(name);
  const history = store.history(name);
  const srcLabel = `Showdown · ${store.monthLabel} · ${TIER_LABELS[tier]}`;

  return (
    <>
      {/* Usage trend across monthly snapshots */}
      {history.length >= 2 && (
        <section className="mb-4 bg-night/60 rounded-lg border border-white/5 px-3 py-2">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1">
            Usage Trend <SourceTag label={`Showdown · all ladder · ${history.length} months`} />
          </h3>
          <TrendSparkline points={history} />
        </section>
      )}

      {/* Lead usage — early in the sheet so it's actually seen (QA s6
          couldn't find it at the bottom). Hidden entirely when the leads
          report has no row for this species. */}
      {data.leadPct !== null && (
        <section className="mb-4 bg-night/60 rounded-lg border border-white/5 px-3 py-2">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1">
            Lead Usage <SourceTag label={srcLabel} />
          </h3>
          <p className="text-[11px] font-mono font-bold text-ink">
            {data.leadPct.toFixed(1)}%{" "}
            <span className="text-muted font-normal">
              of lead slots (doubles: front two)
            </span>
          </p>
        </section>
      )}

      {/* Spread distribution — the thing Pikalytics' API doesn't expose */}
      {data.spreads.length > 0 && (
        <section className="mb-4">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted mb-2">
            Spread Distribution <SourceTag label={srcLabel} />
          </h3>
          <div className="space-y-1">
            {data.spreads.slice(0, 5).map((spread) => (
              <div
                key={`${spread.nature}:${spread.evs}`}
                className="flex items-center text-[10px] font-mono"
              >
                <span className="w-[150px] flex-shrink-0 text-ink truncate">
                  {spread.nature} {spread.evs}
                </span>
                <span className="flex-1 h-1.5 bg-night rounded-full overflow-hidden border border-white/5 mx-2">
                  <span
                    className="block h-full bg-aura rounded-full"
                    style={{ width: `${Math.min(100, spread.pct)}%` }}
                  />
                </span>
                <span className="w-10 text-right font-bold text-ink">
                  {spread.pct}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Checks & Counters — real matchup outcomes, all-ladder tier */}
      {counters.length > 0 && (
        <section className="mb-4">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted mb-2">
            Checks &amp; Counters{" "}
            <SourceTag label={`Showdown · ${store.monthLabel} · all ladder`} />
          </h3>
          <div className="space-y-1">
            {counters.slice(0, 5).map((counter) => {
              const counterSpecies = getSpecies(counter.name);
              return (
                <div
                  key={counter.name}
                  className="flex items-center bg-night rounded-lg border border-white/5 px-2 py-1"
                >
                  {counterSpecies && (
                    <img
                      src={getSpriteUrl(counterSpecies.id)}
                      alt=""
                      className="w-6 h-6 object-contain mr-1.5"
                      onError={(e) =>
                        (e.currentTarget.style.visibility = "hidden")
                      }
                    />
                  )}
                  <span className="flex-1 text-[10px] font-bold uppercase tracking-wider text-ink truncate">
                    {counter.name}
                  </span>
                  <span
                    className="text-[9px] font-mono text-loss font-bold"
                    title={`KOs or forces out ${name} in ${counter.p}% of ${counter.n.toLocaleString()} weighted encounters (score ${counter.score})`}
                  >
                    {counter.p}% KO/switch
                  </span>
                  <span className="text-[8px] font-mono text-muted ml-1.5">
                    n={counter.n.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </>
  );
}
