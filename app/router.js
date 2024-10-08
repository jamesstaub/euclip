import EmberRouter from '@embroider/router';
import config from 'euclip/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('user', { path: '/' }, function () {
    this.route('my-projects', { path: '/' });
    this.route('new');
    this.route('creator', { path: '/:user_id' }, function () {
      this.route('project', { path: '/:slug' }, function () {
        this.route('track', { path: 'track/:track_id' });
      });
      this.route('projects');
      this.route('project-error');
    });
  });
  this.route('login');
  this.route('signup');
  this.route('about');
  this.route('user-error');
});
