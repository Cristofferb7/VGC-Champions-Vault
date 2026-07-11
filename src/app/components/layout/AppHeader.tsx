import { Bell, CloudLightning, CloudOff, RefreshCw } from "lucide-react";
import type { SyncStatus } from "../../../types";

const PILL_STATES: Record<
  SyncStatus,
  { label: string; tone: string; Icon: typeof CloudLightning; spin?: boolean }
> = {
  loading: { label: "Loading", tone: "text-muted bg-white/5 border-white/10", Icon: RefreshCw, spin: true },
  syncing: { label: "Syncing", tone: "text-aura bg-aura/10 border-aura/20", Icon: RefreshCw, spin: true },
  fresh: { label: "Data Ready", tone: "text-win bg-win/10 border-win/20", Icon: CloudLightning },
  stale: { label: "Stale Data", tone: "text-warn bg-warn/10 border-warn/20", Icon: CloudOff },
  error: { label: "Offline", tone: "text-loss bg-loss/10 border-loss/20", Icon: CloudOff },
};

interface AppHeaderProps {
  title: string;
  /** Real cache state drives the pill (Home screen only). */
  syncStatus?: SyncStatus;
  /** Bell dot = "your data needs attention", not decoration. */
  showAlert: boolean;
  /** Tapping the bell while alerted retries the sync. */
  onAlertTap: () => void;
}

export function AppHeader({
  title,
  syncStatus,
  showAlert,
  onAlertTap,
}: AppHeaderProps) {
  const pill = syncStatus ? PILL_STATES[syncStatus] : null;

  return (
    <header className="sticky top-0 z-50 bg-night/95 backdrop-blur-md border-b border-panel h-14 px-4 flex items-center justify-between">
      {pill ? (
        <div
          className={`flex items-center space-x-1 px-2 py-1 rounded-full border z-10 ${pill.tone}`}
        >
          <pill.Icon size={12} className={pill.spin ? "animate-spin" : ""} />
          <span className="text-[10px] font-bold tracking-wider uppercase mt-[1px]">
            {pill.label}
          </span>
        </div>
      ) : (
        <div className="w-6" />
      )}

      <div
        className={`absolute left-0 right-0 flex justify-center pointer-events-none ${
          pill ? "px-28" : "px-10"
        }`}
      >
        <h1 className="text-[13px] font-bold tracking-widest uppercase text-ink truncate">
          {title}
        </h1>
      </div>

      <button
        onClick={showAlert ? onAlertTap : undefined}
        aria-label={
          showAlert ? "Meta data needs a re-sync — tap to retry" : "Notifications"
        }
        title={showAlert ? "Data stale — tap to re-sync" : undefined}
        className={`relative z-10 w-6 flex justify-end ${
          showAlert ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <Bell size={20} className="text-muted" />
        {showAlert && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-loss rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-night" />
        )}
      </button>
    </header>
  );
}
