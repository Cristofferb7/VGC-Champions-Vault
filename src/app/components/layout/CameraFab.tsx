import { Camera } from "lucide-react";

interface CameraFabProps {
  onClick: () => void;
}

/** Floating capture button — jumps straight into the matchup analyzer. */
export function CameraFab({ onClick }: CameraFabProps) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] pointer-events-none z-40">
      <button
        onClick={onClick}
        aria-label="Analyze a team preview"
        className="pointer-events-auto absolute bottom-[88px] right-4 w-14 h-14 bg-aura rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(56,189,248,0.5)] border-2 border-night hover:bg-[#0ea5e9] transition-all active:scale-95"
      >
        <Camera size={24} className="text-night fill-current" />
      </button>
    </div>
  );
}
