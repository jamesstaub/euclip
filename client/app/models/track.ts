// app/models/track.ts
import Model, { attr, belongsTo, hasMany  } from '@ember-data/model';
import { service } from '@ember/service';
import { action } from '@ember/object';
import type StoreService from '@ember-data/store';
import { keepLatestTask, timeout } from 'ember-concurrency';
import waitUntil from 'euclip/utils/wait-until';
import { unbindFromSequencer } from 'euclip/utils/cracked';
import { SoundFileStates } from 'euclip/models/sound-file';

import type ProjectModel from './project';
import type InitScriptModel from 'euclip/models/init-script';
import type OnstepScriptModel from 'euclip/models/onstep-script';
import AudioFileTreeModel from 'euclip/models/audio-file-tree';
import TrackNodeModel from 'euclip/models/track-node';
import TrackControlModel from 'euclip/models/track-control';
import FilepathControlModel from 'euclip/models/filepath-control';
import type SequenceModel from 'euclip/models/sequence';
import SoundFileModel from 'euclip/models/sound-file';

import Evented from '@ember/object/evented';

import {
  addCustomSelector,
  applyAttrs,
  bindToLoopStep,
  getCrackedNode,
} from '../utils/cracked';
import filterNumericAttrs from 'euclip/utils/filter-numeric-attrs';
import { tracked } from '@glimmer/tracking';

import { isPresent } from '@ember/utils';


import { extendOnCreateNode } from 'euclip/utils/cracked';
import { FILE_LOAD_STATES } from './track-node';
import { debugLog } from 'euclip/utils/debug-log';
import byKey from 'euclip/utils/by-key';

declare const __: any;
declare const cracked: any;

// Track state management
export enum TrackState {
  CREATED = 'created',
  SAVED = 'saved',
  SETUP = 'setup',
  READY = 'ready',
  ERROR = 'error'
}

export default class TrackModel extends Model.extend(Evented) {

  @service declare store: StoreService;

  @attr('boolean') declare isMaster: boolean;
  // which kind of track this is (sampler, looped_sampler, multi_sampler, polysynth, master...)
  @attr('string', { defaultValue: 'sampler' }) declare trackType: string;
  @attr('number') declare order: number;
  @attr('number', { defaultValue: -1 }) declare stepIndex: number;
  @attr('string', { defaultValue: TrackState.CREATED }) declare state: TrackState;
  @tracked declare nodeToVisualize: any;
  @tracked declare settingsForNodes: any[];

  // true once the track's init script has run at least once (successfully or not).
  // The UI only reports a failed source after this, so it never flashes during creation.
  @tracked hasBuiltAudio = false;
  // set the moment deletion starts: blocks audio rebuilds and hides transient UI states.
  @tracked isTearingDown = false;

  get isRemoved(): boolean {
    return this.isTearingDown || this.isDeleted || this.isDestroying || this.isDestroyed;
  }

  @belongsTo('project', { async: false, inverse: 'tracks' }) declare project: ProjectModel;
  @belongsTo('init-script', { async: false, inverse: 'track' }) declare initScript: InitScriptModel;
  @belongsTo('onstep-script', { async: false, inverse: 'track' }) declare onstepScript: OnstepScriptModel;
  @belongsTo('audio-file-tree', { async: false, inverse: 'track' }) declare audioFileTree: AudioFileTreeModel;

  @hasMany('track-node', { async: false, inverse: 'track' }) declare trackNodes: TrackNodeModel[];
  @hasMany('track-control', { async: false, inverse: 'track' }) declare trackControls: TrackControlModel[];
  @hasMany('filepath-control', { async: false, inverse: 'track' }) declare filepathControls: FilepathControlModel[];
  @hasMany('sequence', { async: false, inverse: 'track' }) declare sequences: SequenceModel[];

  // FIXME: move this to the filepathControl record? 
  // FIXME: probably need to do this once per filepathcontrol (since there can be multiple)
  async createAudioFileTree(): Promise<void> {
    await this.trackControls;
    let path = this.samplerFilepathControl?.controlValue || '';
    const record =  AudioFileTreeModel.createRecord(
      this.store,{
      track: this,
    }, path);
  }

