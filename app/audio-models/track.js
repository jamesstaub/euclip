import Model from '@ember-data/model';
import Evented from '@ember/object/evented';

import ENV from '../config/environment';
import { difference } from '../utils/arrays-equal';
import { addCustomSelector, bindSourcenodeToLoopStep, getCrackedNode, unbindFromSequencer } from '../utils/cracked';
import filterNumericAttrs from '../utils/filter-numeric-attrs';
import { tracked } from '@glimmer/tracking';
import TrackControlModel from '../models/track-control';

export default class TrackAudioModel extends Model.extend(Evented) {  
  @tracked nodeToVisualize;

  // serialize 2d array of track control values to use in scripts
  get trackControlData() {
    return this.get('trackControls').map((trackControl) => {
      // FIXME when user switches a control from single to multi, both values will be truthy/
      // need an 'activeValue' that switches with it
      if (trackControl.get('controlArrayValue.length')) {
        return trackControl.get('controlArrayValue');
      }
      return trackControl.get('controlValue');
    });
  }

  /**
   * 
   */
  setNodeToVisualize() {
    const firstVisualizableNode = this.trackAudioNodes.find((audioNode) => {
      const type = audioNode[audioNode.uuid];
      return type === 'compressor' || type === 'gain';
    });
    const node = __._getNode(firstVisualizableNode?.uuid)?.getNativeNode();
    this.nodeToVisualize = node;
  }

  setupAudioFromScripts(unbindBeforeCreate = true) {
    // array to store audio node uuids created in this track's script
    // not to be confused with trackNode models, 
    // { uuid: type, atts: { filename: '...', speed: 1} }
    this.set('trackAudioNodes', []); 
    this.channelStripAudioNode = null;

    // cracked.onCreateNode was added to the Cracked library to give access to the AudioNode object upon creation
    // this callback gets called when a user creates cracked audio nodes in the script editor ui
    // macro components should not get individual ui controls
    __.onCreateNode = (node, type, creationParams, userSettings) => {      
      // FIXME not sure why node.isMacroComponent() is false for channelStrip
      if (type === 'channelStrip') {
        // store channelStripAudioNode
        this.channelStripAudioNode = node;
      }
      
      if (!node.isMacroComponent() && ENV.APP.supportedAudioNodes.indexOf(type) > -1) {
        // add a `track-id` class to every node created so it can be properly cleaned up
        addCustomSelector(node, `.track-${this.order}`);
        addCustomSelector(node, `${type} .track-${this.order}`);
      
        const trackNode = {};
        const uuid = node.getUUID();
        trackNode[uuid] = type;
        trackNode.uuid = uuid;
        trackNode.userSettings = userSettings; // save the initialization attributes so they can be used to update TrackControl's min/max/default param values
        this.trackAudioNodes.push(trackNode);
        // 'ui' is a custom attr that users can set in the script editor when defining a cracked audio node
        // new AudioNode objects won't get initialized with it by default so we hack it on here
        // see cracked.js line 330
        if (userSettings?.ui) {
          node.ui = userSettings.ui;
        }
      }
    }

    if (unbindBeforeCreate) {
      this.unbindAndRemoveCrackedNodes();
    }

     // run script to create audio nodes
    this.get('initScript').content.invokeFunctionRef();

    // nullify this callback after creating track nodes to prevent it from getting called outside of this track
    __.onCreateNode = null;
    this.pushMacroNodes();
    this.findOrCreateTrackNodeRecords();
    this.cleanupNodeRecords();
    this.setupTrackControls();

    if (this.currentSequence) {
      if(this.trackNodes.length) {
        this.sourceNodeRecords.forEach((source) => {
          this.bindToSequencer(source);
        });
      } else {
        console.error('no track nodes to bind to sequencer')
      }
    }

    if (this.isMaster) {
      this.setNodeToVisualize();
    }
  }


  /**
   * Currently the only audio node that gets trackNode models for it's individual child nodes are channelStrips
   * since channelStrip is a special case managed by euclip.
   * 
   * the channelStrip macro encapsulates the main volume+pan sliders for a track
   * 
   * This function selects channelStrips child audio nodes and push them into the array that findOrCreate deals with,
   * ensuring they track control records get created for them
   * **/
  pushMacroNodes() {
    if (this.channelStripAudioNode) {      
      this
        .channelStripAudioNode
        .getNativeNode()
        .flat()
        .forEach((node)=> {         
          // unlike in onCreateNode, here we're mapping raw web audio nodes, not cracked nodes,
          // so the properties are a little different, but we map them so they can be consumed by findOrCreate
          const trackNode = {}
          const type = {
            'GainNode': 'gain',
            'StereoPannerNode': 'panner'
          }[node.constructor.name];

          trackNode[node.uuid] = type;
          trackNode.parentMacro = this.channelStripAudioNode;
          trackNode.uuid = node.uuid;
          this.trackAudioNodes.push(trackNode);
      });
    }    
  }

