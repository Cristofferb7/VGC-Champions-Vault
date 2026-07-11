import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MetaDataProvider, useMetaData } from "../hooks/useMetaData";
import { RostersProvider } from "../hooks/useRosters";
import { useNavigation } from "../hooks/useNavigation";
import { useStoragePersist } from "../hooks/useStoragePersist";
import {
  clearShareTargetFlag,
  launchedViaShareTarget,
} from "../lib/shareTarget";
import type { TabId } from "../types";
import { AppHeader } from "./components/layout/AppHeader";
import { BottomNav } from "./components/layout/BottomNav";
import { CameraFab } from "./components/layout/CameraFab";
import { AnalyzerScreen } from "./screens/AnalyzerScreen";
import { DatabaseScreen } from "./screens/DatabaseScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { TeamsScreen } from "./screens/TeamsScreen";

const SCREENS: Record<
  TabId,
  { title: string; showSyncPill?: boolean; Screen: () => JSX.Element }
> = {
  home: { title: "VGC Champions Vault", showSyncPill: true, Screen: HomeScreen },
  database: { title: "Meta Database", Screen: DatabaseScreen },
  teams: { title: "Teams Registry", Screen: TeamsScreen },
  // AnalyzerScreen is rendered directly in AppShell (needs captureSignal).
  tools: { title: "Matchup Analyzer", Screen: () => <AnalyzerScreen /> },
};

function AppShell() {
  const { activeTab, direction, navigate, openAnalyzer, captureSignal } =
    useNavigation();
  const { status, refresh } = useMetaData();
  const persisted = useStoragePersist();
  const { title, showSyncPill, Screen } = SCREENS[activeTab];

  // Launched from the OS share sheet: jump straight to the Analyzer with
  // the picker open — the recognition hook consumes the parked screenshot.
  useEffect(() => {
    if (launchedViaShareTarget()) {
      clearShareTargetFlag();
      openAnalyzer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto w-full max-w-[430px] min-h-screen bg-night text-ink font-sans pb-[168px] flex flex-col overflow-x-hidden relative sm:border-x sm:border-white/10 sm:shadow-[0_0_80px_rgba(56,189,248,0.07)]">
      <AppHeader
        title={title}
        syncStatus={showSyncPill ? status : undefined}
        persistedStorage={persisted}
        showAlert={status === "stale" || status === "error"}
        onAlertTap={refresh}
      />
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={activeTab}
          custom={direction}
          variants={{
            enter: (dir: number) => ({ opacity: 0, x: 32 * dir }),
            center: { opacity: 1, x: 0, pointerEvents: "auto" },
            // pointerEvents none immediately: taps mid-transition must not
            // land on the outgoing screen (QA round 2).
            exit: (dir: number) => ({
              opacity: 0,
              x: -32 * dir,
              pointerEvents: "none",
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", damping: 30, stiffness: 380 }}
          className="flex-1 flex flex-col"
        >
          {activeTab === "tools" ? (
            <AnalyzerScreen captureSignal={captureSignal} />
          ) : (
            <Screen />
          )}
        </motion.div>
      </AnimatePresence>
      <CameraFab onClick={openAnalyzer} />
      <BottomNav activeTab={activeTab} onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <MetaDataProvider>
      <RostersProvider>
        <AppShell />
      </RostersProvider>
    </MetaDataProvider>
  );
}
