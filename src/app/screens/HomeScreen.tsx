import { useActiveTeam } from "../../hooks/useActiveTeam";
import { useRosters } from "../../hooks/useRosters";
import { ActiveTeamCard } from "../components/home/ActiveTeamCard";
import { RosterCarousel } from "../components/home/RosterCarousel";

export function HomeScreen() {
  const {
    team,
    record,
    formatLabel,
    weaknesses,
    expandedWeakness,
    toggleWeakness,
  } = useActiveTeam();
  const {
    rosters,
    selectedId,
    selectRoster,
    addRoster,
    duplicateRoster,
    removeRoster,
  } = useRosters();

  return (
    <main className="flex-1 p-4 space-y-8 overflow-y-auto">
      <ActiveTeamCard
        team={team}
        record={record}
        formatLabel={formatLabel}
        weaknesses={weaknesses}
        expandedWeakness={expandedWeakness}
        onToggleWeakness={toggleWeakness}
      />
      <RosterCarousel
        rosters={rosters}
        selectedId={selectedId}
        onSelect={selectRoster}
        onAdd={addRoster}
        onDuplicate={duplicateRoster}
        onDelete={removeRoster}
      />
    </main>
  );
}
