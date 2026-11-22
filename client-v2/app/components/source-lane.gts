import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { stepGridWidget } from 'client-v2/controls/registry';
import onEscape from 'client-v2/modifiers/on-escape';
import selectOptions, {
  type SelectOption,
} from 'client-v2/modifiers/select-options';
import type {
  ControlView,
  LaneView,
  StepGridView,
} from 'client-v2/audio/runner';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';

const Grid = stepGridWidget().component;

export interface SourceLaneSignature {
  Element: HTMLDivElement;
  Args: {
    scopeId: string;
    /** the source node whose editor it is laid over: only its own controls' lanes are shown here */
    nodeId: string;
  };
}

/**
 * The one lane shown over a source's editor (`ViewService.sourceLane`): the multislider of a sampler's
 * speed, start, end, loop points, loop or reverse, or of any other control of the source. It is laid over
 * the waveform's picture (a synth's keyboard), in its place, so the values under it stay in reach: a value
 * typed there moves the bars of the steps that follow it. Its name is a menu of the source's lanes, to show
 * another; × or Escape close it, and the picture is back.
 */
export default class SourceLane extends Component<SourceLaneSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  /**
   * This source's lanes, among the lanes of the script's grids (a waveform's own controls are hidden
   * ones, so they are found here and not among the source's control rows).
   */
  get lanes(): LaneView[] {
    const seen = new Set<string>();
    const lanes: LaneView[] = [];
    for (const grid of this.audio.stepGrids(this.args.scopeId)) {
      for (const lane of this.audio.lanes(this.args.scopeId, grid.name)) {
        if (lane.control.source !== this.args.nodeId || seen.has(lane.key)) {
          continue;
        }
        seen.add(lane.key);
        lanes.push(lane);
      }
    }
    return lanes;
  }

  /** The lane open over this source. */
  get lane(): LaneView | undefined {
    const key = this.view.sourceLane(this.args.scopeId);
    return key === null
      ? undefined
      : this.lanes.find((candidate) => candidate.key === key);
  }

  /** The menu of the source's lanes: each by its control's name, a dot where steps hold values. */
  get choices(): SelectOption[] {
    return this.lanes.map((lane) => ({
      value: lane.key,
      label: `${lane.label}${lane.active ? ' •' : ''}`,
    }));
  }

  choose = (event: Event): void => {
    const key = (event.target as HTMLSelectElement).value;
    if (key) this.view.setSourceLane(this.args.scopeId, key);
  };

  get control(): ControlView | undefined {
    return this.lane?.control;
  }

  get grid(): StepGridView | undefined {
    const lane = this.control?.lane;
    return lane
      ? this.audio
          .stepGrids(this.args.scopeId)
          .find((grid) => grid.name === lane.sequence)
      : undefined;
  }

  get keys(): string[] {
    return this.control ? [this.control.key] : [];
  }

  /** A press, a drag or a wheel in it is its own, not the picture's under it (no handle moved, no zoom). */
  keep = (event: Event): void => {
    event.stopPropagation();
  };

  close = (): void => {
    this.view.setSourceLane(this.args.scopeId, null);
  };

  <template>
    {{#if this.control}}
      {{#if this.grid}}
        <div
          class="source-lane"
          role="group"
          aria-label="{{this.control.label}} steps"
          data-test-source-lane={{this.control.key}}
          {{onEscape this.close}}
          {{! template-lint-disable no-pointer-down-event-binding no-invalid-interactive }}
          {{on "pointerdown" this.keep}}
          {{on "mousedown" this.keep}}
          {{on "wheel" this.keep}}
          ...attributes
        >
          <div class="source-lane__bar">
            <label class="source-lane__choose">
              <span class="sr-only">Steps of</span>
              <select
                class="select source-lane__select"
                data-test-source-lane-choose
                {{on "change" this.choose}}
                {{selectOptions this.choices this.control.key}}
              ></select>
            </label>
            <button
              type="button"
              class="btn btn--s btn--ghost source-lane__close"
              aria-label="Close {{this.control.label}} steps"
              title="Close (Esc)"
              data-test-source-lane-close
              {{on "click" this.close}}
            >×</button>
          </div>
          <Grid
            class="source-lane__grid"
            @scopeId={{@scopeId}}
            @control={{this.grid}}
            @laneKeys={{this.keys}}
            @hideSteps={{true}}
            @onHideLane={{this.close}}
          />
        </div>
      {{/if}}
    {{/if}}
  </template>
}
