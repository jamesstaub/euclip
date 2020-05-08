import Model from '@ember-data/model';
import Evented from '@ember/object/evented';
import ENV from '../config/environment';

export default class TrackAudioModel extends Model.extend(Evented) {  

  get samplerSelector() {
    return `#${this.id}`;
  }

  bindProjectEvents(project, initScript) {
    // project and initScript are awaited on the route
    // so this event can be synchronous

    // FIXME should this method also call setupAudioFromScripts outright?
    // what should happen when new tracks are added while the project is playing
    project.on('initTracks', () => {
      if (!this.isDeleted) {
        this.setupAudioFromScripts(initScript);
      }
    });
  }

  setupAudioFromScripts(initScript) {
    // array to store audio node uuids created in this track's script
    // not to be confused with trackNode models, 
    // { uuid: type } 
    this.set('trackAudioNodes', []); 


    // _onCreateNode was added to the Cracked library to give access to the AudioNode object upon creation
    __.onCreateNode = (node, type, creationParams, userSettings) => {
      // this callback gets called when a user creates cracked audio nodes in the script editor ui
      // macro components should not get individual ui controls
      
      // FIXME not sure why node.isMacroComponent() is false for channelStrip 
      if (type === 'channelStrip') {
        this.channelStripNode = node;
        
      } else if (!node.isMacroComponent() && ENV.APP.supportedAudioNodes.indexOf(type) > -1) {        
        const trackNode = {}
        const uuid = node.getUUID();
        trackNode[uuid] = type;
        trackNode.uuid = uuid;
        
        this.trackAudioNodes.push(trackNode);

        // 'ui' is a custom attr that users can set in the script editor when defining a cracked audio node
        // new AudioNode objects won't get initialized with it by default so we hack it on here
        // see cracked.js line 330
        if (userSettings?.ui) {
          node.ui = userSettings.ui;
        }
      }
    }

    this.showChannelStrip = false;

    this.unbindTrack();
     // run script to create audio nodes
    initScript.functionRef();


    this.pushMacroNodes();
    this.findOrCreateTrackNodeRecords();
    this.cleanupNodes();
    this.bindTrackControls();
    this.bindToSequencer();
  }


  /**
   * Currently the only node that gets trackNode models for it's individual child nodes are channelStrips
   * since channelStrip is a special case managed by euclip
   * 
   * pull out the child nodeds and push them into the array that findOrCreate deals with
   * **/
  pushMacroNodes() {   
    if (this.channelStripNode) {
      this
        .channelStripNode
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
          trackNode.parentMacro = this.channelStripNode;
          this.trackAudioNodes.push(trackNode);
      });
    }
  }

  /**
   * find-or-create TrackNode records for each audio node object
   * created on this track
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
      const defaultControlInterface =  __._getNode(uuid).ui;

      let nodesOfThisType = existingtrackNodes.filterBy('nodeType', type);
      //nodes are ordered by index, so take the first one of it's type
      let trackNode = nodesOfThisType.shift();
    
      if (trackNode) {
        // then remove it from the possible future choices in existingtrackNodes
        existingtrackNodes = existingtrackNodes.rejectBy('nodeUUID', trackNode.nodeUUID);

        trackNode.setProperties({
          nodeUUID: uuid, // update uuid since the audio nodes will be new every time
          order: idx,
          parentMacro: node.parentMacro
        }); 
        
        if (defaultControlInterface) {
          // if the `ui` attribute was changed in the script editor, update the interfaceName of track-controls
          trackNode.updateDefaultControlInterface(defaultControlInterface);
        }
        return trackNode; // FIXME dont return here, allow node to save below (requries fix for adapter error)
      } else {
        trackNode = this.trackNodes.createRecord({
          nodeUUID: uuid,
          nodeType: type,
          order: idx,
          parentMacro: node.parentMacro,
          defaultControlInterface: __._getNode(uuid).ui || 'slider' // get the custom ui saved on the AudioNode, which was defined by the user
        });
      }
      // OPTIMIZE
      // refactor the trackNode endpoint to support a single batch save
      trackNode.save();
    });    
  }

  /**
   * if a node was removed by user, the trackAudioNodes array will be without it
   * so make sure we delete it from the store
   */
  cleanupNodes() {
    if (this.trackNodes.length > this.trackAudioNodes.length) {
      this.trackNodes.filter((record) => {
        return !this.trackAudioNodes.findBy('uuid', record.nodeUUID);
      }).forEach((record)=> {
        return record.destroyRecord();
      });
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
    __(this.samplerSelector).unbind('step');
    __(this.samplerSelector).bind(
      'step', // on every crack sequencer step
      onStepCallback, // call this function (bound to component scope)
      this.sequence // passing in array value at position
    );
  }

  unbindTrack() {
    __(this.samplerSelector).unbind('step');
    __(this.samplerSelector).remove();
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
    const speedControl = this.get('trackNodes')?.findBy('nodeType', 'sampler')?.get('trackControls')?.findBy('nodeAttr', 'speed');

    return {
      // the track should either have a sampler or an oscillator 
      filepath: this.filepathUrl,
      id: this.id,
      samplerSelector: this.samplerSelector,
      playSample(index) {
        __(this.samplerSelector).stop()
        __(this.samplerSelector).start();
        
        // // HACK see above
        speedControl.onTrackStep(index);
      }
    };
  } 
}