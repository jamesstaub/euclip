import type { TOC } from '@ember/component/template-only';
import TrackRow from 'client-v2/components/track-row';
import type { TrackPlaceholder } from 'client-v2/utils/placeholder-tracks';

function isSame(a: TrackPlaceholder, b: TrackPlaceholder): boolean {
  return a.id === b.id;
}

export interface TrackListSignature {
  Element: HTMLElement;
  Args: {
    tracks: readonly TrackPlaceholder[];
    selected: TrackPlaceholder;
    onSelect: (track: TrackPlaceholder) => void;
  };
}

/** Main region: the vertical list of tracks, the main output last. It scrolls; the header and footer do not. */
const TrackList: TOC<TrackListSignature> = <template>
  <main
    class="track-list scroll-y scroll--on-dark"
    data-test-track-list
    ...attributes
  >
    <h2 class="sr-only">Tracks</h2>
    <ol class="track-list__items">
      {{#each @tracks key="id" as |track|}}
        <li>
          <TrackRow
            @track={{track}}
            @selected={{isSame track @selected}}
            @onSelect={{@onSelect}}
          />
        </li>
      {{/each}}
    </ol>
  </main>
</template>;

export default TrackList;
