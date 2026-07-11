import { CheckCircle2, MinusCircle, XCircle, Zap } from "lucide-react";
import type { SelectedMatchup } from "../../../hooks/useMatchupAnalysis";
import { bestDamageEstimate, speedTier } from "../../../lib/damage";
import { formatMultiplier } from "../../../lib/matchup";
import type { PokemonDetail } from "../../../types";
import { SpriteOrb } from "../shared/SpriteOrb";
import { TypeBadge } from "../shared/TypeBadge";

const VERDICT_META = {
  Good: { Icon: CheckCircle2, tone: "text-win", label: "Favorable" },
  Bad: { Icon: XCircle, tone: "text-loss", label: "Unfavorable" },
  Neutral: { Icon: MinusCircle, tone: "text-muted", label: "Even" },
} as const;

function DamageRow({
  attacker,
  defender,
  attackerDetail,
  defenderDetail,
  tone,
}: {
  attacker: string;
  defender: string;
  attackerDetail: PokemonDetail | null;
  defenderDetail: PokemonDetail | null;
  tone: string;
}) {
  const estimate = bestDamageEstimate(
    attacker,
    attackerDetail,
    defender,
    defenderDetail,
  );
  if (!estimate) {
    return (
      <p className="text-[9px] text-muted tracking-wide">
        <span className="font-bold uppercase">{attacker}</span> — no calc data;
        type chart only.
      </p>
    );
  }
  return (
    <p className="text-[10px] tracking-wide text-ink">
      <span className="font-bold uppercase">{attacker}</span>{" "}
      <span className="text-muted">→</span> {estimate.move}
      {estimate.moveUsagePct !== null && (
        <span className="text-muted font-mono"> ({estimate.moveUsagePct}% usage)</span>
      )}
      : <span className={`font-mono font-bold ${tone}`}>
        {estimate.minPct.toFixed(0)}–{estimate.maxPct.toFixed(0)}%
      </span>{" "}
      to {defender}
    </p>
  );
}

function SpeedStrip({
  mine,
  theirs,
  myDetail,
  theirDetail,
}: {
  mine: string;
  theirs: string;
  myDetail: PokemonDetail | null;
  theirDetail: PokemonDetail | null;
}) {
  if (!myDetail?.baseStats || !theirDetail?.baseStats) return null;
  const tiers = [
    { name: mine, tier: speedTier(myDetail.baseStats.spe, myDetail), color: "bg-aura" },
    { name: theirs, tier: speedTier(theirDetail.baseStats.spe, theirDetail), color: "bg-loss" },
  ];
  const scaleMax = Math.max(...tiers.map(({ tier }) => tier.max)) + 10;

  const mySpeed = tiers[0].tier.atSpread;
  const theirSpeed = tiers[1].tier.atSpread;
  const verdictText =
    mySpeed !== null && theirSpeed !== null
      ? mySpeed === theirSpeed
        ? "Speed tie at common spreads"
        : `${mySpeed > theirSpeed ? mine : theirs} likely moves first at common spreads`
      : null;

  return (
    <section className="mt-4 pt-3 border-t border-white/5">
      <h3 className="flex items-center text-[9px] font-bold uppercase tracking-widest text-muted mb-2">
        <Zap size={10} className="mr-1" />
        Speed Tiers (LV 50)
      </h3>
      <div className="space-y-2">
        {tiers.map(({ name, tier, color }) => (
          <div key={name} className="flex items-center space-x-2">
            <span className="w-[90px] flex-shrink-0 text-[9px] font-bold uppercase tracking-wider text-ink truncate">
              {name}
            </span>
            <div className="relative flex-1 h-2 bg-night rounded-full border border-white/5">
              <div
                className={`absolute top-0 bottom-0 rounded-full opacity-40 ${color}`}
                style={{
                  left: `${(tier.min / scaleMax) * 100}%`,
                  width: `${((tier.max - tier.min) / scaleMax) * 100}%`,
                }}
              />
              {tier.atSpread !== null && (
                <div
                  className={`absolute -top-0.5 w-1 h-3 rounded ${color}`}
                  style={{ left: `${(tier.atSpread / scaleMax) * 100}%` }}
                  title={`${tier.atSpread} at common spread`}
                />
              )}
            </div>
            <span className="w-16 flex-shrink-0 text-right text-[9px] font-mono text-muted">
              {tier.min}–{tier.max}
            </span>
          </div>
        ))}
      </div>
      {verdictText && (
        <p className="text-[9px] text-muted tracking-wide mt-2">{verdictText}</p>
      )}
    </section>
  );
}

interface MatchupDetailProps {
  matchup: SelectedMatchup | null;
  myDetail: PokemonDetail | null;
  theirDetail: PokemonDetail | null;
  detailsLoading: boolean;
}

/** Tap-a-cell drill-down: type math, damage estimates, and speed tiers. */
export function MatchupDetail({
  matchup,
  myDetail,
  theirDetail,
  detailsLoading,
}: MatchupDetailProps) {
  if (!matchup) return null;

  const { mine, theirs, result } = matchup;
  const { Icon, tone, label } = VERDICT_META[result.verdict];

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1 mb-3">
        <div className="flex items-center space-x-2">
          <Icon size={14} className={tone} />
          <span className={`text-[11px] font-bold uppercase tracking-wider ${tone}`}>
            {label} matchup
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted">
          Usage-based likelihood
        </span>
      </div>

      <div className="flex items-center justify-between">
        {[
          { poke: mine, edge: result.myEdge, owner: "You" },
          { poke: theirs, edge: result.theirEdge, owner: "Opponent" },
        ].map(({ poke, edge, owner }) => (
          <div key={owner} className="flex flex-col items-center flex-1">
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted mb-1.5">
              {owner}
            </span>
            <SpriteOrb spriteId={poke.id} alt={poke.name} size="sm" />
            <span className="text-[9px] font-bold text-ink tracking-wider mt-1.5 mb-1">
              {poke.name}
            </span>
            <div className="flex gap-1 mb-2">
              {poke.types.map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
            <span className="text-[10px] font-mono font-bold text-ink bg-night px-2 py-0.5 rounded border border-white/10">
              {formatMultiplier(edge)} best hit
            </span>
          </div>
        ))}
      </div>

      {/* Damage estimates from usage moves + spreads */}
      <section className="mt-4 pt-3 border-t border-white/5">
        <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted mb-2">
          Damage Estimate{" "}
          <span className="normal-case tracking-normal">
            (top usage moves & spreads · Gen 9 approximation)
          </span>
        </h3>
        {detailsLoading && !myDetail && !theirDetail ? (
          <div className="space-y-1.5 animate-pulse">
            <div className="h-3 bg-white/5 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-2/3" />
          </div>
        ) : (
          <div className="space-y-1.5">
            <DamageRow
              attacker={mine.name}
              defender={theirs.name}
              attackerDetail={myDetail}
              defenderDetail={theirDetail}
              tone="text-win"
            />
            <DamageRow
              attacker={theirs.name}
              defender={mine.name}
              attackerDetail={theirDetail}
              defenderDetail={myDetail}
              tone="text-loss"
            />
          </div>
        )}
      </section>

      <SpeedStrip
        mine={mine.name}
        theirs={theirs.name}
        myDetail={myDetail}
        theirDetail={theirDetail}
      />
      {/* Lead likelihood intentionally absent: the API exposes no lead
          stats for this format — never fake it (sprint P2). */}
    </div>
  );
}
