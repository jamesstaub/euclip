import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import SignalChainPane from 'client-v2/components/signal-chain-pane';
import PopupMenu, { type MenuItem } from 'client-v2/components/ui/popup-menu';
import type { StepGridView } from 'client-v2/audio/runner';
import {
  rowLanes,
  sequenceLanes,
  type SequenceLanes,
} from 'client-v2/components/row-lanes';
import { stepGridWidget } from 'client-v2/controls/registry';
import type { TrackDocument } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';
import type { RowLanes } from 'client-v2/services/view';

function not(value: boolean): boolean {
  return !value;
}

function more(grids: readonly StepGridView[]): boolean {
  return grids.length > 1;
}

const Grid = stepGridWidget().component;

/** What on a row does a job of its own: a click on (or in) any of these is not a click on the row. */
const OWN =
  'button, input, select, textarea, a, label, [role], [tabindex], .step-grid';

/**
 * A click on a row's background (its padding, the gaps, the space beside the grid) selects its track.
 * The row is not a button and holds none of its controls inside one: the number stays the control
 * that selects for the keyboard and a screen reader, and this only widens what a pointer can hit.
 * It listens to `click`, so a finger that scrolls the list from the background selects nothing.
 */
export function selectFromBackground(
  onSelect: (id: string) => void,
  id: string,
  event: Event,
): void {
  const row = event.currentTarget as Element;
  const own = (event.target as Element).closest(OWN);
  if (own && own !== row && row.contains(own)) return;
  onSelect(id);
}

export interface TrackRowSignature {
  Element: HTMLElement;
  Args: {
    track: TrackDocument;
    /** its place in the list, counted from 1 */
    order: number;
    /** the selected track is drawn in yellow, and the footer shows its detail and script */
    selected: boolean;
    onSelect: (id: string) => void;
    onRemove: (track: TrackDocument) => void;
    onDuplicate: (track: TrackDocument) => void;
  };
}

/**
 * One track, always a compact row: its number (which selects it), name, a step grid for each step grid
 * its script declares (in the order declared), and its menu. A track that declares none says so quietly.
 * A track whose script has an error is marked.
 */
