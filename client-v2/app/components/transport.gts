import type { TOC } from '@ember/component/template-only';
import Icon from 'client-v2/components/icon';

export interface TransportSignature {
  Element: HTMLDivElement;
}

/** The transport (play, stop, tempo), in the project bar as in v1. Static: the buttons do nothing yet. */
const Transport: TOC<TransportSignature> = <template>
  <div
    class="transport"
    role="group"
    aria-label="Transport"
    data-test-transport
    ...attributes
  >
    <button
      type="button"
      class="icon-btn transport__btn"
      aria-label="Play"
      data-test-transport-play
    >
      <Icon @name="play" />
    </button>
    <button
      type="button"
      class="icon-btn transport__btn"
      aria-label="Stop"
      data-test-transport-stop
    >
      <Icon @name="stop" />
    </button>
    <div class="transport__tempo">
      <input
        type="number"
        inputmode="numeric"
        min="1"
        max="500"
        step="1"
        value="120"
        aria-label="Tempo in beats per minute"
        data-test-transport-tempo
      />
      <span aria-hidden="true">bpm</span>
    </div>
  </div>
</template>;

export default Transport;
