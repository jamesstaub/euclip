import Component from '@ember/component';

export default Component.extend({
  nexusInit() {
    const nexusElement = new Nexus[this.elementName](`#${this.nexusId}`, this.options);
    this.set('nexusElement', nexusElement);
    this.nexusElement.on('change', (v) => {
      this.set('value', v);
      // this.onChangeValue(v);
    });
  },

  willDestroyElement() {
    this.nexusElement.destroy();
  }
});
