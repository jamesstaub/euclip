import { modifier } from 'ember-modifier';

export default modifier(
  (element, pos, { left, bottom, behavior = 'smooth' }) => {
    element.scrollTo({
      left,
      bottom,
      behavior,
    });
  },
  { eager: false }
);