  /**
   * find-or-create TrackNode records for each audio node object
   * created on this track
   * 
   * this method assumes that cracked audio nodes (which are wrappers around web audio AudioNode objects) were created by the script, 
   * and we now need to create or update TrackNode ember data records.
   * 
   * TrackNode records are ephemeral, so trackNode.save is never called. 
   * TrackControls however, get created on the server, and returned to the client where they are associated with the TrackNode records
   * 
   * FIXME: how to re-order if user adds new nodes between existing ones?
   *
   */
  findOrCreateTrackNodeRecords() {
    // trackNode records already created for this track
    let existingtrackNodes = this.trackNodes.sortBy('order');
    
    // map over audio node objects created in this track's script
    // to find or create corresponding trackNode model records 
    this.trackAudioNodes.forEach((node, idx) => {
      const [uuid, type] = Object.entries(node)[0];
      if (getCrackedNode(uuid)) {
        // a `ui` attribute might have been defined in the cracked node definition
        const userDefinedInterfaceName = getCrackedNode(uuid).ui;
  
        // grab the attributes passed in to the initialization of a cracked node that will be used to set default state of track controls (eg. frequency, gain, speed etc.)
        const userSettingsForControl = filterNumericAttrs(node.userSettings);
        let nodesOfThisType = existingtrackNodes.filterBy('nodeType', type);
        //nodes are ordered by index, so take the first one of it's type
        let trackNode = nodesOfThisType.shift();
  
        let trackNodeAttrs = {
          nodeUUID: uuid, // always update uuid since the audio nodes will be new every time
          nodeType: type,
          order: idx,
          parentMacro: node.parentMacro,
          userDefinedInterfaceName // get the custom ui saved on the AudioNode, which was defined by the user
        };
  
        // the parentMacro property is a cracked web audio node which happens to be a macro 
        // this is used to determine if the node should appear with the normal node controls, 
        // or separated as in the channel strip component. 
        // since the AudioNodes are ephemeral, but the TrackNode models persist to the database
        // we need to save a boolean telling the data model that it expects to have a channel strip maco audio node 
        trackNodeAttrs.isChannelStripChild = trackNodeAttrs.parentMacro && trackNodeAttrs.parentMacro.getType() === 'channelStrip';
  
        if (trackNode) {
          // then remove it from the possible future choices in existingtrackNodes
          existingtrackNodes = existingtrackNodes.rejectBy('nodeUUID', trackNode.nodeUUID);
          trackNode.setProperties(trackNodeAttrs);
        } else {
          // ID is necessary for client-side relationships between track-node and track-controller
          // so we're using the audio node's UUID at time of creation.
          // however when a trackNode is found and updated in the if block above, 
          // it will update with a new audio node uuid and this id value will be outdated
          // so theyre just a representation of the state of original creation
          trackNodeAttrs = {
            id: `${uuid}`,
            ...trackNodeAttrs
          }
          trackNode = this.trackNodes.createRecord(trackNodeAttrs);
        }
  
        // if the `ui` attribute was changed in the script editor, update the interfaceName of track-controls
        trackNode.updateUserDefinedInterfaceName(userDefinedInterfaceName);
        // update track control with user default values
        trackNode.updateDefaultValue(userSettingsForControl);
      }
    });
  }

  /**
   * if a node was removed by user, the trackAudioNodes array will be without
   * it at this point.
   * so make sure we delete it from the store
   */
   cleanupNodeRecords() {
    const existingNodeRecords = this.trackNodes.map((tn) => tn.get('nodeUUID'));
    const existingAudioNodes = this.trackAudioNodes.map((tan) => tan.uuid);
    const nodeUUIDsToDelete = difference(existingNodeRecords, existingAudioNodes);
    nodeUUIDsToDelete.forEach((uuid) => {
      const trackNode = this.store.peekAll('track-node').findBy('nodeUUID', uuid);
      trackNode.trackControls.forEach((trackControl) => {
        trackControl.awaitAndDestroy.perform();
      });
      trackNode.deleteRecord();
    });
  }

