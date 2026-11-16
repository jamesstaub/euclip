import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Icon from 'client-v2/components/icon';
import ownText from 'client-v2/modifiers/own-text';
import { BPM_MAX, BPM_MIN } from 'client-v2/project/operations';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';

export interface TransportSignature {
  Element: HTMLDivElement;
}

/** The transport, in the project bar as in v1: play, stop and the project's tempo. */
export default class Transport extends Component<TransportSignature> {
  @service declare audio: AudioService;
  @service declare project: ProjectService;

  // play() is called straight from the click: that is where a browser lets audio start
  play = (): void => this.audio.play();
  stop = (): void => this.audio.stop();

  /**
   * The tempo is committed when the field is left or Enter is pressed (the browser's `change`): one
   * step to undo for what was typed, not one per key. While it is being typed the text is the
   * person's, empty or half-written as it may be (modifiers/own-text): nothing writes into the field.
   * What cannot be a tempo (nothing, or not a number) puts the stored tempo back; a number out of range
   * is brought into it.
   */
  setBpm = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (!Number.isNaN(input.valueAsNumber)) {
      this.project.apply({ type: 'setBpm', bpm: input.valueAsNumber });
    }
    // what was typed may have been out of range, or nothing: show what the project has
    input.value = String(this.project.doc.bpm);
  };

  /** Escape gives up what was typed. */
  onTempoKey = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    const input = event.target as HTMLInputElement;
    event.stopPropagation();
    input.value = String(this.project.doc.bpm);
    input.select();
  };

  <template>
    <div
      class="transport"
      role="group"
      aria-label="Transport"
      data-playing={{if this.audio.playing "true" "false"}}
      data-test-transport
      ...attributes
    >
      <button
        type="button"
        class="icon-btn transport__btn"
        aria-label="Play"
        aria-pressed={{if this.audio.playing "true" "false"}}
        data-test-transport-play
        {{on "click" this.play}}
      >
        <Icon @name="play" />
      </button>
      <button
        type="button"
        class="icon-btn transport__btn"
        aria-label="Stop"
        data-test-transport-stop
        {{on "click" this.stop}}
      >
        <Icon @name="stop" />
      </button>
      <div class="transport__tempo">
        <input
          type="number"
          inputmode="numeric"
          min={{BPM_MIN}}
          max={{BPM_MAX}}
          step="1"
          aria-label="Tempo in beats per minute"
          data-test-transport-tempo
          {{ownText this.project.doc.bpm}}
          {{on "change" this.setBpm}}
          {{on "keydown" this.onTempoKey}}
        />
        <span aria-hidden="true">bpm</span>
      </div>
    </div>
  </template>
}