  async destroyAndCleanup(): Promise<void> {
    if (this.isTearingDown) return;
    // Flag first: from here on nothing may rebuild this track's audio, and the UI stops
    // reporting source state while the records are unloaded.
    this.isTearingDown = true;
    const selector = this.stableSelector; // capture: the id is gone once the record is unloaded
    this.unbindAndRemoveCrackedNodes();

    try {
      // Ember Data throws if an in-flight record is unloaded, so let pending saves
      // (e.g. controls of a track that was just created) settle first.
      const children = [...this.trackControls, ...this.filepathControls, ...this.sequences];
      await Promise.all(
        children.filter((r) => r.isSaving).map((r) => waitUntil(() => !r.isSaving))
      );
      await this.destroyRecord(); // the API cascades to controls, scripts and sequences
      // then drop the client copies (copy first: unloading mutates the live arrays)
      [...this.trackNodes, ...children].forEach((record) => {
        if (record && record.isLoaded && !record.isSaving) this.store.unloadRecord(record);
      });
    } catch (error) {
      // the server refused: bring the track (and its sound) back
      console.error(`Failed to delete track ${this.id}`, error);
      this.isTearingDown = false;
      this.rollbackAttributes();
      this.setupAudioFromScripts();
      throw error;
    } finally {
      // sweep again: anything created while the delete request was in flight is an orphan
      if (this.isTearingDown) {
        unbindFromSequencer(selector);
        __(selector).remove();
      }
    }
  }

  // A track can have several sequences, ordered by `order`; the first is the primary one.
  get sortedSequences(): SequenceModel[] {
    return this.sequences.slice().sort(byKey('order'));
  }

  // the primary sequence: drives the step display and the master loop position
  get currentSequence(): SequenceModel | undefined {
    return this.sortedSequences[0];
  }

  get scriptAlert(): string | null {
    return this.initScript?.alert || this.onstepScript?.alert;
  }

  get sourceNodeRecords(): TrackNodeModel[] {
    return this.trackNodes?.filter((tn) => tn).filter((item) => item.isSourceNode === true);
  }

  get firstSourceNode(): TrackNodeModel | undefined {
    return this.sourceNodeRecords[0];
  }

  get samplerNodes(): TrackNodeModel[] {
    return this.sourceNodeRecords.filter((item) => item.nodeType === 'sampler').slice().sort(byKey('order'));
  }

  get adsrNodes(): TrackNodeModel[] {
    return this.sourceNodeRecords.filter((item) => item.nodeType === 'adsr').slice().sort(byKey('order'));
  }

  get samplerNativeBuffers(): AudioBuffer[] {
    return this.samplerNodes
      .map((samplerNode: TrackNodeModel) => samplerNode.sampleIsLoaded && samplerNode.nativeNode?.buffer)
      .filter(Boolean) as AudioBuffer[];
  }

  get sortedFilepathControls(): FilepathControlModel[] {
    return this.filepathControls.slice().sort(byKey('nodeOrder'));
  }

  get samplerFilepathControl(): FilepathControlModel | undefined {
    return this.sortedFilepathControls[0];
  }
  
  /**
   * the array of SoundFiles is populated by silent files first to avoid nulls
   * then replaced by any real sound files related to the filepathcontrols
   * 
   * FIXME: right now filepathcontrols are created if a sampler is initialized with one of these downloadedSoundFiles
   * it doesnt work if you initialize many samplers using the same file (eg set this.files[0] to multiple samplers)
   * 
   * We'd either need to use the same filepath control for multiple nodes, or make multiple filepath controls 
   * with the same value... hmmmm
   */


  get downloadedSoundFiles(): (SoundFileModel | null)[] {
    const soundFiles = this.store.peekAll('sound-file') as SoundFileModel[];
    const files: (SoundFileModel | null)[] = Array.from({ length: 16 }, () => null);

    // slot n of `this.files` is the file for the n-th sampler node
    this.sortedFilepathControls.forEach((filepathControl) => {
      const match = soundFiles.find((item) => item.filePathRelative === filepathControl.controlValue);
      if (match?.isDownloaded && filepathControl.nodeOrder >= 0 && filepathControl.nodeOrder < files.length) {
        files[filepathControl.nodeOrder] = match;
      }
    });

    return files;
  }

