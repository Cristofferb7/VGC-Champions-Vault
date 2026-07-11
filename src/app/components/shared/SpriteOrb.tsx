import { getSpriteUrl } from "../../../lib/sprites";

interface SpriteOrbProps {
  spriteId: number;
  alt?: string;
  /** Diameter preset: hero card (lg) vs stacked list rows (sm). */
  size?: "sm" | "lg";
}

/** Circular sprite well used across the hero card, registry, and grid. */
export function SpriteOrb({ spriteId, alt = "Pokemon", size = "lg" }: SpriteOrbProps) {
  const isLarge = size === "lg";
  return (
    <div
      className={`${
        isLarge ? "w-16 h-16" : "w-10 h-10"
      } bg-night rounded-full border border-white/5 flex items-center justify-center relative overflow-hidden shadow-inner`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-full pointer-events-none" />
      <img
        src={getSpriteUrl(spriteId)}
        alt={alt}
        className={`${
          isLarge ? "w-16 h-16 scale-125" : "w-10 h-10 scale-[1.35]"
        } object-contain z-10 drop-shadow-lg`}
      />
    </div>
  );
}
