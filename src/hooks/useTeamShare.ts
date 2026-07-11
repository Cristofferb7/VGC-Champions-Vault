import { useCallback, useState } from "react";
import { renderTeamSheet, toShowdownPaste } from "../lib/teamSheet";
import type { Pokemon } from "../types";

type ShareState = "idle" | "working" | "shared" | "copied" | "error";

/** Owns share/export for a team: PNG team sheet + Showdown paste. */
export function useTeamShare(
  team: Pokemon[],
  record: { wins: number; losses: number },
  formatLabel: string,
) {
  const [state, setState] = useState<ShareState>("idle");

  const flash = useCallback((next: ShareState) => {
    setState(next);
    window.setTimeout(() => setState("idle"), 1600);
  }, []);

  /** Render the team-sheet image; Web Share if available, else download. */
  const shareImage = useCallback(async () => {
    setState("working");
    try {
      const blob = await renderTeamSheet(team, record, formatLabel);
      const file = new File([blob], "team-sheet.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My VGC team" });
        flash("shared");
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "team-sheet.png";
        link.click();
        URL.revokeObjectURL(url);
        flash("shared");
      }
    } catch {
      flash("error");
    }
  }, [team, record, formatLabel, flash]);

  /** Copy a Showdown/pokepaste-compatible paste to the clipboard. */
  const copyPaste = useCallback(
    async (species?: string[]) => {
      try {
        await navigator.clipboard.writeText(
          toShowdownPaste(species ?? team.map((poke) => poke.name)),
        );
        flash("copied");
      } catch {
        flash("error");
      }
    },
    [team, flash],
  );

  return { state, shareImage, copyPaste };
}
