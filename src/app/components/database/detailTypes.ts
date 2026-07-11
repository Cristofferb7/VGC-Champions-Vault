import type { PokemonDetail } from "../../../types";

/** Shape the detail sheet needs; matches usePokemonDetail's return. */
export interface DetailStateLike {
  detail: PokemonDetail | null;
  loading: boolean;
  error: boolean;
}
