
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
  this.get('/projects/:slug', (schema, {params}) => {
    return schema.projects.where(params).models[0];
  });

  this.put('/projects/:slug');
  this.del('/projects/:slug');

  this.get('/projects/:slug/tracks');
  this.post('/projects/:slug/tracks');
  this.put('/tracks/:id');
  this.del('/tracks/:id');

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
