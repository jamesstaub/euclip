import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service store;
  @service session;

  async beforeModel(transition) {
    await this.session.setup();
    return super.beforeModel(transition);
  }
}
