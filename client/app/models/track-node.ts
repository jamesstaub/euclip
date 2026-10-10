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

// cracked's synth macros: whole instruments that count as the track's sound source
const macroSynthNodes = ['polysynth', 'monosynth', 'gang_of_oscillators'];

// Enum for file load states
export const FILE_LOAD_STATES = {
  EMPTY: 'empty',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

type FileLoadState = typeof FILE_LOAD_STATES[keyof typeof FILE_LOAD_STATES];

// TrackNodeModel class definition
export default class TrackNodeModel extends Model {
  @service store!: StoreService;

  @belongsTo('track', { async: false, inverse: 'trackNode' }) track!: any;
  @hasMany('track-control', { async: false, inverse: 'trackNode' }) trackControls!: any[];
  @belongsTo('filepath-control', { async: false, inverse: 'trackNode' }) filepathControl!: FilepathControlModel;

  @attr('string') userDefinedInterfaceName!: string;
  @attr('string') userSettingsForControl!: string;

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

  // Update the user-defined interface name and save to track controls
  updateUserDefinedInterfaceName(userDefinedInterfaceName: string): void {
    this.set('userDefinedInterfaceName', userDefinedInterfaceName);
    if (this._userDefinedInterfaceName !== this.userDefinedInterfaceName) {
      this.trackControls.forEach((trackControl: any) => {
        if (
          trackControl.interfaceNamesForAttr.includes(userDefinedInterfaceName)
        ) {
          trackControl.set('interfaceName', userDefinedInterfaceName);
        } else {
          // Set the default interface name for unsupported controls
          trackControl.set('interfaceName', trackControl.interfaceNamesForAttr[0]);
        }
        trackControl.save();
      });
    }
    this._userDefinedInterfaceName = this.userDefinedInterfaceName;
  }

  // When the script gives a control a different default than the one stored, reset that control to it.
  // (Compared against the persisted defaultValue, so reloading or replaying never resets user edits.)
  updateDefaultValue(): void {
    this.trackControls.forEach((trackControl: any) => {
      const userDefault = this.userSettingsForControl?.[trackControl.nodeAttr];
      if (!isPresent(userDefault) || trackControl.defaultValue === userDefault) return;

      trackControl.set('currentUnitTransformIdx', 0); // Set default unit
      trackControl.setValue(userDefault); // Make sure to use setValue setter
      trackControl.set('defaultValue', userDefault);
      trackControl.setMinMaxByDefault();
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

  // Set sampler controls to a given buffer (used for setting the buffer duration)
  async setSamplerControlsToBuffer(buffer: AudioBuffer): Promise<void> {
    this.bufferDuration = buffer.duration;
    if (this.soundFile) this.soundFile.duration = buffer.duration;

    // only this node's own controls: other tracks' samplers have their own buffers
    this.trackControls
      .filter((tc: any) => !tc.isDeleted && tc.nodeType === 'sampler')
      .forEach((trackControl: any) => trackControl.setSamplerControlsToBuffer(buffer));
  }

  /**
   * Starting values for a new track control for one of this node's attributes (from the node/param config).
   * Creating and linking the records is Track#setupTrackControls' job; this only describes the control.
   */
  defaultControlParams(controlAttr: string): Record<string, any> | null {
    let defaultForAttr = defaultParams[controlAttr];

    if (controlAttr === 'frequency') {
      defaultForAttr = defaultParams[controlAttr]?.[this.nodeType];
    }

    if (!defaultForAttr) {
      console.error('No default params for Node Control: ', controlAttr);
      return null;
    }

    const { min, max, stepSize, defaultValue, interfaceName } = defaultForAttr;

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
