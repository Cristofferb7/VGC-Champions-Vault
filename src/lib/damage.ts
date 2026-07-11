import {
  calculate,
  Generations,
  Move,
  Pokemon as CalcPokemon,
} from "@smogon/calc";
import type { PokemonDetail } from "../types";

/**
 * Damage estimates run on @smogon/calc's Gen 9 data. Champions tweaks
 * move stats and adds new Megas, so results are labeled a "Gen 9
 * approximation" in the UI until the Champions data layer is vendored
 * (see brief: NCP-VGC-Damage-Calculator fork).
 */
const GEN = Generations.get(9);

type EvSpread = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};

/** Champions stat points (0–32) → EV equivalents (×8, capped at 252). */
export function statPointsToEvs(evString: string): EvSpread | null {
  const parts = evString.split("/").map((n) => Number.parseInt(n, 10));
  if (parts.length !== 6 || parts.some(Number.isNaN)) return null;
  const [hp, atk, def, spa, spd, spe] = parts.map((sp) =>
    Math.min(sp * 8, 252),
  );
  return { hp, atk, def, spa, spd, spe };
}

/** "GARCHOMP" / "flutter mane" → "Garchomp" / "Flutter Mane" for calc data. */
function toCalcName(name: string): string {
  return name
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

function buildCalcPokemon(name: string, detail: PokemonDetail | null) {
  const evs = detail?.spread ? statPointsToEvs(detail.spread.evs) : null;
  return new CalcPokemon(GEN, toCalcName(name), {
    level: 50,
    ...(evs ? { evs } : {}),
  });
}

export interface DamageEstimate {
  move: string;
  moveUsagePct: number | null;
  minPct: number;
  maxPct: number;
}

/**
 * Strongest hit among the attacker's top-4 usage moves against the
 * defender at both sides' most common spreads. Null when the species or
 * its moves aren't in the calc data — callers fall back to type math.
 */
export function bestDamageEstimate(
  attackerName: string,
  attackerDetail: PokemonDetail | null,
  defenderName: string,
  defenderDetail: PokemonDetail | null,
): DamageEstimate | null {
  if (!attackerDetail?.moves.length) return null;
  let attacker: CalcPokemon;
  let defender: CalcPokemon;
  try {
    attacker = buildCalcPokemon(attackerName, attackerDetail);
    defender = buildCalcPokemon(defenderName, defenderDetail);
  } catch {
    return null;
  }

  let best: DamageEstimate | null = null;
  for (const move of attackerDetail.moves.slice(0, 4)) {
    try {
      const result = calculate(GEN, attacker, defender, new Move(GEN, move.name));
      const [min, max] = result.range();
      const maxHp = defender.maxHP();
      const estimate: DamageEstimate = {
        move: move.name,
        moveUsagePct: move.pct,
        minPct: (min / maxHp) * 100,
        maxPct: (max / maxHp) * 100,
      };
      if (estimate.maxPct > 0 && (!best || estimate.maxPct > best.maxPct)) {
        best = estimate;
      }
    } catch {
      // Move unknown to Gen 9 data (Champions-only move) — skip it.
    }
  }
  return best;
}

export interface SpeedTier {
  /** Level-50 speed with 0 investment, neutral nature. */
  min: number;
  /** Level-50 speed with max investment, +Speed nature. */
  max: number;
  /** Speed at the most common spread (neutral nature), if known. */
  atSpread: number | null;
}

function speedStat(base: number, ev: number, natureBoost: 1 | 1.1): number {
  const raw = Math.floor(((2 * base + 31 + Math.floor(ev / 4)) * 50) / 100) + 5;
  return Math.floor(raw * natureBoost);
}

export function speedTier(
  baseSpeed: number,
  detail: PokemonDetail | null,
): SpeedTier {
  const evs = detail?.spread ? statPointsToEvs(detail.spread.evs) : null;
  return {
    min: speedStat(baseSpeed, 0, 1),
    max: speedStat(baseSpeed, 252, 1.1),
    atSpread: evs ? speedStat(baseSpeed, evs.spe, 1) : null,
  };
}
