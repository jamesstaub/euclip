import NexusBase from './nexus-base';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';

export default NexusBase.extend({
  toggle: alias('nexusElement'),

  init() {
    this._super(...arguments);
    this.setProperties({
      elementName: 'Toggle',
    });
  },

  nexusInit() {
    this._super(...arguments);
    this.toggle.colorize('accent', '#333');
    this.toggle.colorize('fill', '#eee');
  },
});
