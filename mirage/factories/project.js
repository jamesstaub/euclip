import {
  Factory, trait } from 'ember-cli-mirage';

export default Factory.extend({
  title: i => `Project ${i + 1}`,
  slug: i => `project-${i + 1}`,
  afterCreate(project, server) {
    project.update({creator: server.schema.users.first()});
  },
  withTracks: trait({
    afterCreate(project, server) {
      server.create('track', { project });
      server.create('track', { project });
      server.create('track', { project });
    },
  })
});