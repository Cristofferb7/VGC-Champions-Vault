import { similarity } from "./fuzzy";

/**
 * Screenshot recognition v1 (clean, digital team-preview screenshots).
 *
 * Approach: Champions uses Open Team Sheets, so opponent names are visible
 * as TEXT on the preview — we OCR the frame (tesseract.js, lazy-loaded)
 * and fuzzy-correct every line against the format's species list, instead
 * of maintaining per-device pixel geometry. The manual picker doubles as
 * the correction UI for FAIR/POOR slots, per the brief.
 *
 * v2 (photo-of-TV rectification, template co-signals) stays deferred.
 */

export type RecognitionConfidence = "good" | "fair" | "poor";

export interface RecognizedSlot {
  /** Corrected species name (canonical, from the candidate list). */
  name: string;
  /** Raw OCR text the match came from. */
  ocrText: string;
  /** 0–1 similarity between OCR text and the matched name. */
  score: number;
  confidence: RecognitionConfidence;
  /** Next-best candidates for one-tap correction. */
  alternates: string[];
}

function confidenceFor(score: number): RecognitionConfidence {
  if (score >= 0.85) return "good";
  if (score >= 0.65) return "fair";
  return "poor";
}

/** Rank candidates against one OCR token. */
function matchToken(
  token: string,
  candidates: string[],
): { name: string; score: number; alternates: string[] } | null {
  const scored = candidates
    .map((name) => ({ name, score: similarity(token, name) }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  // Below 0.5 the "match" is noise (UI chrome, damage numbers, etc.).
  if (!best || best.score < 0.5) return null;
  return {
    name: best.name,
    score: best.score,
    alternates: scored.slice(1, 4).map((entry) => entry.name),
  };
}

async function imageToCanvas(file: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  // Upscale small screenshots — OCR accuracy drops below ~1000px wide.
  const scale = Math.max(1, Math.min(2, 1600 / bitmap.width));
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

/**
 * OCR a team-preview screenshot and return up to 6 recognized species,
 * best-first. `candidates` is the format species list (snapshot + team
 * names) — recognition never invents a name outside it.
 */
export async function recognizeTeamPreview(
  file: Blob,
  candidates: string[],
): Promise<RecognizedSlot[]> {
  const canvas = await imageToCanvas(file);

  // Lazy-load tesseract.js; worker/core/language assets are self-hosted
  // under /tesseract (no CDN dependency) and runtime-cached by the SW so
  // OCR keeps working offline after first use.
  const { createWorker, OEM } = await import("tesseract.js");
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/core",
    langPath: "/tesseract/lang",
  });
  try {
    const { data } = await worker.recognize(canvas);
    const lines = data.text
      .split("\n")
      .map((line) => line.replace(/[^\p{L}\d'’. :-]/gu, " ").trim())
      .filter((line) => line.length >= 3);

    const slots = new Map<string, RecognizedSlot>();
    for (const line of lines) {
      // A line may hold extra tokens ("Lv. 50 Garchomp") — try the whole
      // line and each word window of 1–2 words.
      const words = line.split(/\s+/);
      const tokens = new Set<string>([line]);
      for (let i = 0; i < words.length; i++) {
        tokens.add(words[i]);
        if (i + 1 < words.length) tokens.add(`${words[i]} ${words[i + 1]}`);
      }

      for (const token of tokens) {
        const match = matchToken(token, candidates);
        if (!match) continue;
        const existing = slots.get(match.name);
        if (existing && existing.score >= match.score) continue;
        slots.set(match.name, {
          name: match.name,
          ocrText: token,
          score: match.score,
          confidence: confidenceFor(match.score),
          alternates: match.alternates,
        });
      }
    }

    return [...slots.values()].sort((a, b) => b.score - a.score).slice(0, 6);
  } finally {
    await worker.terminate();
  }
}
