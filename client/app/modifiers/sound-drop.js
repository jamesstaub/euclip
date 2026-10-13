import { modifier } from 'ember-modifier';
import { SOUND_TYPE } from './draggable-sound';

/**
 * Makes an element accept a dragged sound: `{{sound-drop this.onSound}}`, called with the sound's catalog path.
 * The element gets `is-drop-target` while a sound is over it.
 */
export default modifier(
  (element, [onSound]) => {
    const accepts = (event) => Array.from(event.dataTransfer?.types ?? []).includes(SOUND_TYPE);

    const over = (event) => {
      if (!accepts(event)) return;
      event.preventDefault(); // this is a drop target
      event.dataTransfer.dropEffect = 'copy';
      element.classList.add('is-drop-target');
    };
    const leave = (event) => {
      if (!element.contains(event.relatedTarget)) element.classList.remove('is-drop-target');
    };
    const drop = (event) => {
      if (!accepts(event)) return;
      event.preventDefault();
      event.stopPropagation(); // a card inside a row: only the card takes it
      element.classList.remove('is-drop-target');
      document.body.classList.remove('dragging-sound');
      const path = event.dataTransfer.getData(SOUND_TYPE);
      if (path) onSound(path);
    };

    element.addEventListener('dragenter', over);
    element.addEventListener('dragover', over);
    element.addEventListener('dragleave', leave);
    element.addEventListener('drop', drop);
    return () => {
      element.removeEventListener('dragenter', over);
      element.removeEventListener('dragover', over);
      element.removeEventListener('dragleave', leave);
      element.removeEventListener('drop', drop);
      element.classList.remove('is-drop-target');
    };
  },
  { eager: false }
);
