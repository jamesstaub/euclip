/* code to be moved to server  */
const paramsForNode = function(nodeType) {
  switch (nodeType) {
    case 'bitcrusher':
      return ['frequency', 'bits'];
    case 'comb':
      return ['delay', 'damping', 'cutoff', 'feedback'];
    case 'delay':
      return ['delay', 'damping', 'feedback', 'cutoff', 'frequency'];
    case 'gain':
      return ['gain'];
    case 'lowpass' || 'highpass' || 'bandpass' || 'allpasss' || 'notch':
      return ['frequency', 'q'];
    case 'lowshelf' || 'highshelf' || 'peaking':
      return ['frequency', 'q', 'gain'];
    case 'overdrive':
      return ['drive', 'color', 'postCut'];
    case 'panner':
      return ['pan'];
    case 'reverb':
      return ['decay', 'reverse'];
    case 'ring':
      return ['distortion', 'frequency'];
    case 'sampler':
      return ['speed', /* 'start', 'end'*/];
    case 'sine' || 'square' || 'triangle' || 'sawtooth':
      return ['frequency'];
    default:
      return [];
  }
}

// TODO refactor this to take attr/node combinations
// (eg. frequency min/max is different for a filter than for an LFO )
const defaultForAttr = function(attr) {
  const paramDefaults = {};
  switch (attr) {
    case 'bits':
      paramDefaults.min = 1;
      paramDefaults.max = 16;
      paramDefaults.defaultValue = 6;
      break;
    case 'color':
      paramDefaults.min = 0;
      paramDefaults.max = 1000;
      paramDefaults.defaultValue = 800;
      break;
    case 'cutoff':
      paramDefaults.min = 0;
      paramDefaults.max = 4000;
      paramDefaults.defaultValue = 1500;
      break;
    case 'damping':
      paramDefaults.min = 0;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 0.84;
      break;
    case 'decay':
      paramDefaults.min = 0;
      paramDefaults.max = 4;
      paramDefaults.defaultValue = 0;
      break;
    case 'delay':
      paramDefaults.min = 0;
      paramDefaults.max = 6;
      paramDefaults.defaultValue = 2;
      break;
    case 'distortion':
      paramDefaults.min = 0;
      paramDefaults.max = 3;
      paramDefaults.defaultValue = 1;
      break;
    case 'drive':
      paramDefaults.min = 0;
      paramDefaults.max = 2;
      paramDefaults.defaultValue = .5;
      break;
    case 'end':
      paramDefaults.min = 0;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 1;
      break;
    case 'feedback':
      paramDefaults.min = 0;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 0.84;
      break;
    case 'frequency':
      paramDefaults.min = 0;
      paramDefaults.max = 10000;
      paramDefaults.defaultValue = 300;
      break;
    case 'gain':
      paramDefaults.min = 0;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 1;
      break;
    case 'pan':
      paramDefaults.min = -1;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 0;
      break;
    case 'postCut':
      paramDefaults.min = 0;
      paramDefaults.max = 5000;
      paramDefaults.defaultValue = 3000;
      break;
    case 'q':
      paramDefaults.min = 0;
      paramDefaults.max = 20;
      paramDefaults.defaultValue = 0;
      break;
    case 'seconds':
      paramDefaults.min = 0;
      paramDefaults.max = 6;
      paramDefaults.defaultValue = 0;
      break;
    case 'speed':
      paramDefaults.min = .125;
      paramDefaults.max = 2;
      paramDefaults.defaultValue = 1; 
      break;
    case 'start':
      paramDefaults.min = 0;
      paramDefaults.max = 1;
      paramDefaults.defaultValue = 0;
      break;
  }
  return paramDefaults;
}

const createTrackControls = function (trackNode) {  
  const controlAttrs = paramsForNode(trackNode['node-type']);
  return controlAttrs.map((controlAttr) => {
    const defaults = defaultForAttr(controlAttr);
    defaults.controlValue = defaults.defaultValue;
    // NOTE API should validate interface names and note types on track controls       
    const trackControl  = trackNode.createTrackControl({
      trackId: trackNode.trackId,
      trackNodeId: trackNode.id,
      nodeAttr: controlAttr, 
      interfaceName: trackNode['default-control-interface'] || 'slider', // all controls for 
      controlArrayValue: [], // api must initialize this whenever a multislider is created
      ...defaults
    });
    trackControl.save(); //maybe dont need?
    return trackControl;
  });
}

