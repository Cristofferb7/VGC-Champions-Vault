import { TYPE_COLORS } from "../data/typeColors";
import { getSpriteUrl } from "./sprites";
import type { Pokemon } from "../types";

/**
 * Renders a shareable team-sheet PNG (Discord-sized 800×450) on a canvas:
 * HUD-dark background, 3×2 sprite grid, names + type chips, attribution.
 */

function loadSprite(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // raw.githubusercontent sends ACAO: *
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function renderTeamSheet(
  team: Pokemon[],
  record: { wins: number; losses: number },
  formatLabel: string,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext("2d")!;

  // Background + frame
  ctx.fillStyle = "#0B0E14";
  ctx.fillRect(0, 0, 800, 450);
  const glow = ctx.createLinearGradient(0, 0, 800, 450);
  glow.addColorStop(0, "rgba(56,189,248,0.12)");
  glow.addColorStop(1, "rgba(139,92,246,0.12)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 800, 450);
  ctx.strokeStyle = "rgba(56,189,248,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, 788, 438);

  // Header
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("VGC CHAMPIONS VAULT", 28, 44);
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillStyle = "#8B949E";
  ctx.fillText(formatLabel.toUpperCase(), 28, 66);
  ctx.fillStyle = "#10B981";
  ctx.fillText(`W: ${record.wins}`, 690, 44);
  ctx.fillStyle = "#EF4444";
  ctx.fillText(`L: ${record.losses}`, 743, 44);

  // 3×2 grid
  const sprites = await Promise.all(
    team.map((poke) => loadSprite(getSpriteUrl(poke.id))),
  );
  team.forEach((poke, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 145 + col * 255;
    const cy = 140 + row * 150;

    ctx.fillStyle = "#1A202C";
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fill();

    const sprite = sprites[i];
    if (sprite) {
      ctx.imageSmoothingEnabled = false; // keep pixel art crisp
      ctx.drawImage(sprite, cx - 44, cy - 44, 88, 88);
      ctx.imageSmoothingEnabled = true;
    } else {
      ctx.fillStyle = "#8B949E";
      ctx.font = "bold 20px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(poke.name.slice(0, 3), cx, cy + 7);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillText(poke.name, cx, cy + 64);

    // Type chips
    const chipWidth = 52;
    const totalWidth = poke.types.length * chipWidth + (poke.types.length - 1) * 6;
    poke.types.forEach((type, t) => {
      const x = cx - totalWidth / 2 + t * (chipWidth + 6);
      ctx.fillStyle = `${TYPE_COLORS[type]}CC`;
      ctx.beginPath();
      ctx.roundRect(x, cy + 72, chipWidth, 16, 4);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 9px system-ui, sans-serif";
      ctx.fillText(type.toUpperCase(), x + chipWidth / 2, cy + 83);
    });
    ctx.textAlign = "left";
  });

  // Attribution footer
  ctx.fillStyle = "#8B949E";
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillText(
    "Data: Pikalytics · unofficial; not affiliated with Nintendo, Creatures, GAME FREAK, or The Pokémon Company",
    28,
    432,
  );

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    ),
  );
}

/** Showdown/pokepaste-compatible paste (species-only sets). */
export function toShowdownPaste(species: string[]): string {
  return species.map((name) => name).join("\n\n") + "\n";
}
