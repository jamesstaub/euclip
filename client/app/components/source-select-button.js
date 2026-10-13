import Component from '@glimmer/component';

// 32 x 14 outlines for the waveform shown on an oscillator's button
const WAVEFORMS = {
  sine: 'M1 7 Q5 0 9 7 T17 7 T25 7 T31 7',
  square: 'M1 11 V3 H9 V11 H17 V3 H25 V11 H31',
  saw: 'M1 11 L9 3 V11 L17 3 V11 L25 3 V11 L31 3',
  triangle: 'M1 7 L5 2 L13 12 L21 2 L29 12 L31 8',
  noise: 'M1 7 L3 3 L5 11 L7 5 L9 9 L11 2 L13 12 L15 6 L17 10 L19 3 L21 11 L23 5 L25 9 L27 4 L29 10 L31 7',
};

/**
 * One button per track summarising its sound source, whatever it is:
 *   sample        a single audio file (shows its filename)
 *   multi-sample  several samplers (a grid icon and 'loaded / total'; a fixed width, whatever the count)
 *   oscillator    a waveform outline and the oscillator's name
 *   noise         a noise outline and its name
 *   macro         a layered icon and the instrument's name (e.g. polysynth)
 * Clicking a sample / multi-sample button opens the sound sidebar; the others open the source tab.
 *
 * Args: @track, @onClick
 */
export default class SourceSelectButtonComponent extends Component {
  get kind() {
    return this.args.track.sourceKind;
  }

  get samplers() {
    return this.args.track.samplerNodes ?? [];
  }

  get sourceNode() {
    return this.args.track.firstSourceNode;
  }

  get isSample() {
    return this.kind === 'sample';
  }

  get isMultiSample() {
    return this.kind === 'multi-sample';
  }

  get isMacro() {
    return this.kind === 'macro';
  }

  get hasWaveform() {
    return this.kind === 'oscillator' || this.kind === 'noise';
  }

  get sourceName() {
    return this.sourceNode?.nodeType;
  }

  get waveformPath() {
    const type = this.kind === 'noise' ? 'noise' : this.sourceName;
    return WAVEFORMS[type] ?? WAVEFORMS[type === 'sawtooth' ? 'saw' : 'sine'];
  }

  get filename() {
    return this.samplers[0]?.filepathControl?.filename;
  }

  get sampleCount() {
    return this.samplers.length;
  }

  // whether each sampler has a sound, in order
  get slotStates() {
    return this.samplers.map((node) => Boolean(node.filepathControl?.controlValue));
  }

  get loadedCount() {
    return this.slotStates.filter(Boolean).length;
  }

  // a download error on any of the track's samples
  get fileError() {
    return this.samplers
      .map((node) => node.filepathControl?.fileDownloadError)
      .find(Boolean);
  }

  get classNames() {
    if (this.fileError) return 'red b--red italic';
    // a single sampler with no file yet is the one that asks you to do something
    if (this.isSample && !this.filename) return 'light-blue b--light-blue';
    return 'yellow b--yellow';
  }

  get label() {
    if (this.fileError) return `Error downloading file: ${this.fileError}`;
    if (this.isSample) return `Open the sound sidebar (${this.filename ?? 'no sound picked yet'})`;
    if (this.isMultiSample) return `Open the sound sidebar (${this.loadedCount} of ${this.sampleCount} samplers have a sound)`;
    return `Open the source tab (${this.sourceName})`;
  }
}
