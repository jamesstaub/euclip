import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import LaneButton from 'client-v2/components/lane-button';
import { stepGridWidget } from 'client-v2/controls/registry';
import onEscape from 'client-v2/modifiers/on-escape';
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
 * speed, start, end, loop points, loop or reverse, or of any other control of the source, opened from the
 * control's lane button. It is laid over the waveform's picture (a synth's keyboard), in its place, so the
 * values under it stay in reach: a value typed there moves the bars of the steps that follow it. Its own
 * lane button (pressed), Hide lane in its menu, or Escape close it; another control's button replaces it.
 */
export default class SourceLane extends Component<SourceLaneSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  /** The lane open over this source, among the lanes of the script's grids (a waveform's own controls are hidden ones). */
  get lane(): LaneView | undefined {
    const key = this.view.sourceLane(this.args.scopeId);
    if (key === null) return undefined;
    for (const grid of this.audio.stepGrids(this.args.scopeId)) {
      const lane = this.audio
        .lanes(this.args.scopeId, grid.name)
        .find((candidate) => candidate.key === key);
      if (lane && lane.control.source === this.args.nodeId) return lane;
    }
    return undefined;
  }

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
          <LaneButton
            class="source-lane__close"
            @control={{this.control}}
            @pressed={{true}}
            @onToggle={{this.close}}
          />
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
