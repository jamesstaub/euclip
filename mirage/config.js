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

  this.get('/v1/users/:id', (schema) => {
    const user = schema.users.first();
    return user;
  });

  this.post('/login', (schema) => {
    const user = schema.users.first();
    return user;
  });
  
  this.delete('/logout', () => {
    return {}
  });

  this.get('/v1/users/:id/projects', (schema) => {
    return schema.projects.all();
  });
  
  this.post('/v1/projects');
  this.get('/v1/projects/:slug', (schema, { params }) => {
    return schema.projects.findBy({slug:params.slug});
  });

  this.patch('/v1/projects/:slug');
  this.del('/v1/projects/:slug');

  this.get('/v1/projects/:slug/tracks');
  this.post('/v1/projects/:slug/tracks', (schema, request) => {
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
        hits: 4,
        steps: 8,
        offset: 0,
        filepath: '/SequentialCircuits%20Tom/kick.mp3', //todo, generative default audio?
      }
    }
    
    trackAttrs.project = schema.projects.findBy({'slug': request.params.slug});

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

  this.patch('/v1/tracks/:id');

  this.get('/v1/projects/:slug/tracks/:id', (schema, { params }) => {
    return schema.tracks.find(params.id);
  });

  this.del('/v1/tracks/:id', async ({ tracks }, request) => {
    const id = request.params.id;
    const track = tracks.find(id);
    track.destroy();
    track.initScript && track.initScript.destroy();
    track.onstepScript && track.onstepScript.destroy();
    // TODO also delete trackControls!
    track.trackNodes && track.trackNodes.destroy();
    return track;
  });

  // this.get('/v1/machines/') // get a list of drum machines)
  // this.get('/v1/projects/:slug/tracks/machine'); // create many tracks for each sound of a drum machine

  this.del('/v1/track-nodes/:id', async ({ trackNodes }, request) => {
    const id = request.params.id;
    const trackNode = trackNodes.find(id);
    trackNode.trackControls.destroy();
    return trackNode;
  });

  this.post('/v1/track-controls', (schema, request) => {
    console.error('NOT IMLPEMENTED: create track controls');
  });
  
  this.patch('/v1/track-controls/:id');
  this.patch('/v1/init-scripts/:id');
  this.patch('/v1/onstep-scripts/:id');
  this.del('/v1/track-controls/:id');
  this.del('/v1/init-scripts/:id');
  this.del('/v1/onstep-scripts/:id');

  this.get('/v1/presets', (schema) => {
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
