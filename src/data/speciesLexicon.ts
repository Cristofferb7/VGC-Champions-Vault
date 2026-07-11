import type { TypeName } from "../types";

export interface SpeciesInfo {
  /** PokeAPI sprite id (form-specific where the form has its own art). */
  id: number;
  types: TypeName[];
}

/**
 * Species appearing in the Reg M-B usage data, keyed by Pikalytics naming.
 * Config-driven on purpose: regulation churn means this list gets replaced,
 * never edited piecemeal (see FORMAT_CODE in config.ts).
 */
const LEXICON: Record<string, SpeciesInfo> = {
  garchomp: { id: 445, types: ["Dragon", "Ground"] },
  sinistcha: { id: 1013, types: ["Grass", "Ghost"] },
  basculegion: { id: 902, types: ["Water", "Ghost"] },
  whimsicott: { id: 547, types: ["Grass", "Fairy"] },
  kingambit: { id: 983, types: ["Dark", "Steel"] },
  staraptor: { id: 398, types: ["Normal", "Flying"] },
  incineroar: { id: 727, types: ["Fire", "Dark"] },
  charizard: { id: 6, types: ["Fire", "Flying"] },
  raichu: { id: 26, types: ["Electric"] },
  pelipper: { id: 279, types: ["Water", "Flying"] },
  sneasler: { id: 903, types: ["Fighting", "Poison"] },
  archaludon: { id: 1018, types: ["Steel", "Dragon"] },
  grimmsnarl: { id: 861, types: ["Dark", "Fairy"] },
  sylveon: { id: 700, types: ["Fairy"] },
  swampert: { id: 260, types: ["Water", "Ground"] },
  metagross: { id: 376, types: ["Steel", "Psychic"] },
  farigiraf: { id: 981, types: ["Normal", "Psychic"] },
  "floette-eternal": { id: 10061, types: ["Fairy"] },
  gholdengo: { id: 1000, types: ["Steel", "Ghost"] },
  aerodactyl: { id: 142, types: ["Rock", "Flying"] },
  maushold: { id: 925, types: ["Normal"] },
  annihilape: { id: 979, types: ["Fighting", "Ghost"] },
  sableye: { id: 302, types: ["Dark", "Ghost"] },
  mawile: { id: 303, types: ["Steel", "Fairy"] },
  "ninetales-alola": { id: 10104, types: ["Ice", "Fairy"] },
  torkoal: { id: 324, types: ["Fire"] },
  froslass: { id: 478, types: ["Ice", "Ghost"] },
  talonflame: { id: 663, types: ["Fire", "Flying"] },
  "rotom-wash": { id: 10009, types: ["Electric", "Water"] },
  glimmora: { id: 970, types: ["Rock", "Poison"] },
  delphox: { id: 655, types: ["Fire", "Psychic"] },
  dragonite: { id: 149, types: ["Dragon", "Flying"] },
  tyranitar: { id: 248, types: ["Rock", "Dark"] },
  blastoise: { id: 9, types: ["Water"] },
  milotic: { id: 350, types: ["Water"] },
  venusaur: { id: 3, types: ["Grass", "Poison"] },
  hydreigon: { id: 635, types: ["Dark", "Dragon"] },
  politoed: { id: 186, types: ["Water"] },
  tsareena: { id: 763, types: ["Grass"] },
  gengar: { id: 94, types: ["Ghost", "Poison"] },
  kangaskhan: { id: 115, types: ["Normal"] },
  pyroar: { id: 668, types: ["Fire", "Normal"] },
  gardevoir: { id: 282, types: ["Psychic", "Fairy"] },
  corviknight: { id: 823, types: ["Flying", "Steel"] },
  scrafty: { id: 560, types: ["Dark", "Fighting"] },
  vivillon: { id: 666, types: ["Bug", "Flying"] },
  eelektross: { id: 604, types: ["Electric"] },
  scovillain: { id: 952, types: ["Grass", "Fire"] },
  primarina: { id: 730, types: ["Water", "Fairy"] },
  ceruledge: { id: 937, types: ["Fire", "Ghost"] },
  excadrill: { id: 530, types: ["Ground", "Steel"] },
  lucario: { id: 448, types: ["Fighting", "Steel"] },
  rillaboom: { id: 812, types: ["Grass"] },
  "flutter mane": { id: 987, types: ["Ghost", "Fairy"] },
  "flutter-mane": { id: 987, types: ["Ghost", "Fairy"] },
  gyarados: { id: 130, types: ["Water", "Flying"] },
  scizor: { id: 212, types: ["Bug", "Steel"] },
  heatran: { id: 485, types: ["Fire", "Steel"] },
  cresselia: { id: 488, types: ["Psychic"] },
  ferrothorn: { id: 598, types: ["Grass", "Steel"] },
  kyogre: { id: 382, types: ["Water"] },
  umbreon: { id: 197, types: ["Dark"] },
  skarmory: { id: 227, types: ["Steel", "Flying"] },
  rotom: { id: 479, types: ["Electric", "Ghost"] },
  abra: { id: 63, types: ["Psychic"] },
  snorlax: { id: 143, types: ["Normal"] },
  pikachu: { id: 25, types: ["Electric"] },
  lapras: { id: 131, types: ["Water", "Ice"] },
  mewtwo: { id: 150, types: ["Psychic"] },
  alakazam: { id: 65, types: ["Psychic"] },
  machamp: { id: 68, types: ["Fighting"] },
  vaporeon: { id: 134, types: ["Water"] },
  zapdos: { id: 145, types: ["Electric", "Flying"] },
  suicune: { id: 245, types: ["Water"] },
  ogerpon: { id: 1017, types: ["Grass"] },
  urshifu: { id: 892, types: ["Fighting", "Dark"] },
  tornadus: { id: 641, types: ["Flying"] },
  amoonguss: { id: 591, types: ["Grass", "Poison"] },
  toxapex: { id: 748, types: ["Poison", "Water"] },
};

/**
 * Case/space-insensitive lookup by Pikalytics or display name. Mega forms
 * fall back to their base species — team preview shows base forms only
 * (Megas reveal in battle, per the brief), so base sprites are honest.
 */
export function getSpecies(name: string): SpeciesInfo | null {
  const key = name.trim().toLowerCase();
  const direct = LEXICON[key];
  if (direct) return direct;
  const baseForm = key.replace(/-mega(-[xy])?$/, "");
  return baseForm !== key ? (LEXICON[baseForm] ?? null) : null;
}
