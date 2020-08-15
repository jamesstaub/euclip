import Model from '@ember-data/model';
import Evented from '@ember/object/evented';
import ENV from '../config/environment';
import { task } from "ember-concurrency-decorators";
import { waitForProperty } from 'ember-concurrency';
import filterNumericAttrs from '../utils/filter-numeric-attrs';

export default class TrackAudioModel extends Model.extend(Evented) {  

  // getters to expose data to the init and onstep script scopes for user
  get samplerSelector() {
    return `sampler .track-${this.id}`;
  }

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

  bindProjectEvents(project, initScript) {
    // project and initScript are awaited on the route
    // so this event can be synchronous
    // FIXME: properly unbind on delete and don't rebind 
    if(!this.isBoundInitTracks) {
      project.on('initTracks', () => {
        if (!this.isDeleted) {
          this.setupAudioFromScripts(initScript);
        }
        this.set('isBoundInitTracks', true);
      });
    }
  }

  setupAudioFromScripts(initScript) {
    // array to store audio node uuids created in this track's script
    // not to be confused with trackNode models, 
    // { uuid: type, atts: { filename: '...', speed: 1} } 
    this.set('trackAudioNodes', []); 

    // cracked._onCreateNode was added to the Cracked library to give access to the AudioNode object upon creation
    // this callback gets called when a user creates cracked audio nodes in the script editor ui
    // macro components should not get individual ui controls
    __.onCreateNode = (node, type, creationParams, userSettings) => {
      // add a track-id class to every node created so it can be properly cleaned up
      let existingClass = creationParams.settings.class;
      creationParams.settings.class = `${existingClass ? existingClass + ',' : ''}track-${this.id}`
      
      // FIXME not sure why node.isMacroComponent() is false for channelStrip 
      if (type === 'channelStrip') {
        this.channelStripAudioNode = node;
      } else if (!node.isMacroComponent() && ENV.APP.supportedAudioNodes.indexOf(type) > -1) {        
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
    this.unbindAndRemoveCrackedNodes();

     // run script to create audio nodes
     
    initScript.functionRef();

    // nullify this callback after creating track nodes to prevent it from getting called outside of this track
    __.onCreateNode = null;

    this.pushMacroNodes();
    this.findOrCreateTrackNodeRecords();
    this.cleanupNodeRecords();
    this.bindTrackControls();
    this.bindToSequencer();
  }


  /**
   * Currently the only node that gets trackNode models for it's individual child nodes are channelStrips
   * since channelStrip is a special case managed by euclip
   * 
   * pull out the child nodes and push them into the array that findOrCreate deals with
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
          this.trackAudioNodes.push(trackNode);
      });
    }    
  }

  /**
   * find-or-create TrackNode records for each audio node object
   * created on this track
   * 
   * this method assumes that cracked audio nodes were created by the script, 
   * and we now need to create or update TrackNode ember data records.
   * 
   * 
   * 
   * 
   * FIXME: how to re-order if user adds new nodes between existing ones?
   */
  findOrCreateTrackNodeRecords() {
    // trackNode records already created for this track
    let existingtrackNodes = this.trackNodes.sortBy('order');
    
    // map over audio node objects created in this track's script
    // to find or create corresponding trackNode model records 
    this.trackAudioNodes.forEach((node, idx) => {
      const [uuid, type] = Object.entries(node)[0];
      const defaultControlInterface =  __._getNode(uuid)?.ui || 'slider'
      
      // grab the attributes passed in to the initialization of a cracked node that will be used to set default state of track controls (eg. frequency, gain, speed etc.)
      const userSettingsForControl = filterNumericAttrs(node.userSettings);
      let nodesOfThisType = existingtrackNodes.filterBy('nodeType', type);
      //nodes are ordered by index, so take the first one of it's type
      let trackNode = nodesOfThisType.shift();

      const trackNodeAttrs = {
        nodeUUID: uuid, // always update uuid since the audio nodes will be new every time
        nodeType: type,
        order: idx,
        parentMacro: node.parentMacro,
        defaultControlInterface // get the custom ui saved on the AudioNode, which was defined by the user
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
        trackNode = this.trackNodes.createRecord(trackNodeAttrs);
      }

      // if the `ui` attribute was changed in the script editor, update the interfaceName of track-controls
      trackNode.updateDefaultControlInterface(defaultControlInterface);
      // update track control with user default values
      trackNode.updateDefaultValue(userSettingsForControl);

      // OPTIMIZE
      // refactor the trackNode endpoint to support a single batch save
      trackNode.save();
    });    
  }

  /**
   * if a node was removed by user, the trackAudioNodes array will be without it
   * so make sure we delete it from the store
   * FIXME: this still leaves orphaned trackNode records, but when duplicating, we might not have the uuid yet?
   */
  cleanupNodeRecords() {
    if (this.trackNodes.length > this.trackAudioNodes.length) {
      console.error('FIXME this is not deleting nodes or controls when they get removed');
      this.trackNodes.forEach((record) => {
        if (!record.nodeUUID || !this.trackAudioNodes.findBy('uuid', record.nodeUUID)) {
          console.log('cleanup record', record.id);
          this.waitAndDestory.perform(record);
        }
      });
    }
  }

  // this gets called when a track is duplicated but the nodes are inFlight,
  // so we check isSaving before trying to destory them.
  @task
  *waitAndDestory(record) {
    yield waitForProperty(this.get('trackNodes'), 'isFulfilled', true);
    yield waitForProperty(record, 'isSaving', false);

    if (record.isDeleted) {
      return record.destroyRecord();     
    }
  }
  
  /**
   * track controls are added/updated to the store after find-or-create track nodes
   * bindTrackEvents causes them to listen to this.trigger('trackStep')
  */
  bindTrackControls() {
    this.get('trackNodes').forEach((trackNode)=>{
      trackNode.get('trackControls').forEach((trackControl)=>{
        trackControl.bindTrackEvents(this);
      })
    })
  }

  bindToSequencer() {
    let onStepCallback = this.onStepCallback.bind(this);
    __(this.samplerSelector).bind(
      'step', // on every crack sequencer step
      onStepCallback, // call this function (bound to component scope)
      this.sequence // passing in array value at position
    );
  }

  unbindAndRemoveCrackedNodes() {
    __(this.samplerSelector).unbind('step');
    __(`.track-${this.id}`).remove();
  }
  
  onStepCallback(index, data, array) {
    //track controls subscribe to trackStep event
    this.set('stepIndex', index);
    this.trigger('trackStep', index);
    // FIXME must trigger track controls first to apply sliders, but they get zapped out 
    // somehow when the function is called
    this.onstepScript.get('functionRef')(index, data, array);
  }

  get scriptScope() {
    // sampler speed is a special case because they rebuild on every play, 
    // so we need to ensure the attrs from the UI controls get applied after .start()
    // this is not an issue for non sampler nodes
    // TODO: same fix for sampler start, end
    // ALSO TODO: how can this be fixed to support LFOs to modulate speed?
    const speedControl = this.get('trackNodes')
      ?.findBy('nodeType', 'sampler')
      ?.get('trackControls')
      ?.findBy('nodeAttr', 'speed');

    return {
      // the track should either have a sampler or an oscillator 
      filepath: this.filepathUrl,
      id: this.id,
      samplerSelector: this.samplerSelector,
      playSample(index) {
        __(this.samplerSelector).stop()
        __(this.samplerSelector).start();
        
        // // HACK see above
        if (speedControl) {
          speedControl.onTrackStep(index);
        }
      },
      sliders: this.trackControlData
    };
  } 
}