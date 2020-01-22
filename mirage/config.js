const controlsForNode = function(nodeType) {
  switch (nodeType) {
    case 'gain':
      return ['gain'];
    case 'sampler':
      return ['speed'];
    case ('lowpass' || 'highpass' || 'bandpass' || 'allpasss', 'notch'):
      return ['frequency', 'q'];
    case ('lowshelf' || 'highshelf' || 'peaking'):
      return ['frequency', 'q', 'gain'];
    case 'reverb':
      return ['seconds', 'decay'];
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

const createTrackControls = function (trackNode) {
  const controlAttrs = controlsForNode(trackNode.nodeType);
  return controlAttrs.map((attr) => {
    return trackNode.createTrackControl({ 
      nodeAttr: attr, 
      interfaceName: 'slider'  //TODO parse from class in node definition 
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
  this.post('/projects/:slug/tracks');
  this.patch('/tracks/:id');
  this.del('/tracks/:id', async ({ tracks }, request) => {
    let id = request.params.id;
    let track = tracks.find(id);
     track.destroy();
     track.initScript && track.initScript.destroy();
     track.onstepScript && track.onstepScript.destroy();
     track.trackNode && track.trackNode.destroy();
    return track;
  });

  // this.get('/machines/') // get a list of drum machines)
  // this.post('/projects/:slug/tracks/machine'); // create many tracks for each sound of a drum machine

  this.post('/track-nodes/', (schema, { requestBody }) => {
    const attrs = JSON.parse(requestBody).data.attributes;
    const nodeType = attrs['node-type'];
    const order = attrs.order;
    
    const trackNode = schema.trackNodes.create({ nodeType, order});
    createTrackControls(trackNode);
    return trackNode;
  });

  this.passthrough('https://storage.googleapis.com/**');
  this.passthrough('/assets/**');
  this.pretender.get('/*passthrough', this.pretender.passthrough);


  // These comments are here to help you get started. Feel free to delete them.

  /*
    Config (with defaults).

    Note: these only affect routes defined *after* them!
  */

  // this.urlPrefix = '';    // make this `http://localhost:8080`, for example, if your API is on a different server
  // this.namespace = '';    // make this `/api`, for example, if your API is namespaced
  // this.timing = 400;      // delay for each request, automatically set to 0 during testing

  /*
    Shorthand cheatsheet:

    this.get('/posts');
    this.post('/posts');
    this.get('/posts/:id');
    this.put('/posts/:id'); // or this.patch
    this.del('/posts/:id');

    https://www.ember-cli-mirage.com/docs/route-handlers/shorthands
  */
}
