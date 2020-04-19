import NexusBase from './nexus-base';
import { alias } from '@ember/object/computed';

export default NexusBase.extend({
  number: alias('nexusElement'),

  init() {
    this._super(...arguments);
    this.set('elementName', 'Number');
  },

});
