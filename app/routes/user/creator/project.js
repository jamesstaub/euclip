import Route from '@ember/routing/route';

export default class UserCreatorProjectRoute extends Route {
  model({ slug }) {
    this.store.queryRecord('project', { slug });
  }
}
