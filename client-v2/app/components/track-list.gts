import type { TOC } from '@ember/component/template-only';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import TrackRow, { selectFromBackground } from 'client-v2/components/track-row';
import { PROJECT_SCOPE, type TrackDocument } from 'client-v2/project/schema';

function is(a: string, b: string): boolean {
  return a === b;
}

function plusOne(index: number): number {
  return index + 1;
}

function outputOrder(tracks: readonly TrackDocument[]): number {
  return tracks.length + 1;
}

export interface TrackListSignature {
  Element: HTMLElement;
  Args: {
    tracks: readonly TrackDocument[];
    /** a track's id, or PROJECT_SCOPE for the main output */
    selectedId: string;
    onSelect: (id: string) => void;
    onRemove: (track: TrackDocument) => void;
    /** an error in the project script, to mark the main output with */
    projectError?: string;
  };
}

/**
 * Main region: the vertical list of tracks, then the main output (which houses the project script).
 * It scrolls; the header and footer do not.
 */
const TrackList: TOC<TrackListSignature> = <template>
  <main
    class="track-list scroll-y scroll--on-dark"
    data-test-track-list
    ...attributes
  >
    <h2 class="sr-only">Tracks</h2>
    <ol class="track-list__items">
      {{#each @tracks key="id" as |track index|}}
        <li>
          <TrackRow
            @track={{track}}
            @order={{plusOne index}}
            @selected={{is track.id @selectedId}}
            @onSelect={{@onSelect}}
            @onRemove={{@onRemove}}
          />
        </li>
      {{/each}}
      <li>
        <article
          class="track track--output
            {{if (is @selectedId PROJECT_SCOPE) 'track--active'}}"
          aria-label="Main output"
          aria-current={{if (is @selectedId PROJECT_SCOPE) "true"}}
          data-error={{if @projectError "true"}}
          data-test-track="output"
        >
          {{! template-lint-disable no-invalid-interactive }}
          <div
            class="track__row"
            data-test-track-row
            {{on "click" (fn selectFromBackground @onSelect PROJECT_SCOPE)}}
          >
            <button
              type="button"
              class="track__order"
              aria-label="Select main output"
              aria-pressed={{if (is @selectedId PROJECT_SCOPE) "true" "false"}}
              data-test-track-select
              {{on "click" (fn @onSelect PROJECT_SCOPE)}}
            >{{outputOrder @tracks}}</button>
            <div class="track__source">
              <p class="track__output-label truncate">Main Output</p>
              {{#if @projectError}}
                <span
                  class="track__alert"
                  role="img"
                  aria-label="The project script has an error"
                  title={{@projectError}}
                  data-test-track-error
                >!</span>
              {{/if}}
            </div>
          </div>
        </article>
      </li>
    </ol>
  </main>
</template>;

export default TrackList;
