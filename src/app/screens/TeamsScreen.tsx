import { useLimitless } from "../../hooks/useLimitless";
import { useMetaData } from "../../hooks/useMetaData";
import { useMetaTeams, type RankedTopTeam } from "../../hooks/useMetaTeams";
import { useRosters } from "../../hooks/useRosters";
import { useTeamBuilder } from "../../hooks/useTeamBuilder";
import type { ArchetypeCluster } from "../../lib/limitless";
import { ArchetypeList } from "../components/teams/ArchetypeList";
import { FilterPills } from "../components/teams/FilterPills";
import { SegmentedControl } from "../components/teams/SegmentedControl";
import { TeamBuilder } from "../components/teams/TeamBuilder";
import { TopTeamList } from "../components/teams/TopTeamList";

export function TeamsScreen() {
  const { view, setView, sortBy, setSortBy, teams, status } = useMetaTeams();
  const { snapshot } = useMetaData();
  const builder = useTeamBuilder();
  const { addRoster } = useRosters();

  const limitless = useLimitless();

  const cloneTeam = (team: RankedTopTeam) => {
    builder.loadDraft(`${team.author.toUpperCase()} CLONE`, team.species);
    setView("builder");
  };

  const cloneCore = (cluster: ArchetypeCluster) => {
    builder.loadDraft(
      `${cluster.name.split(" + ")[0].toUpperCase()} CORE`,
      cluster.core.slice(0, 6).map((member) => member.name),
    );
    setView("builder");
  };

  return (
    <main className="flex-1 flex flex-col overflow-y-auto">
      <SegmentedControl view={view} onChange={setView} />

      {view === "top" ? (
        <>
          <FilterPills sortBy={sortBy} onChange={setSortBy} />
          <TopTeamList
            teams={teams}
            loading={status === "loading" || status === "syncing"}
            onClone={cloneTeam}
          />
        </>
      ) : view === "archetypes" ? (
        <ArchetypeList snapshot={limitless} onCloneCore={cloneCore} />
      ) : (
        <TeamBuilder
          builder={builder}
          entries={snapshot?.entries ?? []}
          onSave={(name, species) => addRoster(name, species)}
          onBrowseTopTeams={() => setView("top")}
        />
      )}
    </main>
  );
}
