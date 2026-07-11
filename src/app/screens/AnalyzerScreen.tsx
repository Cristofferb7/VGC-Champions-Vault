import { useEffect } from "react";
import { Camera, Pencil } from "lucide-react";
import { useMatchupAnalysis } from "../../hooks/useMatchupAnalysis";
import { useMetaData } from "../../hooks/useMetaData";
import { usePokemonDetail } from "../../hooks/usePokemonDetail";
import { MatchupDetail } from "../components/analyzer/MatchupDetail";
import { MatchupGrid } from "../components/analyzer/MatchupGrid";
import { OpponentPicker } from "../components/analyzer/OpponentPicker";
import { BottomSheet } from "../components/shared/BottomSheet";

interface AnalyzerScreenProps {
  /** Increments on each camera-FAB press → opens opponent entry. */
  captureSignal?: number;
}

export function AnalyzerScreen({ captureSignal = 0 }: AnalyzerScreenProps) {
  const {
    myTeam,
    opponentTeam,
    matrix,
    selectedMatchup,
    selectCell,
    clearSelection,
    toggleOpponent,
    clearOpponents,
    pickerOpen,
    openPicker,
    closePicker,
  } = useMatchupAnalysis();
  const { snapshot } = useMetaData();

  const myDetail = usePokemonDetail(selectedMatchup?.mine.name ?? null);
  const theirDetail = usePokemonDetail(selectedMatchup?.theirs.name ?? null);

  useEffect(() => {
    if (captureSignal > 0) openPicker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureSignal]);

  return (
    <main className="flex-1 p-4 space-y-5 overflow-y-auto">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold tracking-wider text-ink uppercase">
            Threat Matrix
          </h2>
          <button
            onClick={openPicker}
            className="flex items-center space-x-1.5 px-2 py-0.5 bg-night rounded-full text-[9px] font-bold text-aura uppercase tracking-wider border border-aura/30 hover:bg-aura/10 transition-colors"
          >
            <Pencil size={10} />
            <span>Edit Opponent ({opponentTeam.length}/6)</span>
          </button>
        </div>

        {opponentTeam.length === 0 ? (
          <div className="bg-panel rounded-xl border border-white/5 p-8 shadow-lg flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-night border border-white/5 flex items-center justify-center mb-3 shadow-inner">
              <Camera size={20} className="text-muted" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink mb-1">
              No opponent entered
            </p>
            <p className="text-[10px] text-muted tracking-wide mb-4">
              Enter the team you saw in preview to see threats at a glance.
            </p>
            <button
              onClick={openPicker}
              className="px-4 py-2 bg-aura/10 text-aura border border-aura/30 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-aura/20 transition-colors"
            >
              Enter Opponent Team
            </button>
          </div>
        ) : (
          <div className="bg-panel rounded-xl border border-white/5 p-3 shadow-lg">
            <MatchupGrid
              myTeam={myTeam}
              opponentTeam={opponentTeam}
              matrix={matrix}
              selected={
                selectedMatchup
                  ? { row: selectedMatchup.row, col: selectedMatchup.col }
                  : null
              }
              onSelectCell={selectCell}
            />

            {/* Legend */}
            <div className="flex items-center justify-center space-x-4 mt-3 pt-3 border-t border-white/5">
              {(
                [
                  ["Good", "bg-win"],
                  ["Neutral", "bg-muted"],
                  ["Bad", "bg-loss"],
                ] as const
              ).map(([label, dot]) => (
                <div key={label} className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {opponentTeam.length > 0 && (
          <p className="text-[10px] text-muted tracking-wide text-center mt-3">
            Tap any cell for damage estimates and speed tiers.
          </p>
        )}
      </section>

      <BottomSheet
        open={selectedMatchup !== null}
        onClose={clearSelection}
        title="Matchup Detail"
      >
        <MatchupDetail
          matchup={selectedMatchup}
          myDetail={myDetail.detail}
          theirDetail={theirDetail.detail}
          detailsLoading={myDetail.loading || theirDetail.loading}
        />
      </BottomSheet>

      <BottomSheet
        open={pickerOpen}
        onClose={closePicker}
        title="Opponent Team Entry"
      >
        <OpponentPicker
          entries={snapshot?.entries ?? []}
          opponentTeam={opponentTeam}
          onToggle={toggleOpponent}
          onClear={clearOpponents}
        />
      </BottomSheet>
    </main>
  );
}