  /**
   * The array of downloaded files exposed to the user via `this.files` in the script.
   * Entries are null until a file has downloaded; samplers are still created without a path
   * (they are silent until a file loads), so the UI never depends on a download succeeding.
  */
  get downloadedFilepaths(): (string | null)[] {
    return this.downloadedSoundFiles.map(file => file?.downloadedURI ?? null);
  }


  get validTrackNodes(): TrackNodeModel[] {
    return this.trackNodes;
  }

  get trackNodesForControls(): TrackNodeModel[] {
    return this.validTrackNodes.filter(
      ({ nodeType, parentMacro }) => nodeType !== 'channelStrip' && parentMacro == null
    );
  }

  @action
  updateTrackSequence(sequenceRecord: SequenceModel, key: string, value: any): void {
    if (sequenceRecord.get(key) === value) return;

    if (key === 'hits') {
      sequenceRecord.set('customSequence', []);
    }
    if (key === 'steps' && value < sequenceRecord.hits) {
      sequenceRecord.set('hits', value);
    }

    sequenceRecord.set(key, value);
    unbindFromSequencer(this.stableSelector);
    this.bindToSequencer();
    this.saveTrackSequence.perform(sequenceRecord);
  }

  @keepLatestTask
  *saveTrackSequence(sequenceRecord: SequenceModel): Generator<Promise<void>, void, unknown> {
    yield timeout(1000);
    yield sequenceRecord.save();
  }

  @keepLatestTask
  *updateTrackTask(key: string, value: any, reInit = true): Generator<Promise<void>, void, unknown> {
    try {
      (this as any).set(key, value);
      if (reInit) {
        this.setState(TrackState.SETUP);
        yield this.findOrDownloadSoundFiles();
        if (this.isRemoved) return;
        this.setupAudioFromScripts();
        this.setState(TrackState.READY);
      }
      yield this.save();
    } catch (error) {
      console.error(`Failed to update track ${this.id} (${key})`, error);
      this.setState(TrackState.ERROR);
      this.rollbackAttributes();
    }
  }

  /**
   * Adds another sequence to this track (after the existing ones) and starts stepping it.
   */
  async addSequence(attributes: Partial<Pick<SequenceModel, 'hits' | 'steps' | 'offset'>> = {}): Promise<SequenceModel> {
    const order = Math.max(-1, ...this.sequences.map((sequence) => sequence.order ?? 0)) + 1;
    const sequence = this.store.createRecord('sequence', { track: this, order, ...attributes }) as SequenceModel;
    await sequence.save();
    this.rebindSequences();
    return sequence;
  }

  /**
   * Removes one of this track's sequences. A track always keeps at least one; controls that
   * followed the removed sequence fall back to the primary one.
   */
  async removeSequence(sequence: SequenceModel): Promise<void> {
    if (this.sequences.length <= 1) {
      throw new Error('A track needs at least one sequence');
    }
    unbindFromSequencer(this.stableSelector);
    try {
      await sequence.destroyRecord();
    } finally {
      this.rebindSequences();
    }
  }

  rebindSequences(): void {
    if (this.isRemoved) return;
    unbindFromSequencer(this.stableSelector);
    this.bindToSequencer();
  }

  // file changes run one at a time per track, so two quick picks can never create two controls for a slot
  _fileQueue: Promise<unknown> = Promise.resolve();

  /**
   * Sets the file for the n-th sampler node ("slot") of this track: downloads it, stores it on the
   * slot's filepath control (creating that control only if the slot has none) and rebuilds the audio.
   */
  setFile(slot: number, filepath: string): Promise<FilepathControlModel> {
    const run = async (): Promise<FilepathControlModel> => {
      await SoundFileModel.findOrDownload(filepath, this.store);
      const filepathControl = FilepathControlModel.findOrCreateWith({ track: this, slot, controlValue: filepath });
      await filepathControl.save();
      this.setupAudioFromScripts();
      return filepathControl;
    };
    const result = this._fileQueue.then(run, run);
    this._fileQueue = result.catch(() => {}); // a failed pick must not block the next one
    return result;
  }

