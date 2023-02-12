import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service store;
  @service session;

  constructor() {
    super(...arguments);
    this.session.setup();
  }

  async beforeModel(transition) {
    return super.beforeModel(transition);
  }
}
