import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { AudioNodeConfig, defaultParams } from 'euclip/utils/audio-node-config';
import { getCrackedNode, noiseNodes, synthNodes } from '../utils/cracked';
import { computed } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { isPresent } from '@ember/utils';
import FilepathControlModel from 'euclip/models/filepath-control';
import type StoreService from '@ember-data/store';
import byKey from 'euclip/utils/by-key';
import { macroSchemaFor } from 'euclip/utils/macros/library';
import { mergeSchema, resolveSpec, type MacroSchema } from 'euclip/utils/macros/schema';
import type SamplePoolService from 'euclip/services/sample-pool';
import type { PoolAudio } from 'euclip/services/sample-pool';
import {
  defaultNodeParamsByUnit,
  unitOptionsFor,
} from 'euclip/utils/audio-param-config';

// cracked's synth macros: whole instruments that count as the track's sound source
export const macroSynthNodes = ['polysynth', 'monosynth', 'gang_of_oscillators'];

// Enum for file load states
export const FILE_LOAD_STATES = {
  EMPTY: 'empty',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

type FileLoadState = typeof FILE_LOAD_STATES[keyof typeof FILE_LOAD_STATES];

// sampler controls that exist in euclip only: they never reach the audio node (see toAudioAttrs)
const SAMPLER_ONLY_IN_EUCLIP = ['snap', 'startSlice', 'endSlice'];

// TrackNodeModel class definition
export default class TrackNodeModel extends Model {
  @service store!: StoreService;
  @service declare samplePool: SamplePoolService;

  @belongsTo('track', { async: false, inverse: 'trackNode' }) track!: any;
  @hasMany('track-control', { async: false, inverse: 'trackNode' }) trackControls!: any[];
  @belongsTo('filepath-control', { async: false, inverse: 'trackNode' }) filepathControl!: FilepathControlModel;

  @attr('string') userDefinedInterfaceName!: string;
  // Not persisted: what the init script passed when it built this node, read by the controls
  // (numeric attr literals) and by `this.controls` (the node's script `id`).
  userSettingsForControl: Record<string, number> = {};
  scriptId?: string;

  @attr('string') nodeUUID!: string;
  @attr('string') nodeType!: string;
  @attr('number') order!: number;

  @attr() parentMacro!: any; // AudioNode of macro this node belongs to (not serialized)
  @attr('boolean') isChannelStripChild!: boolean;

  @tracked fileLoadState!: FileLoadState;

  // Computed property for checking if this is a source node
  get isSourceNode(): boolean {
    return ['buffer', 'sampler', ...synthNodes, ...macroSynthNodes, ...noiseNodes].includes(this.nodeType);
  }

  /**
   * What kind of sound source this node is, for the UI: a sample player, an oscillator, a noise
   * generator or a whole instrument (a cracked macro such as the polysynth). Undefined for effects.
   */
  get sourceKind(): 'sample' | 'oscillator' | 'noise' | 'macro' | undefined {
    if (!this.isSourceNode) return undefined;
    if (this.nodeType === 'sampler' || this.nodeType === 'buffer') return 'sample';
    if (macroSynthNodes.includes(this.nodeType)) return 'macro';
    if (noiseNodes.includes(this.nodeType)) return 'noise';
    return 'oscillator';
  }

  // Computed property for unique selector
  @computed('nodeUUID')
  get uniqueSelector(): string {
    return `${this.nodeUUID}`;
  }

  // Computed property for checking if this is a sampler node
  get isSampler(): boolean {
    return this.nodeType === 'sampler';
  }

  // Computed property for getting the cracked node
  get crackedNode(): any {
    return getCrackedNode(this.nodeUUID);
  }

  // Sample length in seconds: this node's own decoded buffer, else what we already learned about its file
  @tracked _bufferDuration?: number;
  get bufferDuration(): number | undefined {
    return this._bufferDuration ?? this.soundFile?.duration;
  }
  set bufferDuration(value: number | undefined) {
    this._bufferDuration = value;
  }

  get soundFile(): any {
    const path = this.filepathControl?.controlValue;
    if (!path) return undefined;
    return this.store.peekAll('sound-file').find((file: any) => file.filePathRelative === path);
  }

  /**
   * Slices of a sampler's sample: its onsets cut the file into regions. The audio the pool analysed is found
   * by the sampler's file path (the pool's decoded copy, shared by every track using the file).
   */
  get poolAudio(): PoolAudio | undefined {
    const path = this.filepathControl?.controlValue;
    return path ? this.samplePool.audioForPath(path) : undefined;
  }

  // the project's pool record for this sampler's file, where its onset threshold is kept (undefined if the
  // file isn't in the pool)
  get poolSample(): any {
    const path = this.filepathControl?.controlValue;
    if (!path) return undefined;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return this.track?.project?.projectSamples?.find((sample: any) => sample.path === normalized);
  }

  // [0, ...onsets, duration], in seconds; empty until the sample has been analysed
  get sliceBoundaries(): number[] {
    return this.poolAudio?.boundaries ?? [];
  }

  get sliceCount(): number {
    return Math.max(0, this.sliceBoundaries.length - 1);
  }

  /**
   * The region the slice controls ask for, in seconds, or undefined when they aren't in use (startSlice is
   * -1) or the sample hasn't been analysed. `endSlice` is the last slice played (inclusive); -1 means
   * the same as startSlice. Indexes past the last slice stick to the last slice.
   */
  sliceRegion(): { start: number; end: number } | undefined {
    if (this.nodeType !== 'sampler') return undefined;
    const boundaries = this.sliceBoundaries;
    const count = boundaries.length - 1;
    if (count < 1) return undefined;

    const controls = this.trackControls ?? [];
    const valueOf = (attr: string) => {
      const control = controls.find((c: any) => !c.isDeleted && c.nodeAttr === attr);
      return control ? control.modulation ?? control.controlValue : undefined;
    };
    const startSlice = valueOf('startSlice');
    if (!Number.isFinite(startSlice) || startSlice < 0) return undefined;

    const first = Math.min(Math.round(startSlice), count - 1);
    const endSlice = valueOf('endSlice');
    const last = Number.isFinite(endSlice) && endSlice >= 0 ? Math.min(Math.max(Math.round(endSlice), first), count - 1) : first;
    return { start: boundaries[first], end: boundaries[last + 1] };
  }

  // The start and end the time controls ask for (what plays when the slice controls aren't in use), in seconds
  regionFromTimeControls(): Record<string, number> {
    const region: Record<string, number> = {};
    ['start', 'end'].forEach((attr) => {
      const control = (this.trackControls ?? []).find((c: any) => !c.isDeleted && c.nodeAttr === attr);
      const value = control?.effectiveValue();
      if (Number.isFinite(value)) region[attr] = value;
    });
    return region;
  }

  /**
   * Turns control values into what the audio node understands: the euclip-only settings (snap, the slice
   * indexes) are not audio attributes and are dropped, and when the slice controls are in use the region
   * they name replaces `start` and `end`.
   */
  toAudioAttrs(attrs: Record<string, any>): Record<string, any> {
    const audio = { ...attrs };
    SAMPLER_ONLY_IN_EUCLIP.forEach((attr) => delete audio[attr]);
    const region = this.sliceRegion();
    if (region) {
      audio.start = region.start;
      audio.end = region.end;
    }
    return audio;
  }

  /**
   * Once the sample's onsets are known the slice controls can only go as high as there are slices:
   * set their range (their index starts at -1 for "not in use").
   */
  syncSliceControlRanges(): void {
    const count = this.sliceCount;
    if (!count) return;
    this.trackControls
      .filter((c: any) => !c.isDeleted && (c.nodeAttr === 'startSlice' || c.nodeAttr === 'endSlice'))
      .forEach((control: any) => {
        if (control.max === count - 1 && control.min === -1) return;
        control.min = -1;
        control.max = count - 1;
        control.saveTrackControl.perform();
      });
  }

  // Computed property for checking if the sample is loaded
  get sampleIsLoaded(): boolean {
    return this.fileLoadState === FILE_LOAD_STATES.SUCCESS;
  }

  // Computed property for getting the native node
  get nativeNode(): any | null {
    if (!this.crackedNode) return null;
    let nativeNode = this.crackedNode.getNativeNode();

    // If the cracked node is a macro, nativeNode will be an array
    if (nativeNode instanceof Array) {
      [nativeNode] = nativeNode;
    }
    return nativeNode;
  }

  // Filtered track controls for one-dimensional controls
  get oneDimensionalControls(): any[] {
    return this.trackControls.filter(
      (trackControl) => !trackControl.isMultislider
    );
  }

  // Filtered track controls for multislider controls
  get multisliderControls(): any[] {
    return this.trackControls.filter(
      (trackControl) => trackControl.isMultislider
    );
  }

  // Sorted track controls by sortOrder
  get sortedTrackControls(): any[] {
    if (!this.trackControls) {
      return [];
    }
    return [...this.trackControls.slice().sort(byKey('sortOrder'))];
  }

  /**
   * If this node is a macro with a control schema: that schema, plus whatever the script declared for it
   * (`this.declareControls('polysynth', { ... })`). Undefined for ordinary audio nodes.
   */
  get macroSchema(): MacroSchema | undefined {
    const base = macroSchemaFor(this.nodeType);
    if (!base) return undefined;
    // built-in schema, then what the project's macros script declared, then what this track's script declared
    const projectLevel = mergeSchema(base, this.track?.project?.declaredMacroControls?.[this.nodeType]);
    return mergeSchema(projectLevel, this.track?.declaredMacroControls?.[this.nodeType]);
  }

  // The attributes this node gets track controls for: a macro's schema settings, or an audio node's attrs
  get controlAttrs(): string[] {
    const schema = this.macroSchema;
    return schema ? Object.keys(schema) : TrackNodeModel.controlAttrsFor(this.nodeType);
  }

  // The numeric control attributes a node type exposes (the file path is a FilepathControl, not a track control)
  static controlAttrsFor(nodeType: string): string[] {
    const attrs = AudioNodeConfig[nodeType]?.attrs;
    if (!attrs) return [];
    return Object.keys(attrs).filter((attr) => attr !== 'path');
  }

  // Static method to find the channel strip node
  static channelStripNode(track: any): any {
    return track.trackNodes.find(
      (trackNode: TrackNodeModel) => trackNode.nodeType === 'channelStrip'
    );
  }

  // Compares the numbers the init script gave this node with the ones it gave last time (the controls'
  // `scriptValue`). A control whose literal changed starts over from the script's value; one whose literal
  // is unchanged keeps whatever the user set, so reloading or replaying never resets user edits.
  updateDefaultValue(): void {
    this.trackControls.forEach((trackControl: any) => {
      const literal = this.userSettingsForControl?.[trackControl.nodeAttr];
      if (!isPresent(literal) || trackControl.scriptValue === literal) return;

      if (trackControl.scriptValue == null && trackControl.defaultValue === literal) {
        // saved before scriptValue existed and still at the script's number: just start tracking it
        trackControl.scriptValue = literal;
        trackControl.saveTrackControl.perform();
        return;
      }
      trackControl.adoptScriptValue(literal);
    });
  }

  /**
   * A setting the script declared with `this.declareControls(...)` has its range and step re-applied on every
   * build, so editing the declaration changes the control straight away. The control's current value is never
   * clipped: the range grows to include it.
   */
  applyDeclaredRanges(): void {
    const declared = {
      ...this.track?.project?.declaredMacroControls?.[this.nodeType],
      ...this.track?.declaredMacroControls?.[this.nodeType],
    };
    const schema = this.macroSchema;
    if (!Object.keys(declared).length || !schema) return;

    this.trackControls.forEach((trackControl: any) => {
      if (trackControl.isDeleted || !declared[trackControl.nodeAttr] || !schema[trackControl.nodeAttr]) return;
      const { min, max, stepSize } = resolveSpec(schema[trackControl.nodeAttr]);
      const current = [trackControl.controlValue, trackControl.defaultValue].filter(Number.isFinite);
      const range = {
        min: Math.min(min, ...current),
        max: Math.max(max, ...current),
        stepSize,
      };
      if (['min', 'max', 'stepSize'].every((key) => trackControl[key] === range[key as keyof typeof range])) return;
      Object.assign(trackControl, range);
      trackControl.saveTrackControl.perform();
    });
  }

  // Delink controls for dead nodes (if no audio node exists)
  delinkControlsForDeadNodes(): void {
    const uuid = this.nodeUUID;
    const node = getCrackedNode(uuid);

    if (uuid && !node) {
      console.warn('Attempted to update attrs on an orphaned trackNode', this.nodeType);
      this.trackControls.forEach((trackControl: any) => {
        trackControl.nodeUUID = null;
      });
    }
  }

  // Makes sure this sampler's sample has been analysed for onsets, then fits the slice controls to it.
  async loadSlices(buffer?: AudioBuffer): Promise<void> {
    const path = this.filepathControl?.controlValue;
    if (!path || this.nodeType !== 'sampler') return;
    await this.samplePool.ensureAnalysis(this.track?.project, path, buffer);
    this.syncSliceControlRanges();
  }

  // Set sampler controls to a given buffer (used for setting the buffer duration)
  async setSamplerControlsToBuffer(buffer: AudioBuffer): Promise<void> {
    this.bufferDuration = buffer.duration;
    if (this.soundFile) this.soundFile.duration = buffer.duration;

    // only this node's own controls: other tracks' samplers have their own buffers
    this.trackControls
      .filter((tc: any) => !tc.isDeleted && tc.nodeType === 'sampler')
      .forEach((trackControl: any) => trackControl.setSamplerControlsToBuffer(buffer));

    // its onsets, for the waveform's slice markers and the slice controls
    await this.loadSlices(buffer);
  }

  /**
   * Starting values for a new track control for one of this node's attributes (from the node/param config).
   * Creating and linking the records is Track#setupTrackControls' job; this only describes the control.
   */
  defaultControlParams(controlAttr: string): Record<string, any> | null {
    const macroSpec = this.macroSchema?.[controlAttr];
    if (macroSpec) {
      const { min, max, stepSize, defaultValue } = resolveSpec(macroSpec);
      return {
        nodeAttr: controlAttr,
        track: this.track,
        trackNode: this,
        nodeType: this.nodeType,
        nodeOrder: this.order,
        interfaceName: macroSpec.type === 'choice' ? 'select' : 'slider',
        controlValue: defaultValue,
        defaultValue,
        min,
        max,
        stepSize,
      };
    }

    let defaultForAttr = defaultParams[controlAttr];

    if (controlAttr === 'frequency') {
      defaultForAttr = defaultParams[controlAttr]?.[this.nodeType];
    }

    if (!defaultForAttr) {
      console.error('No default params for Node Control: ', controlAttr);
      return null;
    }

    const { interfaceName } = defaultForAttr;

    // the node-specific range for the attr's default unit wins over the generic per-attr defaults
    const unitConfig =
      defaultNodeParamsByUnit[this.nodeType]?.[controlAttr]?.[
        unitOptionsFor(this.nodeType, controlAttr)[0]
      ] ?? {};
    const pick = (key: string) =>
      Number.isFinite(unitConfig[key]) ? unitConfig[key] : defaultForAttr[key];
    const min = pick('min');
    const max = pick('max');
    const stepSize = pick('stepSize');
    const defaultValue = pick('defaultValue');

    return {
      nodeAttr: controlAttr,
      track: this.track,
      trackNode: this,
      nodeType: this.nodeType,
      nodeOrder: this.order,
      interfaceName: this.userDefinedInterfaceName || interfaceName[0],
      controlValue: defaultValue,
      defaultValue,
      min,
      max,
      stepSize,
    };
  }
}
