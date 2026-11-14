import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Icon from 'client-v2/components/icon';
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

  setBpm = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (!Number.isNaN(input.valueAsNumber)) {
      this.project.apply({ type: 'setBpm', bpm: input.valueAsNumber });
    }
    // what was typed may have been out of range: show what the project took
    input.value = String(this.project.doc.bpm);
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
          value={{this.project.doc.bpm}}
          aria-label="Tempo in beats per minute"
          data-test-transport-tempo
          {{on "change" this.setBpm}}
        />
        <span aria-hidden="true">bpm</span>
      </div>
    </div>
  </template>
}
