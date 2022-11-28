import { modifier } from 'ember-modifier';

export default modifier(
  // TODO if possible pass the event type:
  // 'smooth' on click events and 'auto' on render
  (element, [isSelected]) => {
    if (isSelected) {
      element.scrollIntoView({ behavior: 'smooth', inline: 'end' });
    }
  },
  { eager: false }
);
