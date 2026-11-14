import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Icon from 'client-v2/components/icon';
import StepGrid from 'client-v2/components/step-grid';
import onOutside from 'client-v2/modifiers/on-outside';
import type { SequenceView } from 'client-v2/audio/runner';
import type { TrackDocument } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';

function more(sequences: readonly SequenceView[]): boolean {
  return sequences.length > 1;
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
  };
}

/**
 * One track, always a compact row: its number (which selects it), name, a step grid for each named
 * sequence its script makes, and its menu. A track whose script has an error is marked; one that has
 * never built has no grids and makes no sound.
 */
export default class TrackRow extends Component<TrackRowSignature> {
  @service declare audio: AudioService;

  @tracked menuOpen = false;

  get sequences(): SequenceView[] {
    return this.audio.sequences(this.args.track.id);
  }

  get error(): string | undefined {
    return this.audio.error(this.args.track.id)?.message;
  }

  toggleStep = (sequence: SequenceView, index: number): void =>
    this.audio.toggleStep(this.args.track.id, sequence.name, index);

  toggleMenu = (): void => {
    this.menuOpen = !this.menuOpen;
  };

  closeMenu = (): void => {
    this.menuOpen = false;
  };

  closeOnEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.menuOpen = false;
  };

  remove = (): void => {
    this.menuOpen = false;
    this.args.onRemove(this.args.track);
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

        {{#if this.sequences.length}}
          <div class="track__sequence">
            {{#each this.sequences key="name" as |sequence|}}
              <div class="track__grid">
                {{#if (more this.sequences)}}
                  <span
                    class="track__grid-name truncate"
                  >{{sequence.name}}</span>
                {{/if}}
                <StepGrid
                  @sequence={{sequence}}
                  @label={{@track.name}}
                  @onToggle={{fn this.toggleStep sequence}}
                />
              </div>
            {{/each}}
          </div>
        {{/if}}

        {{! template-lint-disable no-invalid-interactive }}
        {{! Escape anywhere in the open menu closes it }}
        <div
          class="track__actions"
          {{onOutside this.closeMenu}}
          {{on "keydown" this.closeOnEscape}}
        >
          <button
            type="button"
            class="icon-btn track__menu"
            aria-label="Track {{@order}} menu"
            aria-haspopup="menu"
            aria-expanded={{if this.menuOpen "true" "false"}}
            data-test-track-menu
            {{on "click" this.toggleMenu}}
          >
            <Icon @name="dots" />
          </button>
          {{#if this.menuOpen}}
            <ul class="menu" role="menu" aria-label="Track {{@order}}">
              <li role="none">
                <button
                  type="button"
                  class="menu__item"
                  role="menuitem"
                  data-test-track-remove
                  {{on "click" this.remove}}
                >Remove</button>
              </li>
            </ul>
          {{/if}}
        </div>
      </div>
    </article>
  </template>
}
