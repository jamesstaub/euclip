import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import type { TrackDocument } from 'client-v2/project/schema';
import type ProjectService from 'client-v2/services/project';

/** The top of the level fader: a little above unity. */
const LEVEL_MAX = 1.5;

export interface ChannelStripSignature {
  Element: HTMLElement;
  Args: {
    track: TrackDocument;
  };
}

/**
 * The selected track's channel strip: the level and pan of its `out` bus, which Euclip makes for every
 * track and routes to main. The values are the project's, not the script's. Native inputs for now; no
 * metering.
 */
export default class ChannelStrip extends Component<ChannelStripSignature> {
  @service declare project: ProjectService;

  setLevel = (event: Event): void => {
    const level = (event.target as HTMLInputElement).valueAsNumber;
    this.project.apply({
      type: 'setTrackLevel',
      id: this.args.track.id,
      level,
    });
  };

  setPan = (event: Event): void => {
    const pan = (event.target as HTMLInputElement).valueAsNumber;
    this.project.apply({ type: 'setTrackPan', id: this.args.track.id, pan });
  };

  <template>
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
          <input
            type="range"
            min="0"
            max={{LEVEL_MAX}}
            step="0.01"
            value={{@track.level}}
            data-test-strip-level
            {{on "input" this.setLevel}}
          />
        </label>
        <label class="channel-strip__control">
          <span>pan</span>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={{@track.pan}}
            data-test-strip-pan
            {{on "input" this.setPan}}
          />
        </label>
      </div>
    </section>
  </template>
}
