import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ENV from 'euclip/config/environment';

export default class ApplicationRoute extends Route {
  @service store;
  @service session;
  @service router;

  constructor() {
    super(...arguments);
    this.session.setup();
  }

  async beforeModel(transition) {

    return super.beforeModel(transition);
  }
}