  async duplicate(): Promise<TrackModel> {
    const project = await this.project;
    const newTrack = project.tracks.createRecord() as TrackModel;
    return await project.setupAndSaveNewTrack(newTrack, {
      adapterOptions: { duplicateId: this.id },
    });
  }



  /**
   * Audio stuff
   */

  get trackControlData() {
    return this.trackControls.map((trackControl) => {
      // FIXME when user switches a control from single to multi, both values will be truthy/
      // need an 'activeValue' that switches with it
      if (trackControl.get('controlArrayValue.length')) {
        return trackControl.get('controlArrayValue');
      }
      return trackControl.get('controlValue');
    });
  }

  setNodeToVisualize() {
    const firstVisualizableNode = this.settingsForNodes.find(
      (audioNode) => audioNode.nodeType === 'channelStrip'
    );
    const node = __._getNode(firstVisualizableNode?.uuid)?.getNativeNode();
    this.nodeToVisualize = (node && node[0]) || node; // get the gain node of the channelSTrip
  }

  async findOrDownloadSoundFiles(): Promise<SoundFileModel[]> {
    // if there is a sound-file record matching this.filePathRelative, use it
    // then make sure its assoicated to this track
    // else create a new sound-file record
    // track nodes will look for a matching sound-file record to associate to
    
    return Promise.all(this.filepathControls.filter((fpc) => fpc.controlValue).map((filepathControl) => {

          // there can be leftover filepath controls from a previous project that had tracks 
          // without files chosen. TODO: clear out dead filepath controls on project exit.
          
          // ALSO TODO: dont load all project assets on /projects index
          // ALSO ensure that the fpcs are properly tied to the track (shouldnt bleed between projects)

         return SoundFileModel.findOrDownload(
          filepathControl.controlValue,
          this.store
        )
      })
    )
  }

