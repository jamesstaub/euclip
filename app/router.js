import EmberRouter from '@ember/routing/router';
import config from './config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  this.route('user', { path: '/' }, function () {
    this.route('new');
    this.route('creator', { path: '/:uid' }, function() {
      this.route('project', { path: '/:slug' });
      this.route('projects');
    });
  });
});