export default function() {
  // Hack per https://github.com/kturney/ember-mapbox-gl/issues/53#issuecomment-397417884
  // for decoding array buffers 
  // Note: the below XMLHttpRequest has already been converted to a FakeXMLHttpRequest by pretender
  const origSend = window.XMLHttpRequest.prototype.send;
  window.XMLHttpRequest.prototype.send = function send() {
    origSend.apply(this, arguments);
    const fakeXhr = this; // eslint-disable-line consistent-this
    const realXhr = this._passthroughRequest;
    if (realXhr) {
      realXhr.onload = function (event) {
        if (fakeXhr.responseType !== 'arraybuffer') {
          fakeXhr.response = realXhr.response;
        }
        // dispatch event instead of calling the original to prevent a double call bug
        fakeXhr.dispatchEvent(event);
      };
    }
  };

  this.get('/users/me', (schema) => {
    const user = schema.users.first();
    return user;
  });

  this.get('/users/:id/projects', (schema) => {
    return schema.projects.all();
  });
  
  this.post('/projects');
  this.get('/projects/:slug', (schema, { params }) => {
    return schema.projects.findBy({slug:params.slug});
  });

  this.put('/projects/:slug');
  this.del('/projects/:slug');

  this.get('/projects/:slug/tracks');
  this.post('/projects/:slug/tracks', (schema, request) => {
    let trackAttrs, initScriptAttrs, onstepScriptAttrs, trackNodeAttrs, trackControlAttrs;
    let trackNodeIdMap = {};

    // POST to duplicate an existing track
    if (request.queryParams.duplicateId) {
      let targetTrack = schema.tracks.find(request.queryParams.duplicateId);
      trackAttrs = targetTrack.attrs;
      initScriptAttrs = targetTrack.initScript.attrs;
      onstepScriptAttrs = targetTrack.onstepScript.attrs;

      trackNodeAttrs = targetTrack.trackNodes.models.map(({attrs}) => {
        attrs.trackControlIds = [];
        return attrs;
      });

      // trackControlAttrs will contain the control copied from's nodeID, 
      // which is why we use the trackNodeIdMap to assign the newly created node id later
      trackControlAttrs = targetTrack.trackControls.models.map(({attrs}) => {
        delete attrs.id;
        delete attrs.trackId;
        return attrs;
      });

      trackAttrs.trackNodeIds = [];
      trackAttrs.trackControlIds = [];
      delete trackAttrs.id;
      delete initScriptAttrs.id;
      delete onstepScriptAttrs.id;
    } else {
      // POST to create a new default track
      initScriptAttrs = this.create('init-script').attrs;
      onstepScriptAttrs = this.create('onstep-script').attrs;
      trackAttrs = {
        hits: 1,
        steps: 8,
        offset: 0,
        filepath: '/SequentialCircuits%20Tom/kick.mp3', //todo, generative default audio?
      }
    }

    
    let track = schema.tracks.create(trackAttrs);
    
    track.createInitScript({
      ...initScriptAttrs
    });

    track.createOnstepScript({
      ...onstepScriptAttrs
    });

    if (trackNodeAttrs && trackControlAttrs) {
      trackNodeAttrs.forEach((attrs) => {
        attrs.trackId = track.id;
        let oldNodeId = attrs.id;
        delete attrs.id;

        const newNode = track.createTrackNode(attrs);
        trackNodeIdMap[oldNodeId] = newNode.id;
        newNode.save();

        // let trackControlAttr = trackControlAttrs.findBy('trackNodeId', targetNodeId);
        // delete trackControlAttr.trackNodeId;
        // trackNode.createTrackControl(trackControlAttr);
      });
      
      trackControlAttrs.forEach((attrs) => {
        // use trackNodeIdMap to find the newly created trackNode for this control
        attrs.trackId = track.id;
        const trackNode = schema.trackNodes.find(trackNodeIdMap[attrs.trackNodeId]);
        attrs.trackNodeId = trackNode.id;
        track.createTrackControl(attrs);
      });
    }
    // FIXME track.trackNodeIds contains duplicates, maybe this stems from whatever is causing 500 error on second duplicate
    track.save();
    return track;
  });

  this.patch('/tracks/:id');

  this.get('/projects/:slug/tracks/:id', (schema, { params }) => {
    return schema.tracks.find(params.id);
  });

  this.del('/tracks/:id', async ({ tracks }, request) => {
    const id = request.params.id;
    const track = tracks.find(id);
    track.destroy();
    track.initScript && track.initScript.destroy();
    track.onstepScript && track.onstepScript.destroy();
    // TODO also delete trackControls!
    track.trackNodes && track.trackNodes.destroy();
    return track;
  });

  // this.get('/machines/') // get a list of drum machines)
  // this.post('/projects/:slug/tracks/machine'); // create many tracks for each sound of a drum machine

  this.post('/track-nodes/', async (schema, { requestBody }) => {
    const { attributes, relationships } = JSON.parse(requestBody).data;
    attributes.trackId = relationships.track.data.id;
    const trackNode = schema.trackNodes.create(attributes);
    await trackNode.save();
    const trackControls = createTrackControls(trackNode);
    trackControls.forEach((control)=> control.save());
    return trackNode;
  });
  
  this.patch('/track-nodes/:id');

  this.del('/track-nodes/:id', async ({ trackNodes }, request) => {
    const id = request.params.id;
    const trackNode = trackNodes.find(id);
    trackNode.trackControls.destroy();
    return trackNode;
  });

  this.patch('/track-controls/:id');

  this.patch('init-scripts/:id');
  this.patch('onstep-scripts/:id');

  this.get('/presets', (schema) => {
    return schema.db.presets;
  });

  this.passthrough('https://storage.googleapis.com/**');
  this.passthrough('https://drumserver.herokuapp.com');
  this.passthrough('https://drumserver.herokuapp.com/**');
  this.passthrough('http://127.0.0.1:8000/**');
  this.passthrough('http://127.0.0.1:8000/');
  this.passthrough('/assets/**');
  this.pretender.get('/*passthrough', this.pretender.passthrough);
  
}