  /**
   * Runs this track's init script to (re)build its audio nodes, then links controls and node records.
   */
  setupAudioFromScripts(unbindBeforeCreate = true) {
    if (this.isRemoved) return;
    const initScript = this.initScript;
    if (!initScript) {
      console.error(`Track ${this.id} has no initScript; cannot build its audio`);
      return;
    }

    // settingsForNodes is an array to store audio node uuids created in this track's script
    // not to be confused with trackNode models,
    // { uuid: type, atts: { filename: '...', speed: 1} }
    this.settingsForNodes = [];

    // cracked.onCreateNode was added to the Cracked library to give access to the AudioNode object upon creation
    // this callback gets called when a user creates cracked audio nodes in the script editor ui
    // macro components should not get individual ui controls
    extendOnCreateNode(async (node, type, creationParams, userSettings) => {
      const nodeSettings = {};
      const uuid = node.getUUID();
      nodeSettings[uuid] = type;
      nodeSettings.nodeType = type; // used to find orphaned nodes
      nodeSettings.uuid = uuid;
      nodeSettings.userSettings = userSettings; // save the initialization attributes so they can be used to update TrackControl's min/max/default param values
      nodeSettings.parentMacro = node.isMacroComponent()
        ? __._getNode(node.getMacroContainerUUID())
        : null;

      const shouldCreateTrackNode =
        __.isFun(cracked[type]) && !node.getMacroContainerUUID();

      if (shouldCreateTrackNode) {
        // add a track-specific class to every node created so it can be
        // easily selected and properly cleaned up. addCustomSelector sets these in
        // the Cracked store
        addCustomSelector(node, this.classSelector); // user-facing, follows track order
        addCustomSelector(node, this.stableSelector); // internal: survives renumbering
        addCustomSelector(node, `${type} ${this.classSelector}`);
        addCustomSelector(node, `${type} ${this.stableSelector}`); // this.select() uses this one: unique per track
        addCustomSelector(node, node.getUUID()); // NOTE: no . or # is used, the uuid is the full selector

        this.settingsForNodes.push(nodeSettings);

        if (userSettings) {
          // callback is a custom addition to cracked library that
          // fires when audio file loads
          userSettings.callback = ({ buffer, error }) => {
            const trackNode = this.trackNodes.find((item) => item.nodeUUID === node.getUUID());

            if (this.trackNodes && trackNode) {
              if (buffer) {
                trackNode.fileLoadState = FILE_LOAD_STATES.SUCCESS;
                trackNode.setSamplerControlsToBuffer(buffer);
              }
              if (error) {
                console.error('File Load Error:', error);
                this.initScript.alert = `File Load Error: ${error}`;
                trackNode.fileLoadState = FILE_LOAD_STATES.ERROR;
              }
            }
          };
        }
        // 'ui' is a custom attr that users can set in the script editor when defining a cracked audio node
        // new AudioNode objects won't get initialized with it by default so we hack it on here
        // see cracked.js line 330
        if (userSettings?.ui) {
          node.ui = userSettings.ui;
        }
      }
    });

    try {
      if (unbindBeforeCreate) {
        this.unbindAndRemoveCrackedNodes();
      }

      // run script to create audio nodes
      debugLog('track', `#${this.order} running init script`, {
        files: this.downloadedFilepaths.slice(0, 3),
        filepathControls: this.filepathControls.map((f) => f.controlValue),
      });
      initScript.invokeFunctionRef();
      debugLog('track', `#${this.order} init script done`, {
        nodes: this.settingsForNodes.map((n) => n.nodeType),
        alert: initScript.alert,
      });

    } finally {
      // never leave this global hook installed, even if the script or node setup throws
      extendOnCreateNode(null);
    }

    // Destroy all TrackNode records for this track, they'll be recreated from the latest update to the AudioNode tree
    // (copy: unloading mutates the live relationship array, which would skip every other record)
    [...this.trackNodes].forEach((trackNode) => this.store.unloadRecord(trackNode));

    let trackNodes = this.createTrackNodeRecords();

    trackNodes = this.applyOrderOfType(trackNodes);
    this.setupTrackControls(trackNodes);
    if (trackNodes.length) {
      this.bindToSequencer();
    } else {
      console.error('no track nodes to bind to sequencer');
    }
    this.setNodeToVisualize();
    this.hasBuiltAudio = true;
  }

  // can take array of trackNodes or trackControls or filepathControls
  // compares keys to determine where in the order of creation
  // this trackNode or trackControl is positioned. used to
  // match existing trackControls to newly re-created trackNodes
  // TODO: refactor to static method?
  applyOrderOfType(recordsArray: (TrackNodeModel | TrackControlModel | FilepathControlModel)[]): (TrackNodeModel | TrackControlModel | FilepathControlModel)[] {
    recordsArray.reduce((acc, record) => {
      let key: string;
      if (record instanceof TrackNodeModel) {
        const { nodeType } = record;
        key = nodeType;
      } else if (record instanceof TrackControlModel) {
        const { nodeType, nodeAttr } = record;
        key = `${nodeType}-${nodeAttr}`;
      } else if (record instanceof FilepathControlModel) {
        key = 'sampler-filepath';
      }

      if (isPresent(acc[key])) {
        acc[key] += 1;
      } else {
        acc[key] = 0;
      }
      record.orderOfType = acc[key];
      return acc;
    }, {});
    return recordsArray;
  }

