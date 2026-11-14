import type { TOC } from '@ember/component/template-only';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import Icon from 'client-v2/components/icon';
import StepGrid from 'client-v2/components/step-grid';
import {
  trackName,
  type TrackPlaceholder,
} from 'client-v2/utils/placeholder-tracks';

export interface TrackRowSignature {
  Element: HTMLElement;
  Args: {
    track: TrackPlaceholder;
    /** the selected track is drawn in yellow, and the footer shows its detail and script */
    selected: boolean;
    onSelect: (track: TrackPlaceholder) => void;
  };
}

/**
 * One track, always a compact row: its number (which selects it), source, step-sequencer row and menu.
 * A row carries no script: scripts are shown in the footer only.
 */
const TrackRow: TOC<TrackRowSignature> = <template>
  <article
    class="track
      {{if @selected 'track--active'}}
      {{if @track.output 'track--output'}}"
    aria-label={{trackName @track}}
    aria-current={{if @selected "true"}}
    data-test-track={{@track.order}}
    ...attributes
  >
    <div class="track__row">
      <button
        type="button"
        class="track__order"
        aria-label="Select {{trackName @track}}"
        aria-pressed={{if @selected "true" "false"}}
        data-test-track-select
        {{on "click" (fn @onSelect @track)}}
      >{{@track.order}}</button>

      <div class="track__source">
        {{#if @track.output}}
          <p class="track__output-label truncate">Main Output</p>
        {{else}}
          <button
            type="button"
            class="btn btn--quiet track__source-btn"
            aria-label="Source: {{@track.source}}"
          >
            <span class="truncate">{{@track.source}}</span>
          </button>
        {{/if}}
      </div>

      {{#if @track.steps}}
        <div class="track__sequence">
          <StepGrid
            @steps={{@track.steps}}
            @label={{trackName @track}}
            @current={{@track.current}}
          />
        </div>
      {{/if}}

      <div class="track__actions">
        <button
          type="button"
          class="icon-btn track__menu"
          aria-label="{{trackName @track}} menu"
        >
          <Icon @name="dots" />
        </button>
      </div>
    </div>
  </article>
</template>;

export default TrackRow;
