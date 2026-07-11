import { useActiveTeam } from "../../hooks/useActiveTeam";
import { useMetaData } from "../../hooks/useMetaData";
import { useRosters } from "../../hooks/useRosters";
import { useTeamShare } from "../../hooks/useTeamShare";
import { ActiveTeamCard } from "../components/home/ActiveTeamCard";
import { MetaPulse } from "../components/home/MetaPulse";
import { RosterCarousel } from "../components/home/RosterCarousel";

interface HomeScreenProps {
  onOpenDetail: (name: string) => void;
  onOpenArchetypes: () => void;
}

export function HomeScreen({ onOpenDetail, onOpenArchetypes }: HomeScreenProps) {
  const { snapshot } = useMetaData();
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
    // flex-col so Meta Pulse (last child, !mt-auto) absorbs tall-viewport
    // slack — the gap becomes data, not dead space (sprint 9 §3).
    <main className="flex-1 p-4 space-y-8 overflow-y-auto flex flex-col">
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
      <MetaPulse
        snapshot={snapshot}
        onOpenDetail={onOpenDetail}
        onOpenArchetypes={onOpenArchetypes}
      />
    </main>
  );
}
