import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { AudioNodeConfig, defaultParams } from 'euclip/utils/audio-node-config';
import { getCrackedNode, noiseNodes, synthNodes } from '../utils/cracked';
import { computed } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { isPresent } from '@ember/utils';
import FilepathControlModel from 'euclip/models/filepath-control';
import type Store from '@ember-data/store';

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
  @service store!: Store;

  @belongsTo('track', { async: false, inverse: 'trackNode' }) track!: any;
  @hasMany('track-control', { async: false, inverse: 'trackNode' }) trackControls!: any[];
  @hasMany('filepath-control', { async: false, inverse: 'trackNode' }) filepathControls!: FilepathControlModel[];

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
    return ['buffer', 'sampler', ...synthNodes, ...noiseNodes].includes(this.nodeType);
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

  // Convenience getter to find the TrackControl record for a sampler node's path attribute
  get samplerFilepathControl(): FilepathControlModel | undefined {
    return this.filepathControls.sortBy('nodeOrder')[0];
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
    return [...this.trackControls.sortBy('sortOrder')];
  }

  // Static method to validate the controls of a node
  static validateControls(nodeControlRecords: any[], nodeType: string): boolean {
    const attrs = AudioNodeConfig[nodeType]?.attrs;

    // No attrs provided
    if (!attrs) return true;
    const controlAttrs = Object.keys(attrs);

    return controlAttrs.every((controlAttr) => {
      if (controlAttr === 'path') {
        return nodeControlRecords.find((nodeControlRecord) => {
          return (
            nodeControlRecord instanceof FilepathControlModel &&
            isPresent(nodeControlRecord.controlValue)
          );
        });
      } else {
        return nodeControlRecords.find(
          (trackControl) => trackControl.nodeAttr === controlAttr
        );
      }
    });
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

  // Update the default values for track controls based on user settings
  updateDefaultValue(): void {
    this.trackControls.forEach((trackControl: any) => {
      const userDefault = this.userSettingsForControl[trackControl.nodeAttr];
      if (trackControl._defaultValue !== userDefault) {
        trackControl.set('currentUnitTransformIdx', 0); // Set default unit
        trackControl.setValue(userDefault); // Make sure to use setValue setter
        trackControl.set('defaultValue', userDefault);
        trackControl.setMinMaxByDefault();
      }
      trackControl.set('_defaultValue', userDefault);
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

    const trackControls = await this.store
      .peekAll('track-control')
      .filter((tc: any) => !tc.isDeleted);

    trackControls
      .filterBy('nodeType', 'sampler')
      .map(
        async (trackControl: any) =>
          await trackControl.setSamplerControlsToBuffer(buffer)
      );
  }

  // Find or create track controls for ephemeral TrackNodes
  findOrCreateTrackControls(): any[] {
    const controlAttrs = Object.keys(AudioNodeConfig[this.nodeType]?.attrs);

    if (controlAttrs.indexOf('path') > -1) {
      // Create filepath control if it doesn't exist
      FilepathControlModel.findOrCreateWith({
        track: this.track,
        trackNode: this,
      });

      // Remove the 'path' attribute from the list for numeric controls
      controlAttrs.splice(controlAttrs.indexOf('path'), 1);
    }

    if (!controlAttrs.map) {
      console.error('Node type not supported');
      return [];
    }

    const existingTrackControls = this.track.get('trackControls').toArray();

    return controlAttrs.map((controlAttr) => {
      let defaultForAttr = defaultParams[controlAttr];

      if (controlAttr === 'frequency') {
        defaultForAttr = defaultParams[controlAttr][this.nodeType];
      }

      if (!defaultForAttr) {
        console.error('No default params for Node Control: ', controlAttr);
        return null;
      }

      const { min, max, stepSize, defaultValue, interfaceName } = defaultForAttr;

      let params = {
        nodeAttr: controlAttr,
        controlArrayValue: [], 
        track: this.track,
        trackNode: this,
        nodeType: this.nodeType,
        nodeOrder: this.order,
        interfaceName: interfaceName[0],
        controlValue: defaultValue,
        defaultValue,
        min,
        max,
        stepSize,
      };

      let trackControl = existingTrackControls.find((tc: any) => {
        return (
          !tc.isDeleted &&
          tc.nodeAttr == params.nodeAttr &&
          tc.nodeType == params.nodeType &&
          tc.nodeOrder == params.nodeOrder &&
          tc.interfaceName == params.interfaceName
        );
      });

      if (trackControl) {
        trackControl.setProperties(params);
      } else {
        trackControl = this.store.createRecord('track-control', params);
      }

      if (this.userDefinedInterfaceName) {
        trackControl.set('interfaceName', this.userDefinedInterfaceName);
      }

      trackControl.saveTrackControl.perform();
      return trackControl;
    });
  }
}
