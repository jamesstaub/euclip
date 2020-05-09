/* code to be moved to server  */
const controlsForNode = function(nodeType) {
  switch (nodeType) {
    case 'gain':
      return ['gain'];
    case 'panner':
      return ['pan'];
    case 'sampler':
      return ['speed'];
    case 'lowpass' || 'highpass' || 'bandpass' || 'allpasss' || 'notch':
      return ['frequency', 'q'];
    case 'lowshelf' || 'highshelf' || 'peaking':
      return ['frequency', 'q', 'gain'];
    case 'reverb':
      return ['decay', 'reverse'];
    case 'delay':
      return ['delay', 'damping', 'feedback', 'cutoff', 'frequency'];
    case 'bitcrusher':
      return ['frequency', 'bits'];
    case 'overdrive':
      return ['drive', 'color', 'postCut'];
    case 'ring':
      return ['distortion', 'frequency'];
    case 'comb':
      return ['delay', 'damping', 'cutoff', 'feedback'];
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
  }
  return paramDefaults;
}

const createTrackControls = function (trackNode) {  
  const controlAttrs = controlsForNode(trackNode.nodeType);
  return controlAttrs.map((controlAttr) => {
    const defaults = defaultForAttr(controlAttr);
    defaults.controlValue = defaults.defaultValue;
    // NOTE API should validate interface names and note types on track controls       
    return trackNode.createTrackControl({ 
      nodeAttr: controlAttr, 
      interfaceName: trackNode.defaultControlInterface || 'slider', // all controls for 
      controlArrayValue: [], // api must initialize this whenever a multislider is created
      ...defaults
    });
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
  this.post('/projects/:slug/tracks', (schema) => {
    // TODO implement different track types (euclidean, )
    // Also use the factory here instead of hardcode
    const initScriptAttrs = this.create('init-script').attrs
    const onstepScriptAttrs = this.create('onstep-script').attrs

    const track = schema.tracks.create({
      hits: 0,
      steps: 8,
      offset: '',
      filepath: '/SequentialCircuits%20Tom/kick.mp3',
    });
    track.createInitScript({
      ...initScriptAttrs
    });
    track.createOnstepScript({
      ...onstepScriptAttrs
    });
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

  this.post('/track-nodes/', (schema, { requestBody }) => {
    const attrs = JSON.parse(requestBody).data.attributes;
    // FIXME: any reason not to just create the node with all options instead of plucking them out?
    const nodeType = attrs['node-type'];
    const order = attrs.order;
    const defaultControlInterface = attrs['default-control-interface'];

    const trackNode = schema.trackNodes.create({ nodeType, order, defaultControlInterface});
    const trackControls = createTrackControls(trackNode);
    trackControls.forEach((control)=> control.save());
    return trackNode;
  });

  this.del('/track-nodes/:id', async ({ trackNodes }, request) => {
    const id = request.params.id;
    const trackNode = trackNodes.find(id);
    trackNode.trackControls.destroy();
    return trackNode;
  });

  this.patch('/track-controls/:id');

  this.patch('init-scripts/:id');
  this.patch('onstep-scripts/:id');

  this.passthrough('https://storage.googleapis.com/**');
  this.passthrough('https://drumserver.herokuapp.com');
  this.passthrough('https://drumserver.herokuapp.com/**');
  this.passthrough('http://127.0.0.1:8000/**');
  this.passthrough('http://127.0.0.1:8000/');
  this.passthrough('/assets/**');
  this.pretender.get('/*passthrough', this.pretender.passthrough);
  
}
