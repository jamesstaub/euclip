import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import { PROJECT_SCOPE, type TrackDocument } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';

function plusOne(index: number): number {
  return index + 1;
}

function is(a: string, b: string): boolean {
  return a === b;
}

export interface TrackRailSignature {
  Element: HTMLElement;
  Args: {
    tracks: readonly TrackDocument[];
    /** a track's id, or PROJECT_SCOPE for the main output */
    selectedId: string;
    onSelect: (id: string) => void;
    /** "+": adds the default kind of track (the project bar's menu offers the others) */
    onNewTrack: () => void;
  };
}

/**
 * The phone's way to choose a track: a thin column of track numbers, then M (the main output), then +.
 * Only one track's row is shown at a time, so each number also blinks when its track sounds a step, to
 * keep a sense of the tracks that are out of sight.
 *
 * The blink is written by hand, not drawn: the audio service says which scope sounded a step, and this
 * restarts a CSS animation on that button. Nothing tracked changes, so nothing renders per step. With
 * reduced motion it does not blink.
 */
export default class TrackRail extends Component<TrackRailSignature> {
  @service declare audio: AudioService;

  /** The chosen number is kept in view when there are more tracks than the rail shows. */
  nameOf = (track: TrackDocument, index: number): string =>
    this.audio.trackName(track, index + 1);

  keepChosenInView = modifier((nav: HTMLElement, [chosen]: [string]) => {
    void chosen;
    nav
      .querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  });

  blink = modifier((nav: HTMLElement) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hits = new Map<string, HTMLElement | null>();
    return this.audio.onStepTriggered((scopeId) => {
      let button = hits.get(scopeId);
      if (!button || !button.isConnected) {
        button = nav.querySelector<HTMLElement>(
          `[data-rail-id="${CSS.escape(scopeId)}"]`,
        );
        hits.set(scopeId, button);
      }
      if (!button) return;
      button.classList.remove('is-hit');
      void button.offsetWidth; // (so the animation starts again)
      button.classList.add('is-hit');
    });
  });

  <template>
    <nav
      class="track-rail scroll-y scroll--on-dark"
      aria-label="Tracks"
      data-test-track-rail
      {{this.blink}}
      {{this.keepChosenInView @selectedId}}
      ...attributes
    >
      <ol class="track-rail__items">
        {{#each @tracks key="id" as |track index|}}
          <li>
            <button
              type="button"
              class="track-rail__btn"
              aria-label="Track {{plusOne index}} {{this.nameOf track index}}"
              aria-current={{if (is track.id @selectedId) "true"}}
              data-rail-id={{track.id}}
              data-test-rail-track={{plusOne index}}
              {{on "click" (fn @onSelect track.id)}}
            >{{plusOne index}}</button>
          </li>
        {{/each}}
        <li>
          <button
            type="button"
            class="track-rail__btn"
            aria-label="Main output"
            aria-current={{if (is PROJECT_SCOPE @selectedId) "true"}}
            data-rail-id={{PROJECT_SCOPE}}
            data-test-rail-output
            {{on "click" (fn @onSelect PROJECT_SCOPE)}}
          >M</button>
        </li>
        <li>
          <button
            type="button"
            class="track-rail__btn track-rail__btn--new"
            aria-label="New track"
            data-test-rail-new
            {{on "click" @onNewTrack}}
          >+</button>
        </li>
      </ol>
    </nav>
  </template>
}
