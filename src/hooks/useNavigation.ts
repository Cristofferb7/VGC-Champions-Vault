import { useCallback, useState } from "react";
import type { TabId } from "../types";

const TAB_ORDER: TabId[] = ["home", "database", "teams", "tools"];

/** Owns which bottom-nav tab is active, plus the FAB → analyzer intent. */
export function useNavigation(initialTab: TabId = "home") {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  /** +1 = moving right in the tab bar, -1 = left; drives slide direction. */
  const [direction, setDirection] = useState(1);
  /** Increments each FAB press; the analyzer opens its picker on change. */
  const [captureSignal, setCaptureSignal] = useState(0);

  const goTo = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) return;
      setDirection(
        TAB_ORDER.indexOf(tab) > TAB_ORDER.indexOf(activeTab) ? 1 : -1,
      );
      setActiveTab(tab);
    },
    [activeTab],
  );

  const navigate = goTo;

  /** Camera FAB: jump to the analyzer and open opponent entry. */
  const openAnalyzer = useCallback(() => {
    goTo("tools");
    setCaptureSignal((n) => n + 1);
  }, [goTo]);

  /** Meta Pulse row tap → Database with this species' sheet open. */
  const [detailRequest, setDetailRequest] = useState<{
    name: string;
    seq: number;
  } | null>(null);
  const openDatabaseDetail = useCallback(
    (name: string) => {
      goTo("database");
      setDetailRequest((prev) => ({ name, seq: (prev?.seq ?? 0) + 1 }));
    },
    [goTo],
  );

  /** Meta Pulse archetype tap → Teams with the Archetypes segment active. */
  const [archetypesSignal, setArchetypesSignal] = useState(0);
  const openArchetypes = useCallback(() => {
    goTo("teams");
    setArchetypesSignal((n) => n + 1);
  }, [goTo]);

  return {
    activeTab,
    direction,
    navigate,
    openAnalyzer,
    captureSignal,
    detailRequest,
    openDatabaseDetail,
    archetypesSignal,
    openArchetypes,
  };
}
