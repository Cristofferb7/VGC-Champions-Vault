import { AnimatePresence, motion } from "motion/react";
import { MetaDataProvider, useMetaData } from "../hooks/useMetaData";
import { useNavigation } from "../hooks/useNavigation";
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
  const { title, showSyncPill, Screen } = SCREENS[activeTab];

  return (
    <div className="mx-auto w-full max-w-[430px] min-h-screen bg-night text-ink font-sans pb-[168px] flex flex-col overflow-x-hidden relative sm:border-x sm:border-white/10 sm:shadow-[0_0_80px_rgba(56,189,248,0.07)]">
      <AppHeader
        title={title}
        syncStatus={showSyncPill ? status : undefined}
        showAlert={status === "stale" || status === "error"}
        onAlertTap={refresh}
      />
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={activeTab}
          custom={direction}
          variants={{
            enter: (dir: number) => ({ opacity: 0, x: 32 * dir }),
            center: { opacity: 1, x: 0 },
            exit: (dir: number) => ({ opacity: 0, x: -32 * dir }),
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
      <AppShell />
    </MetaDataProvider>
  );
}
