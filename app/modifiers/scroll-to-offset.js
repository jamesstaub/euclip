import { modifier } from 'ember-modifier';

export default modifier(
  (element, [pageNum]) => {
    // currently these are hardcoded for the nexus multislider pagination
    const sliderWidth = 32.2; // TODO move this to shared config with NexusMultislider
    const pageSize = 16; // ditto
    element.scrollTo({
      left: sliderWidth * pageNum * pageSize,
      behavior: 'smooth',
    });
  },
  { eager: false }
);
