import { JSONAPISerializer } from 'ember-cli-mirage';

export default JSONAPISerializer.extend({
  alwaysIncludeLinkageData: true, // needed for duplicating a track, ensures track-controls have track-node id
});
