import { useActiveTeam } from "../../hooks/useActiveTeam";
import { useRosters } from "../../hooks/useRosters";
import { useTeamShare } from "../../hooks/useTeamShare";
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
  const share = useTeamShare(team, record, formatLabel);

  return (
    <main className="flex-1 p-4 space-y-8 overflow-y-auto">
      <ActiveTeamCard
        team={team}
        record={record}
        formatLabel={formatLabel}
        weaknesses={weaknesses}
        expandedWeakness={expandedWeakness}
        onToggleWeakness={toggleWeakness}
        shareState={share.state}
        onShareImage={share.shareImage}
        onCopyPaste={() => share.copyPaste()}
      />
      <RosterCarousel
        rosters={rosters}
        selectedId={selectedId}
        onSelect={selectRoster}
        onAdd={addRoster}
        onDuplicate={duplicateRoster}
        onDelete={removeRoster}
        onCopyPaste={(id) => {
          const roster = rosters.find((entry) => entry.id === id);
          if (roster) void share.copyPaste(roster.species);
        }}
      />
    </main>
  );
}