  /**
   * create TrackNode records for each audio node object
   * created on this track
   *
   * this method assumes that cracked audio nodes (which are wrappers around web audio AudioNode objects) were created by the script,
   * and we now need to create or update TrackNode ember data records.
   *
   * TrackNode records are ephemeral, so trackNode.save is never called.
   * TrackControls however, get created on the server, and returned to the client where they are associated with the TrackNode records
   
   */
  createTrackNodeRecords() {
    // map over audio node objects created in this track's script
    // to create corresponding trackNode model records
    this.settingsForNodes
      .filter((setting) => {
        // currently the channelStrip is the only use case where the child nodes of a macro get TrackNode models.
        if (setting.parentMacro?.nodeType == 'channelStrip') return true;
        return !setting.parentMacro;
      })
      .forEach((node, idx) => {
        const [uuid, type] = Object.entries(node)[0];
        if (getCrackedNode(uuid)) {
          // grab the attributes passed in to the initialization of a cracked node that will be used to set default state of track controls (eg. frequency, gain, speed etc.)
          const userSettingsForControl = filterNumericAttrs(node.userSettings);

          let trackNodeAttrs = {
            nodeUUID: uuid, // always update uuid since the audio nodes will be new every time
            nodeType: type,
            order: idx, // FIXME: does this break when nodes changed, reordered, multiple of same type? Consider using a cumulative "createdOrder" (based on initialization from the script, not every rebuild)
            parentMacro: node.parentMacro,
          };
          // the parentMacro property is a cracked web audio node which happens to be a macro
          // this is used to determine if the node should appear with the normal node controls,
          // or separated as in the channel strip component.
          // since the AudioNodes are ephemeral, but the TrackNode models persist to the database
          // we need to save a boolean telling the data model that it expects to have a channel strip maco audio node
          trackNodeAttrs.isChannelStripChild =
            trackNodeAttrs.parentMacro &&
            trackNodeAttrs.parentMacro.getType() === 'channelStrip';
          // ID is necessary for client-side relationships between track-node and track-controller
          // so we're using the audio node's UUID at time of creation.
          // however when a trackNode is found and updated in the if block above,
          // it will update with a new audio node uuid and this id value will be outdated
          // so theyre just a representation of the state of original creation
          trackNodeAttrs = {
            id: `${uuid}`,
            ...trackNodeAttrs,
          };

          let trackNode = this.trackNodes.createRecord(trackNodeAttrs);

          // stash the userSettingsForControl on the trackNode
          // So it can be read by trackControls to set their default values
          // update track control with user default values
          trackNode.userSettingsForControl = userSettingsForControl;
        }
      });
    return this.trackNodes;
  }

