import {
  Factory, trait } from 'ember-cli-mirage';

export default Factory.extend({
  title: i => `project-${i + 1}`,
  afterCreate(project, server) {
    project.update({creator: server.schema.users.firstObject});
  },
  withTracks: trait({
    afterCreate(project, server) {
      server.create('track', { project });
    },
  })
});