  /**
   * Manually manage the relationships between db-persisted track-controls
   * and locally ephemeral track-nodes 
   */
  setupTrackControls() {
    this.trackControls
      .filter((trackControl) => trackControl.get('track.id') === this.id)
      .forEach((trackControl) => {
        // TODO find the existing trackNode this control belongs to and push to collection
        // infer based on type, attr and order
        
        const nodeForControl = this.trackNodes
          .filterBy('nodeType', trackControl.nodeType)
          .findBy('order', trackControl.nodeOrder);

        // set the realtion on the control to keep ember-data happy
        trackControl.set('trackNode', nodeForControl);

        // then push the control to the node's relation array
        nodeForControl?.trackControls.pushObject(trackControl);
      });

    // call method (defined on tracknode model) to validate if track node has proper controls
    // if not create controls for node
    this.trackNodes.forEach((trackNode) => {
      // naively assume that if any trackControls exist, 
      // all proper andnecessary trackControls exist for this node
      // TODO: better validation
      if (trackNode.trackControls.length === 0) {
        trackNode.createTrackControls();
      }
    });
  }

  bindToSequencer(trackNode) {
    console.log(trackNode.uniqueSelector);
    let onStepCallback = this.onStepCallback.bind(this);
    // TODO: create a generalized "source node" selector to support oscillators, sampler or custom source macros
    bindSourcenodeToLoopStep(trackNode.uniqueSelector, onStepCallback, this.currentSequence.sequence);
  }

  unbindAndRemoveCrackedNodes() {
    // FIXME: replace with "samplerNode" to account for oscillators etc
    if (this.samplerNode?.uniqueSelector) {
      unbindFromSequencer(this.samplerNode.uniqueSelector);
    }
    __(`.track-${this.order}`).remove();
  }
  
  onStepCallback(index, data, array) {
    this.set('stepIndex', index);

    // before calling the user's onstepScript, pass the current values of all track-controls
    // to the their respective track-nodes. Sampler nodes are a special case, since they get
    // rebuilt on each play, so they need to be passed their params in the .start() call (see below).
    this.trackControls.forEach((trackControl) => {
      trackControl.setAttrOnTrackStep(index);
    });
  
    // FIXME: ideally this would not be a proxy, so .content not used
    this.get('onstepScript').content.invokeFunctionRef(index, data, array);

  }

  get scriptScope() {
    // sampler speed is a special case because they rebuild on every play, 
    // so we need to ensure the attrs from the UI controls get applied after .start()
    // this is not an issue for non sampler nodes.
    // If an LFO is modulating the sampler speed, the speed controls will be ignored
    // TODO: It may be possible to multiply the values of the LFO and trackcontrols
    
    const lfoForSamplerSpeed = this.trackNodes.filterBy('nodeType', 'lfo')
      .map((trackNode) => getCrackedNode(trackNode.nodeUUID))
      .find((crackedNode) => crackedNode?.isModulatorType() === 'speed');
      
    // const samplerNode = getCrackedNode(this.trackNodes.findBy('nodeType', 'sampler')?.nodeUUID);
    const samplerNode = this.samplerNode;
    const controls = TrackControlModel.serializeForScript(this.trackNodes, this.stepIndex);

    // there will probably always be a speed control if there's a sampler
    // samplerAttrs.speed = speedControl.setAttrOnTrackStep(this.stepIndex);
    // samplerAttrs.start = startControl.setAttrOnTrackStep(this.stepIndex);
    // samplerAttrs.end = endControl.setAttrOnTrackStep(this.stepIndex);

    return {
      filepath: this.filepathUrl,
      id: this.id,
      controls: controls,
      trackSelector: `.track-${this.order}`,

      // trackControls: this.trackControls.map((trackControl) => {
      //   return {
      //     nodeSelector: trackControl.nodeType,
      //     control: trackControl.nodeAttr,
      //     value(index) {
      //       return trackControl.setAttrOnTrackStep(index);
      //     }
      //   }
      // }),
      
      // TODO (maybe) Generalize playSample this to try to play anything the user may want on step
      // (ADSR, LFO, ramp)
      playSample() {
        if (samplerNode) {
          __(samplerNode.uniqueSelector).stop().attr({
            speed: this.controls[0].speed, 
            start: this.controls[0].start, 
            end: this.controls[0].end,
          }).start();
        } else {
          throw "You tried to use playSample() but do not have a sampler defined."
        }
      },
      sliders: this.trackControlData
    };
  } 
}