export default class TrackRow extends Component<TrackRowSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  @tracked menuOpen = false;

  /** Whether the row shows the signal chain where the step grid is (one choice for every row: the project bar's). */
  get showChain(): boolean {
    return this.view.rowsView === 'chain';
  }

  get stepGrids(): StepGridView[] {
    return this.audio.stepGrids(this.args.track.id);
  }

  get error(): string | undefined {
    return this.audio.error(this.args.track.id)?.message;
  }

  /** Everything the row can show: each sequence's grid and its per-step lanes. */
  get sequences(): SequenceLanes[] {
    return sequenceLanes(this.audio, this.args.track.id);
  }

  get rowKeys(): RowLanes {
    return rowLanes(this.sequences);
  }

  /** The keys of the grids and lanes that are checked in the Lanes menu. */
  get shown(): Set<string> {
    return this.view.shownLanes(this.args.track.id, this.rowKeys);
  }

  /** What the row draws, in the script's order: a grid (if checked) with its checked lanes under it. */
  get stacks(): {
    grid: StepGridView;
    showGrid: boolean;
    laneKeys: string[];
  }[] {
    const shown = this.shown;
    return this.sequences
      .map(({ grid, lanes }) => ({
        grid,
        showGrid: shown.has(grid.key),
        laneKeys: lanes.filter((lane) => shown.has(lane.key)).map((l) => l.key),
      }))
      .filter((stack) => stack.showGrid || stack.laneKeys.length > 0);
  }

  get total(): number {
    return this.rowKeys.grids.length + this.rowKeys.lanes.length;
  }

  /** The Lanes button is there when the track has more than one thing it could show. */
  get hasLanesMenu(): boolean {
    return this.total > 1;
  }

  get laneText(): string {
    const { grids, lanes } = this.rowKeys;
    const shown = this.shown;
    const count = [...grids, ...lanes].filter((key) => shown.has(key)).length;
    return `Lanes ${count}/${this.total}`;
  }

  get laneItems(): MenuItem[] {
    const shown = this.shown;
    const row = this.rowKeys;
    const many = this.sequences.length > 1;
    const toggle = (key: string, label: string, id: string): MenuItem => ({
      id,
      label,
      toggle: true,
      checked: shown.has(key),
      onSelect: () =>
        this.view.setLane(this.args.track.id, row, key, !shown.has(key)),
    });
    return this.sequences.flatMap(({ grid, lanes }, index) => [
      ...(many
        ? [
            {
              id: `heading:${grid.key}`,
              label: grid.name,
              heading: true,
              separated: index > 0,
            } satisfies MenuItem,
          ]
        : []),
      toggle(grid.key, grid.name, `grid:${grid.key}`),
      ...lanes.map((lane) => toggle(lane.key, lane.label, `lane:${lane.key}`)),
    ]);
  }

  @tracked laneMenuOpen = false;

  setLaneMenuOpen = (open: boolean): void => {
    this.laneMenuOpen = open;
  };

  openGenerators = (): void => {
    this.args.onSelect(this.args.track.id);
    this.view.scriptOpen = false;
    this.view.footerOpen = true;
    this.view.setFooterPane('sequence');
  };

  /** What the track is called: its name, else its sound's or source's (`audio.trackName`). */
  get name(): string {
    return this.audio.trackName(this.args.track, this.args.order);
  }

  get menuItems(): MenuItem[] {
    return [
      {
        // (a track row's grid is steps only: the generators are with the grid in the sequence pane)
        label: 'Pattern generators',
        disabled: this.stepGrids.length === 0,
        onSelect: this.openGenerators,
      },
      {
        label: 'Duplicate',
        onSelect: () => this.args.onDuplicate(this.args.track),
      },
      {
        label: 'Remove',
        separated: true,
        onSelect: () => this.args.onRemove(this.args.track),
      },
    ];
  }

  setMenuOpen = (open: boolean): void => {
    this.menuOpen = open;
  };

  /** (a press on the background that closes the row's open menu has done its job: it selects nothing) */
  #menuWasOpen = false;
  notePress = (): void => {
    this.#menuWasOpen = this.menuOpen;
  };

  onRowClick = (event: Event): void => {
    if (this.#menuWasOpen) {
      this.#menuWasOpen = false;
      return;
    }
    selectFromBackground(this.args.onSelect, this.args.track.id, event);
  };

  <template>
    <article
      class="track {{if @selected 'track--active'}}"
      aria-label="Track {{@order}}, {{this.name}}"
      aria-current={{if @selected "true"}}
      data-error={{if this.error "true"}}
      data-test-track={{@order}}
      data-track-id={{@track.id}}
      ...attributes
    >
      {{! template-lint-disable no-invalid-interactive no-pointer-down-event-binding }}
      {{! (the row's background selects, for a pointer; the number button is the control that does) }}
      <div
        class="track__row"
        data-test-track-row
        {{on "pointerdown" this.notePress capture=true}}
        {{on "click" this.onRowClick}}
      >
        <button
          type="button"
          class="track__order"
          aria-label="Select track {{@order}}"
          aria-pressed={{if @selected "true" "false"}}
          data-test-track-select
          {{on "click" (fn @onSelect @track.id)}}
        >{{@order}}</button>

        <div class="track__source">
          <button
            type="button"
            class="btn btn--quiet track__source-btn"
            aria-label="Select {{this.name}}"
            data-test-track-name
            {{on "click" (fn @onSelect @track.id)}}
          >
            <span class="truncate">{{this.name}}</span>
          </button>
          {{#if this.error}}
            <span
              class="track__alert"
              role="img"
              aria-label="This track's script has an error"
              title={{this.error}}
              data-test-track-error
            >!</span>
          {{/if}}
        </div>

        <div class="track__sequence">
          {{#if this.showChain}}
            <SignalChainPane
              @scopeId={{@track.id}}
              @label="Track {{@order}}"
              @onSelectTrack={{@onSelect}}
              @selected={{@selected}}
            />
          {{else}}
            {{#each this.stacks key="grid.key" as |stack|}}
              <div class="track__grid">
                {{#if (more this.stepGrids)}}
                  <span
                    class="track__grid-name truncate"
                  >{{stack.grid.label}}</span>
                {{/if}}
                <Grid
                  @scopeId={{@track.id}}
                  @control={{stack.grid}}
                  @lanes={{true}}
                  @laneKeys={{stack.laneKeys}}
                  @hideSteps={{not stack.showGrid}}
                />
              </div>
            {{else}}
              {{#if this.stepGrids.length}}
                <p class="track__no-grid" data-test-no-lanes>No lanes shown</p>
              {{else}}
                <p class="track__no-grid" data-test-no-step-grid>No step grid
                  declared</p>
              {{/if}}
            {{/each}}
          {{/if}}
        </div>

        {{#if this.hasLanesMenu}}
          {{#unless this.showChain}}
            <PopupMenu
              class="track__lanes"
              @label="Track {{@order}} lanes"
              @text={{this.laneText}}
              @items={{this.laneItems}}
              @up={{true}}
              @open={{this.laneMenuOpen}}
              @onOpenChange={{this.setLaneMenuOpen}}
            />
          {{/unless}}
        {{/if}}
        <PopupMenu
          class="track__actions"
          @label="Track {{@order}} menu"
          @items={{this.menuItems}}
          @open={{this.menuOpen}}
          @onOpenChange={{this.setMenuOpen}}
        />
      </div>
    </article>
  </template>
}
