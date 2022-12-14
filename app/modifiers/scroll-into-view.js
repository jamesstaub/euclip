import { modifier } from 'ember-modifier';

export default modifier(
  (element, [isSelected, behavior]) => {
    if (isSelected) {
      element.scrollIntoView({ behavior, inline: 'end' });
    }
  },
  { eager: false }
);
