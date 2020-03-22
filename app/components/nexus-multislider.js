import NexusBase from "./nexus-base";
import { computed } from "@ember/object";
import { alias } from "@ember/object/computed";

export default NexusBase.extend({
  slider: alias("nexusElement"),

  init() {
    this._super(...arguments);
    this.setProperties({
      elementName: "Multislider"
    });
  },

  options: computed("max", "step", "values", "size", "numberOfSliders", {
    get() {
      let values = this.values;
      values = values.slice(0, this.numberOfSliders);
      return {
        size: this.size || [400, 120],
        min: this.min,
        max: this.max,
        candycane: 3,
        numberOfSliders: this.numberOfSliders || 4,
        step: this.step || 0,
        values: values
      };
    }
  }),

  nexusInit() {
    this._super(...arguments);
    this.slider.colorize("accent", "#52ebff");
    this.slider.colorize("fill", "#ffffff");
  }
});