  /**
   *
   * Loop over trackNode records
   * Search for a matching TrackControl
   *  if found, update it with the trackNode
   *  else create a new TrackControl for the node
   *
   * Then apply the values from the track controls to the audio nodes
   */
  setupTrackControls(trackNodes: TrackNodeModel[]): void {
    // Controls hold the user's saved state (values, ranges, interface, multislider steps), so linking
    // them to freshly built nodes must never overwrite it: each node takes the control that already
    // exists for it, and only a missing control is created (with defaults).
    const scriptOk = !this.initScript?.alert;
    let pool = this.trackControls.filter((c) => !c.isDeleted);

    const take = (match: (c: TrackControlModel) => boolean): TrackControlModel | undefined => {
      const found = pool.find(match);
      if (found) pool = pool.filter((c) => c !== found);
      return found;
    };

    // phase 1: controls that point exactly at a node (type, attribute and creation order)
    const needs: { node: TrackNodeModel; attr: string }[] = [];
    const linked = new Map<TrackNodeModel, TrackControlModel[]>();
    trackNodes.forEach((node) => {
      const controls: TrackControlModel[] = [];
      linked.set(node, controls);
      TrackNodeModel.controlAttrsFor(node.nodeType).forEach((attr) => {
        const exact = take((c) => c.nodeType === node.nodeType && c.nodeAttr === attr && c.nodeOrder === node.order);
        if (exact) controls.push(exact);
        else needs.push({ node, attr });
      });
    });

    // phase 2: the script changed (a node was inserted/removed), so creation order moved:
    // adopt the unclaimed control of the same type and attribute, lowest order first
    const unresolved: typeof needs = [];
    needs.forEach(({ node, attr }) => {
      const candidates = pool
        .filter((c) => c.nodeType === node.nodeType && c.nodeAttr === attr)
        .sort(byKey('nodeOrder'));
      const adopted = candidates[0];
      if (adopted) {
        pool = pool.filter((c) => c !== adopted);
        adopted.nodeOrder = node.order; // heal the stored order; the user's values stay
        adopted.saveTrackControl.perform();
        linked.get(node)!.push(adopted);
      } else {
        unresolved.push({ node, attr });
      }
    });

    // phase 3: nothing exists for these yet, so create them
    unresolved.forEach(({ node, attr }) => {
      const params = node.defaultControlParams(attr);
      if (!params) return;
      const created = this.store.createRecord('track-control', params) as TrackControlModel;
      created.saveTrackControl.perform();
      linked.get(node)!.push(created);
    });

    // link, and give every sampler node the file for its slot (an empty client-only record if none yet)
    trackNodes.forEach((node) => {
      linked.get(node)!.forEach((control) => control.set('trackNode', node));

      if (node.nodeType === 'sampler') {
        const filepathControl = FilepathControlModel.findOrCreateWith({ track: this, slot: node.orderOfType });
        filepathControl.set('trackNode', node);
        node.filepathControl = filepathControl;
      }

      node.updateDefaultValue();
    });

    // Controls left over belong to nodes the script no longer creates. Only discard them when the script
    // ran cleanly: a script error also leaves nodes missing, and the user's settings must survive that.
    if (scriptOk) {
      pool.forEach((control) => {
        if (control.isNew) this.store.unloadRecord(control);
        else control.destroyRecord();
      });

      const samplerCount = trackNodes.filter((n) => n.nodeType === 'sampler').length;
      [...this.filepathControls].forEach((control) => {
        // keep any control that has a file; drop client-only empty ones for slots that no longer exist
        if (!control.controlValue && control.isNew && control.nodeOrder >= samplerCount) {
          this.store.unloadRecord(control);
        }
      });
    }

    // Apply attributes to all trackNodes
    const attrsForNodes = TrackControlModel.getAttrsForNodes(this.trackControls, undefined, undefined);

    this.trackNodes.forEach((trackNode) => {
      trackNode.delinkControlsForDeadNodes();

      const attrs = attrsForNodes[trackNode.uniqueSelector];
      if (attrs) {
        applyAttrs(trackNode.uniqueSelector, attrs);
      }
    });
  }

  // Position to resume a sequence's loop at: -1 means "not started yet" (the first step is index 0).
  loopIndexFor(sequenceLength: number): number {
    const stepIndex = this.project.stepIndex;
    return typeof stepIndex === 'number' && stepIndex >= 0 && sequenceLength > 0
      ? stepIndex % sequenceLength
      : -1;
  }

  // One step listener per sequence. They share the track's stable selector, so a single unbind
  // (unbindAndRemoveCrackedNodes / unbindFromSequencer) removes all of them.
  bindToSequencer() {
    this.sortedSequences.forEach((sequence, sequenceIndex) => {
      const steps = sequence.sequence;
      bindToLoopStep(
        this.stableSelector,
        (index, data, array) => this.onStepCallback(index, data, array, sequenceIndex),
        steps,
        { loopIndex: this.loopIndexFor(steps.length) }
      );
    });
  }

  unbindAndRemoveCrackedNodes() {
    unbindFromSequencer(this.stableSelector);
    __(this.stableSelector).remove();
  }

  // Called by the loop on every step of one of this track's sequences. Index 0 is the primary sequence,
  // which drives the track's step display (and the project's, for the master track).
  onStepCallback(index, data, array, sequenceIndex = 0) {
    if (this.isDeleted || this.isDestroying || this.isDestroyed) {
      debugLog('track', `step callback on removed track ${this.id}; ignoring`);
      return;
    }
    const sequences = this.sortedSequences;
    const sequence = sequences[sequenceIndex];
    if (!sequence) return;

    if (sequenceIndex === 0) {
      this.stepIndex = index;

      if (this.isMaster) {
        this.project.stepIndex = index;
      }
    }

    // before calling the user's onstepScript, pass the current values of this sequence's track-controls
    // to the their respective track-nodes. Sampler nodes are a special case, since they get
    // rebuilt on each play, so they need to be passed their params in the .start() call (see below).
    const controls = this.trackControls.filter((control) => control.sequenceRecord === sequence);
    const attrsForNodes = TrackControlModel.getAttrsForNodes(controls, index, sequence.sequence);

    this.trackNodes.forEach((trackNode) => {
      const attrs = attrsForNodes[trackNode.uniqueSelector];
      if (attrs) {
        applyAttrs(trackNode.uniqueSelector, attrs);
      }
    });
    this.onstepScript.invokeFunctionRef(index, data, array, sequenceIndex);
  }

