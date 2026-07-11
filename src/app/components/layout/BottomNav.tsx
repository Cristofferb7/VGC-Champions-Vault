import { Database, Home, Users, Wrench } from "lucide-react";
import type { TabId } from "../../../types";

const TABS: Array<{ id: TabId; label: string; Icon: typeof Home }> = [
  { id: "home", label: "Home", Icon: Home },
  { id: "database", label: "Database", Icon: Database },
  { id: "teams", label: "Teams", Icon: Users },
  { id: "tools", label: "Tools", Icon: Wrench },
];

interface BottomNavProps {
  activeTab: TabId;
  onNavigate: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  return (
    // z-60: stays tappable above sheet backdrops (z-50) — navigating
    // while a sheet is open dismisses it in the same gesture.
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[72px] bg-night/95 backdrop-blur-lg border-t border-panel z-[60] flex items-center justify-around px-2 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${
              isActive ? "text-aura" : "text-muted hover:text-ink"
            }`}
          >
            {isActive && (
              <span className="absolute top-0 w-6 h-[2px] bg-aura rounded-b-md shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            )}
            <Icon size={22} />
            <span className="text-[10px] font-semibold tracking-wide">
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
