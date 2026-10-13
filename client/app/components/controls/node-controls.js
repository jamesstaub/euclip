import Component from '@glimmer/component';
import { action } from '@ember/object';

// source nodes that have a pitch to play on a keyboard
const OSCILLATORS = ['sine', 'square', 'saw', 'sawtooth', 'triangle'];

/**
 * The default surface for one track node. Node types with a richer UI get it here, in front of the
 * sliders; a surface "claims" the controls it draws itself so they aren't repeated as sliders.
 *   oscillators: a piano for the frequency control (the slider stays for fine tuning)
 *   samplers:    the waveform, with draggable start and end markers (claims start and end)
 */
export default class ControlsNodeControlsComponent extends Component {
  controlFor(attr) {
    return this.args.trackNode.trackControls.find((c) => !c.isDeleted && c.nodeAttr === attr);
  }

  get pianoControl() {
    const { nodeType } = this.args.trackNode;
    return OSCILLATORS.includes(nodeType) ? this.controlFor('frequency') : undefined;
  }

  // The waveform surface needs the loaded sample, and start/end in units it can convert to seconds
  get waveform() {
    const { trackNode } = this.args;
    if (trackNode.nodeType !== 'sampler' || !trackNode.sampleIsLoaded) return undefined;
    const buffer = trackNode.nativeNode?.buffer;
    const start = this.controlFor('start');
    const end = this.controlFor('end');
    if (!buffer || !start || !end || !start.unitScale || !end.unitScale) return undefined;
    return { buffer, start, end, loop: this.controlFor('loop'), snap: this.controlFor('snap') };
  }

  get claimedAttrs() {
    return this.waveform ? ['start', 'end', 'snap'] : [];
  }

  // sliders, choices and switches go in the compact grid; per-step (multislider) controls are wide and stay as they are
  get gridControls() {
    return this.visibleControls.filter((control) => !control.isMultislider);
  }

  get multisliderControls() {
    return this.visibleControls.filter((control) => control.isMultislider);
  }

  // how many of the node's parameters the user has moved away from their defaults (the ones a surface draws count too)
  get changed() {
    return this.args.trackNode.sortedTrackControls.filter((control) => control.isOverridden);
  }

  @action
  resetAll() {
    this.changed.forEach((control) => control.resetToDefault());
  }

  get visibleControls() {
    const claimed = this.claimedAttrs;
    return this.args.trackNode.sortedTrackControls.filter((c) => !claimed.includes(c.nodeAttr));
  }
}
