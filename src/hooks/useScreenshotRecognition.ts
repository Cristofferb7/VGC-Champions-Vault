import { useCallback, useEffect, useState } from "react";
import {
  recognizeTeamPreview,
  type RecognizedSlot,
} from "../lib/recognition";

type RecognitionStatus = "idle" | "processing" | "done" | "error";

/**
 * Owns the screenshot → species pipeline: accepts a dropped/pasted/picked
 * image, runs OCR + fuzzy correction, and reports per-slot confidence.
 * While `listenForPaste` is true, a ⌘V image anywhere in the app lands here.
 */
export function useScreenshotRecognition(
  candidates: string[],
  onRecognized: (slots: RecognizedSlot[]) => void,
  listenForPaste: boolean,
) {
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [slots, setSlots] = useState<RecognizedSlot[]>([]);

  const processImage = useCallback(
    async (file: Blob) => {
      if (candidates.length === 0) return;
      setStatus("processing");
      try {
        const recognized = await recognizeTeamPreview(file, candidates);
        setSlots(recognized);
        setStatus(recognized.length > 0 ? "done" : "error");
        if (recognized.length > 0) onRecognized(recognized);
      } catch {
        setStatus("error");
      }
    },
    [candidates, onRecognized],
  );

  useEffect(() => {
    if (!listenForPaste) return;
    const onPaste = (event: ClipboardEvent) => {
      const item = [...(event.clipboardData?.items ?? [])].find((entry) =>
        entry.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (file) {
        event.preventDefault();
        void processImage(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [listenForPaste, processImage]);

  const reset = useCallback(() => {
    setStatus("idle");
    setSlots([]);
  }, []);

  return { status, slots, processImage, reset };
}