  // TODO: create property "trackCreatedOrder" and use that here
  // so weirdness doesnt happen when track order changes
  // The server renumbers `order` when a track is deleted, but nodes keep the class they were
  // built with. Anything that must find *this track's* nodes later (loop binding, teardown)
  // therefore uses the id, which never changes. `classSelector` stays for users' scripts.
  get stableSelector() {
    return `.track-id-${this.id}`;
  }

  get classSelector() {
    const indicator = this.isMaster ? 'master' : this.order;
    return `.track-${indicator}`;
  }

  get scriptScope() {
    // sampler speed is a special case because they rebuild on every play,
    // so we need to ensure the attrs from the UI controls get applied after .start()
    // this is not an issue for non sampler nodes.
    const sourceNodes = this.sourceNodeRecords;
    const adsrNodes = this.adsrNodes;
    const controls = TrackControlModel.serializeForScript(
      this.trackNodes,
      this.stepIndex
    );

    const playSourceNode = (sourceNode, attrs) => {
      __(sourceNode.uniqueSelector)
        .stop()
        .attr({
          ...controls.find((item) => item.nodeUUID === sourceNode.nodeUUID), //NOTE: explicitly using the key nodeUUID instead of `uuid` because the latter will mess up the native audio node when attrs applied
          ...attrs,
        })
        .start();
    };

    const stableSelector = this.stableSelector;

    return {
      files: this.downloadedFilepaths,
      filepath: this.downloadedFilepaths[0],
      id: this.id,
      trackSelector: this.classSelector,
      stepMs: this.project.loopInterval, // length of one step in milliseconds (from the bpm)
      sequences: this.sortedSequences.map((sequence) => sequence.sequence), // every sequence's steps, primary first
      controls: controls, // the value of the controls at this current step
      sliders: this.trackControlData,
      select() {
        let selector = typeof arguments[0] === 'string' ? arguments[0] : null;
        if (selector) {
          return __(`${selector} ${stableSelector}`);
        }
        return __(stableSelector);
      },
      // These methods may get replaced by the track('selector').play() style of API
      playSourceNodes(attrs) {
        if (sourceNodes) {
          sourceNodes.forEach((sourceNode) => playSourceNode(sourceNode, attrs));
        }
      },
      // plays just the n-th source node (e.g. one pad of a multi-sample kit)
      playSourceNode(index, attrs) {
        const sourceNode = sourceNodes?.[index];
        if (sourceNode) {
          playSourceNode(sourceNode, attrs);
        }
      },
      playADSRNodes() {
        adsrNodes.forEach((adsrNode) => {
          __(adsrNode.uniqueSelector).adsr('trigger', 'fast');
        });
      },
      play(attrs) {
        this.playADSRNodes();
        this.playSourceNodes(attrs);
        // TODO: rampNodes, LFONodes
      },
      stop() {
        sourceNodes.forEach((sourceNode) => {
          __(sourceNode.uniqueSelector).stop();
        });
      },
    };
  }

  /**
   * State management methods
   * TODO: implement UI to represent track state 
   */
  
  isInState(state: TrackState): boolean {
    return this.state === state;
  }
  
  setState(newState: TrackState): void {
    this.state = newState;
  }
  
  isCreated(): boolean {
    return this.state === TrackState.CREATED;
  }
  
  isSaved(): boolean {
    return this.state === TrackState.SAVED;
  }
  
  isSetup(): boolean {
    return this.state === TrackState.SETUP;
  }
  
  isReady(): boolean {
    return this.state === TrackState.READY;
  }
  
  hasError(): boolean {
    return this.state === TrackState.ERROR;
  }

  // FIXME: move this to the filepathControl record?
}
