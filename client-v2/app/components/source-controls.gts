import Component from '@glimmer/component';
import { service } from '@ember/service';
import ControlRow from 'client-v2/components/control-row';
import { WAVEFORM_PARAMS } from 'client-v2/controls/declarations';
import type { ControlView } from 'client-v2/audio/runner';
import type AudioService from 'client-v2/services/audio';

export interface SourceControlsSignature {
  Element: HTMLElement;
  Args: {
    scopeId: string;
    /** the source node */
    nodeId: string;
    /** the sampler's editor already shows these (start, end, loop, reverse, speed): they are not listed twice */
    skipWaveform?: boolean;
    /** a control not to list (the keyboard's pitch, when the editor draws it itself) */
    skip?: string;
  };
}

/**
 * The controls the script declares for one source node, as the source tab lists them below that source's
 * editor: the app's standard rows, with their menus. The same declarations the processors tab lists
 * for every other node; a source's are here and not there.
 */
export default class SourceControls extends Component<SourceControlsSignature> {
  @service declare audio: AudioService;

  get controls(): ControlView[] {
    return this.audio
      .sourceControls(this.args.scopeId, this.args.nodeId)
      .filter(
        (control) =>
          control.key !== this.args.skip &&
          !(
            this.args.skipWaveform &&
            (WAVEFORM_PARAMS as readonly string[]).includes(paramOf(control))
          ),
      );
  }

  <template>
    {{#if this.controls.length}}
      <ul
        class="control-list source-controls"
        aria-label="Controls"
        data-test-source-controls={{@nodeId}}
        ...attributes
      >
        {{#each this.controls key="key" as |control|}}
          <ControlRow
            @scopeId={{@scopeId}}
            @control={{control}}
            @steps={{true}}
            @sourceLane={{true}}
          />
        {{/each}}
      </ul>
    {{/if}}
  </template>
}

/** The parameter a control is for: the last part of its key (`#s › speed`). */
function paramOf(control: ControlView): string {
  return control.key.split(' › ').at(-1) ?? '';
}
