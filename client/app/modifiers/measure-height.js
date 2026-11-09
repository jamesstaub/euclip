import { modifier } from 'ember-modifier';

/**
 * Reports an element's height whenever it changes: `<div {{measure-height this.setHeight}}>`.
 *
 * For things that draw at a fixed pixel size (a Nexus slider is an SVG of exactly the size it was given): measure
 * the space they have, then draw to fit it. The element measured must not take its size from what is drawn in it
 * (draw into an absolutely positioned child), or the two would chase each other.
 */
export default modifier((element, [report]) => {
  // not during the render that put the element there: the callback sets tracked state
  const measure = () => requestAnimationFrame(() => report(Math.floor(element.clientHeight)));
  const observer = new ResizeObserver(measure);
  observer.observe(element);
  measure();
  return () => observer.disconnect();
});
