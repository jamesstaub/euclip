import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';
import { service } from '@ember/service';
import Slider from 'client-v2/components/ui/slider';
import { mapping } from 'client-v2/controls/modes';
import type { TrackDocument } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';
import type ChainMetersService from 'client-v2/services/chain-meters';
import type ProjectService from 'client-v2/services/project';

/** The level fader: decibels, from silence to a little above unity. */
const LEVEL = mapping('decibels', { min: 0, max: 1.5 });
const PAN = mapping('linear', { min: -1, max: 1 });
/** The strip as a column is 7rem wide; as a row it is the width of the footer. */
const UPRIGHT_BELOW_PX = 200;

function panText(pan: number): string {
  if (Math.abs(pan) < 0.005) return 'C';
  return `${Math.round(Math.abs(pan) * 100)}${pan < 0 ? 'L' : 'R'}`;
}

function levelText(level: number): string {
  return LEVEL.format(level);
}

export interface ChannelStripSignature {
  Element: HTMLElement;
  Args: {
    track: TrackDocument;
  };
}

/**
 * The selected track's channel strip: the level and pan of its `channel` bus, which Euclip makes for
 * every track and routes to main. The values are the project's, not the script's, and the strip is not
 * declared in the script: what links the two is the script's `.to('channel')`, shown under the heading.
 * A script that sends nothing there leaves the strip with nothing to act on, and it says so. Beside the
 * fader, a meter of what leaves the strip: after its level and pan (post fader).
 */
export default class ChannelStrip extends Component<ChannelStripSignature> {
  @service declare audio: AudioService;
  @service declare project: ProjectService;
  @service('chain-meters') declare meters: ChainMetersService;

  /** Nothing the track's script makes goes to `channel`: the strip's level and pan do nothing. */
  get idle(): boolean {
    return !this.audio.sendsToChannel(this.args.track.id);
  }

  /**
   * Beside the panes the strip is a narrow column and its fader stands up; in a narrow footer the strip
   * lies down as a row (see channel-strip.css) and the fader lies down with it.
   */
  @tracked upright = true;

  watchShape = modifier<{ Element: HTMLElement }>((element) => {
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      const upright = (entry?.contentRect.width ?? 0) < UPRIGHT_BELOW_PX;
      // (turning the fader changes the strip's size: done on the next frame, not inside the
      // observer's own delivery, where it would loop)
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (upright !== this.upright) this.upright = upright;
      });
    });
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });

  /** The meter listens to the track's channel output while it is on screen (`chain-meters`). */
  meter = modifier<{ Element: HTMLElement; Args: { Positional: [string] } }>(
    (element, [trackId]) =>
      this.meters.registerOutput(element, `channel/${trackId}`, () =>
        this.audio.channelOutput(trackId),
      ),
  );

  setLevel = (level: number): void =>
    this.project.apply({
      type: 'setTrackLevel',
      id: this.args.track.id,
      level,
    });

  setPan = (pan: number): void =>
    this.project.apply({ type: 'setTrackPan', id: this.args.track.id, pan });

  toggleMute = (): void =>
    this.project.apply({
      type: 'setTrackMute',
      id: this.args.track.id,
      mute: !this.args.track.mute,
    });

  toggleSolo = (): void =>
    this.project.apply({
      type: 'setTrackSolo',
      id: this.args.track.id,
      solo: !this.args.track.solo,
    });

  resetLevel = (): void => this.setLevel(1);
  resetPan = (): void => this.setPan(0);

  <template>
    <section
      class="channel-strip"
      aria-label="Channel strip"
      data-idle={{if this.idle "true"}}
      data-test-channel-strip
      ...attributes
      {{this.watchShape}}
    >
      <div class="channel-strip__title">
        <h3>channel</h3>
        {{! mute and solo are the track's values, like its level and pan; the audio follows them }}
        <div class="channel-strip__switches">
          <button
            type="button"
            class="btn channel-strip__switch channel-strip__switch--mute"
            aria-pressed={{if @track.mute "true" "false"}}
            aria-label="Mute track"
            data-test-strip-mute
            {{on "click" this.toggleMute}}
          >M</button>
          <button
            type="button"
            class="btn channel-strip__switch channel-strip__switch--solo"
            aria-pressed={{if @track.solo "true" "false"}}
            aria-label="Solo track"
            data-test-strip-solo
            {{on "click" this.toggleSolo}}
          >S</button>
        </div>
      </div>
      {{#if this.idle}}
        <p
          class="channel-strip__idle"
          role="note"
          title="Its level and pan do nothing until the script sends sound to 'channel'"
          data-test-channel-idle
        >This track’s script doesn’t send to <code>'channel'</code>.</p>
      {{/if}}
      <div
        class="channel-strip__controls
          {{if this.idle 'channel-strip__controls--idle'}}"
      >
        <div class="channel-strip__control channel-strip__control--gain">
          <span>gain</span>
          <div class="channel-strip__fader-meter">
            <Slider
              class="channel-strip__fader"
              @value={{@track.level}}
              @mapping={{LEVEL}}
              @label="Track level"
              @orientation={{if this.upright "vertical" "horizontal"}}
              @onChange={{this.setLevel}}
              @onReset={{this.resetLevel}}
              data-test-strip-level
            />
            {{! post fader: what leaves the strip, after its level and pan }}
            <div
              class="channel-strip__meter"
              role="img"
              aria-label="Track output level"
              data-test-strip-meter
              {{this.meter @track.id}}
            ></div>
          </div>
          <output>{{levelText @track.level}}</output>
        </div>
        <div class="channel-strip__control">
          <span>pan</span>
          <Slider
            @value={{@track.pan}}
            @mapping={{PAN}}
            @label="Track pan"
            @onChange={{this.setPan}}
            @onReset={{this.resetPan}}
            data-test-strip-pan
          />
          <output>{{panText @track.pan}}</output>
        </div>
      </div>
    </section>
  </template>
}
