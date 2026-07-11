import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, ScanLine } from "lucide-react";
import type { RecognizedSlot } from "../../../lib/recognition";

const CONFIDENCE_STYLES = {
  good: "bg-win/10 text-win border-win/30",
  fair: "bg-warn/10 text-warn border-warn/30 animate-pulse",
  poor: "bg-loss/10 text-loss border-loss/30 animate-pulse",
} as const;

interface ScreenshotDropProps {
  status: "idle" | "processing" | "done" | "error";
  slots: RecognizedSlot[];
  onImage: (file: Blob) => void;
}

/** Drop / paste / pick a team-preview screenshot; shows per-slot confidence. */
export function ScreenshotDrop({ status, slots, onImage }: ScreenshotDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="mb-3">
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file?.type.startsWith("image/")) onImage(file);
        }}
        disabled={status === "processing"}
        className={`w-full flex items-center justify-center space-x-2 rounded-xl border-2 border-dashed px-3 py-3 transition-colors ${
          dragOver
            ? "border-aura bg-aura/10"
            : "border-white/10 bg-night hover:border-aura/40"
        }`}
      >
        {status === "processing" ? (
          <>
            <Loader2 size={14} className="text-aura animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-aura">
              Reading team sheet…
            </span>
          </>
        ) : (
          <>
            <ScanLine size={14} className="text-muted" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Drop / paste / pick a team-preview screenshot
            </span>
            <ImageIcon size={14} className="text-muted" />
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImage(file);
          e.target.value = "";
        }}
      />

      {status === "error" && (
        <p className="text-[9px] text-loss tracking-wide mt-1.5">
          Couldn't read any species from that image — try a clean, uncropped
          team-preview screenshot, or pick manually below.
        </p>
      )}

      {status === "done" && slots.length > 0 && (
        <div className="mt-2">
          <p className="text-[8px] font-bold uppercase tracking-widest text-muted mb-1.5">
            Recognized {slots.length}/6 · low-confidence chips pulse — verify
            them below
          </p>
          <div className="flex flex-wrap gap-1.5">
            {slots.map((slot) => (
              <span
                key={slot.name}
                title={`OCR read “${slot.ocrText}” (${Math.round(slot.score * 100)}%)${
                  slot.alternates.length
                    ? ` · alternates: ${slot.alternates.join(", ")}`
                    : ""
                }`}
                className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${CONFIDENCE_STYLES[slot.confidence]}`}
              >
                {slot.name} · {Math.round(slot.score * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
