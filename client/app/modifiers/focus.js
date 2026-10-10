import { modifier } from 'ember-modifier';

export default modifier(
  (element, [condition]) => {
    if (condition) {
      element.focus();
    }
  },
  { eager: false }
);
