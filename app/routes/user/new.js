import Route from '@ember/routing/route';

export default class UserNewRoute extends Route {
  beforeModel() {
    const user = this.store.peekAll('user').firstObject;
    const project = this.store.createRecord('project', {
      creator: user,
      slug: 'p1',
      title: 'n∑wpro∆'
    });
    return this.transitionTo('user.creator.project', user, project);
  }
}
