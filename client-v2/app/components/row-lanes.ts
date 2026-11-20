import type { LaneView, StepGridView } from 'client-v2/audio/runner';
import type { RowLanes } from 'client-v2/services/view';
import type AudioService from 'client-v2/services/audio';

/** One sequence of a track with the lanes that stand under its grid. */
export interface SequenceLanes {
  grid: StepGridView;
  lanes: LaneView[];
}

/** Everything a track's row can show per sequence: each step grid and its per-step controls, in script order. */
export function sequenceLanes(
  audio: AudioService,
  scopeId: string,
): SequenceLanes[] {
  return audio.stepGrids(scopeId).map((grid) => ({
    grid,
    lanes: audio.lanes(scopeId, grid.name),
  }));
}

/** The same, as keys: the grids first, then the lanes. */
export function rowLanes(sequences: readonly SequenceLanes[]): RowLanes {
  return {
    grids: sequences.map((sequence) => sequence.grid.key),
    lanes: sequences.flatMap((sequence) =>
      sequence.lanes.map((lane) => lane.key),
    ),
  };
}
