import type { TOC } from '@ember/component/template-only';

export interface ChannelStripSignature {
  Element: HTMLElement;
}

/**
 * The selected track's channel strip: a gain fader and a pan slider. Plain native placeholders; the real
 * controls (and any metering) come later.
 */
const ChannelStrip: TOC<ChannelStripSignature> = <template>
  <section
    class="channel-strip"
    aria-label="Channel strip"
    data-test-channel-strip
    ...attributes
  >
    <h3 class="channel-strip__title">channel strip</h3>
    <div class="channel-strip__controls">
      <label class="channel-strip__control channel-strip__control--gain">
        <span>gain</span>
        <input type="range" min="0" max="1" step="0.01" value="0.8" />
      </label>
      <label class="channel-strip__control">
        <span>pan</span>
        <input type="range" min="-1" max="1" step="0.01" value="0" />
      </label>
    </div>
  </section>
</template>;

export default ChannelStrip;
