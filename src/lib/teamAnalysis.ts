import { getSpecies } from "../data/speciesLexicon";
import { TYPE_CHART } from "../data/typeChart";
import type { Pokemon, TeamWeakness, TypeName } from "../types";

/** Species name → analyzable Pokemon via the lexicon (unknown = typeless). */
export function toPokemon(name: string): Pokemon {
  const species = getSpecies(name);
  return {
    id: species?.id ?? 0,
    name: name.toUpperCase(),
    types: species?.types ?? [],
  };
}

function defensiveMultiplier(attack: TypeName, poke: Pokemon): number {
  return poke.types.reduce(
    (multiplier, defend) => multiplier * (TYPE_CHART[attack][defend] ?? 1),
    1,
  );
}

/** Shared team weaknesses: types that hit 2+ members super-effectively. */
export function computeTeamWeaknesses(team: Pokemon[]): TeamWeakness[] {
  const attackTypes = Object.keys(TYPE_CHART) as TypeName[];

  return attackTypes
    .map((type) => ({
      type,
      members: team
        .map((poke) => ({
          name: poke.name,
          multiplier: defensiveMultiplier(type, poke),
        }))
        .filter((member) => member.multiplier >= 2)
        .sort((a, b) => b.multiplier - a.multiplier),
    }))
    .filter((weakness) => weakness.members.length >= 2)
    .sort(
      (a, b) =>
        b.members.length - a.members.length ||
        b.members.reduce((sum, m) => sum + m.multiplier, 0) -
          a.members.reduce((sum, m) => sum + m.multiplier, 0),
    )
    .slice(0, 3);
}

/** Offensive coverage: which attack types someone on the team hits 2x with (STAB only). */
export function offensiveCoverage(
  team: Pokemon[],
): Array<{ type: TypeName; covered: boolean }> {
  const allTypes = Object.keys(TYPE_CHART) as TypeName[];
  return allTypes.map((defendType) => ({
    type: defendType,
    covered: team.some((poke) =>
      poke.types.some((attack) => (TYPE_CHART[attack][defendType] ?? 1) >= 2),
    ),
  }));
}
