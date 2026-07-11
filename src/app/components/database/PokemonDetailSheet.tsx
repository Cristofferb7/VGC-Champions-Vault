import { getSpecies } from "../../../data/speciesLexicon";
import type { DetailStateLike } from "./detailTypes";
import { getSpriteUrl } from "../../../lib/sprites";
import type { NamedPct } from "../../../types";
import { AnimatedPct } from "../shared/AnimatedPct";
import { SpriteOrb } from "../shared/SpriteOrb";
import { TypeBadge } from "../shared/TypeBadge";
import { PctBar } from "./PctBar";

function BarSection({
  title,
  items,
  limit,
  color,
}: {
  title: string;
  items: NamedPct[];
  limit: number;
  color?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mb-4">
      <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted mb-2">
        {title}
      </h3>
      <div className="space-y-1.5">
        {items.slice(0, limit).map((item, index) => (
          <PctBar
            key={item.name}
            label={item.name}
            pct={item.pct}
            index={index}
            color={color}
          />
        ))}
      </div>
    </section>
  );
}

const SKELETON_WIDTHS = ["w-3/4", "w-2/3", "w-1/2", "w-2/5", "w-1/3"];

function DetailSkeleton() {
  return (
    <div className="space-y-2 py-2" aria-label="Loading">
      {SKELETON_WIDTHS.map((width, i) => (
        <div key={i} className="flex items-center space-x-2 animate-pulse">
          <div className="w-[110px] h-3 bg-white/5 rounded" />
          <div className={`h-1.5 bg-white/10 rounded-full ${width}`} />
        </div>
      ))}
    </div>
  );
}

interface PokemonDetailSheetProps {
  name: string;
  state: DetailStateLike;
}

/** Pikalytics-style per-Pokémon breakdown rendered inside a BottomSheet. */
export function PokemonDetailSheet({ name, state }: PokemonDetailSheetProps) {
  const { detail, loading, error } = state;
  const species = getSpecies(name);

  return (
    <div>
      {/* Identity header */}
      <div className="flex items-center space-x-3 mb-4">
        {species ? (
          <SpriteOrb spriteId={species.id} alt={name} size="sm" />
        ) : null}
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wider text-ink">
            {name}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {species?.types.map((type) => <TypeBadge key={type} type={type} />)}
            {detail?.winRate != null && (
              <span className="text-[9px] font-mono font-bold text-win ml-1">
                <AnimatedPct value={detail.winRate} /> WIN
              </span>
            )}
            {detail?.record && (
              <span className="text-[9px] font-mono text-muted">
                ({detail.record})
              </span>
            )}
          </div>
        </div>
      </div>

      {loading && !detail && <DetailSkeleton />}

      {error && !detail && (
        <p className="text-[10px] text-loss tracking-wide py-4 text-center">
          Couldn't load data for {name}. Check your connection and try again.
        </p>
      )}

      {detail && (
        <>
          {/* Top spread */}
          {detail.spread && (
            <section className="mb-4 bg-night/60 rounded-lg border border-white/5 px-3 py-2">
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1">
                Top Spread{" "}
                <span className="normal-case tracking-normal">
                  (HP/Atk/Def/SpA/SpD/Spe stat points)
                </span>
              </h3>
              <p className="text-[11px] font-mono font-bold text-ink">
                {detail.spread.nature ? `${detail.spread.nature} · ` : ""}
                {detail.spread.evs}
                {detail.spread.pct !== null && (
                  <span className="text-muted"> — {detail.spread.pct}% of builds</span>
                )}
              </p>
            </section>
          )}

          <BarSection title="Moves" items={detail.moves} limit={8} />
          <BarSection
            title="Items"
            items={detail.items}
            limit={6}
            color="bg-[#8B5CF6]"
          />
          <BarSection
            title="Abilities"
            items={detail.abilities}
            limit={4}
            color="bg-win"
          />

          {/* Teammates: API omits percentages, so plain chips — never faked */}
          {detail.teammates.length > 0 && (
            <section className="mb-4">
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted mb-2">
                Common Teammates
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {detail.teammates.map((mate) => {
                  const mateSpecies = getSpecies(mate.name);
                  return (
                    <span
                      key={mate.name}
                      className="flex items-center space-x-1 bg-night rounded-full border border-white/10 pl-1 pr-2 py-0.5"
                    >
                      {mateSpecies && (
                        <img
                          src={getSpriteUrl(mateSpecies.id)}
                          alt=""
                          className="w-5 h-5 object-contain"
                          onError={(e) =>
                            (e.currentTarget.style.visibility = "hidden")
                          }
                        />
                      )}
                      <span className="text-[9px] font-bold uppercase tracking-wider text-ink">
                        {mate.name}
                        {mate.pct !== null && (
                          <span className="text-muted font-mono"> {mate.pct}%</span>
                        )}
                      </span>
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* Defensive profile straight from the source */}
          {(detail.weakTo.length > 0 || detail.resists.length > 0) && (
            <section className="mb-2">
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted mb-2">
                Defensive Profile
              </h3>
              <div className="space-y-1">
                {(
                  [
                    ["Weak to", detail.weakTo, "text-loss"],
                    ["Resists", detail.resists, "text-win"],
                    ["Immune", detail.immuneTo, "text-aura"],
                  ] as const
                ).map(([label, list, tone]) =>
                  list.length > 0 ? (
                    <p key={label} className="text-[10px] tracking-wide">
                      <span className={`font-bold uppercase ${tone}`}>
                        {label}:
                      </span>{" "}
                      <span className="text-ink">{list.join(", ")}</span>
                    </p>
                  ) : null,
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
