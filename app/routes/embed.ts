import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type Service from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import type SessionService from 'ember-simple-auth/services/session';

export default class EmbedRoute extends Route {
  @service router!: RouterService;
  @service session!: SessionService;
  @service currentUser!: Service;

  async beforeModel() {
    console.log('euclip; embed route!');
    try {
      const discordAuth = await this.session.authenticate('authenticator:discord');
      console.log('euclip; Discord authentication successful:', discordAuth);

      this.router.transitionTo('user.new');
    } catch (error) {
      console.error('euclip; Error during embed route initialization:', error);
      throw new Error('Failed to initialize embed route');
    }
  }  
}
