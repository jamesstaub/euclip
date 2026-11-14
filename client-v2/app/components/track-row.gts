import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import PopupMenu, { type MenuItem } from 'client-v2/components/ui/popup-menu';
import type { SequencerView } from 'client-v2/audio/runner';
import { sequencerWidget } from 'client-v2/controls/registry';
import type { TrackDocument } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';

function more(sequencers: readonly SequencerView[]): boolean {
  return sequencers.length > 1;
}

const Grid = sequencerWidget().component;

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
  };
}

/**
 * One track, always a compact row: its number (which selects it), name, a step grid for each sequencer
 * its script declares (in the order declared), and its menu. A track that declares none says so quietly.
 * A track whose script has an error is marked.
 */
export default class TrackRow extends Component<TrackRowSignature> {
  @service declare audio: AudioService;

  @tracked menuOpen = false;

  get sequencers(): SequencerView[] {
    return this.audio.sequencers(this.args.track.id);
  }

  get error(): string | undefined {
    return this.audio.error(this.args.track.id)?.message;
  }

  get menuItems(): MenuItem[] {
    return [
      { label: 'Remove', onSelect: () => this.args.onRemove(this.args.track) },
    ];
  }

  setMenuOpen = (open: boolean): void => {
    this.menuOpen = open;
  };

  <template>
    <article
      class="track {{if @selected 'track--active'}}"
      aria-label="Track {{@order}}, {{@track.name}}"
      aria-current={{if @selected "true"}}
      data-error={{if this.error "true"}}
      data-test-track={{@order}}
      data-track-id={{@track.id}}
      ...attributes
    >
      <div class="track__row">
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
            aria-label="Select {{@track.name}}"
            data-test-track-name
            {{on "click" (fn @onSelect @track.id)}}
          >
            <span class="truncate">{{@track.name}}</span>
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
          {{#each this.sequencers key="key" as |sequencer|}}
            <div class="track__grid">
              {{#if (more this.sequencers)}}
                <span
                  class="track__grid-name truncate"
                >{{sequencer.label}}</span>
              {{/if}}
              <Grid @scopeId={{@track.id}} @control={{sequencer}} />
            </div>
          {{else}}
            <p class="track__no-grid" data-test-no-sequencer>No sequencer
              declared</p>
          {{/each}}
        </div>

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
