import { modifier } from 'ember-modifier';

export const SOUND_TYPE = 'application/x-euclip-sound';

/**
 * Makes an element a draggable sound: `{{draggable-sound path}}`. Drop targets (see `sound-drop`) read the path.
 * While a sound is in the air, <body> carries `dragging-sound` so valid targets can show themselves.
 * (HTML5 drag and drop does not exist on touch screens; every drop target also has a button.)
 */
export default modifier(
  (element, [path]) => {
    if (!path) return undefined;
    element.setAttribute('draggable', 'true');

    const start = (event) => {
      event.dataTransfer.setData(SOUND_TYPE, path);
      event.dataTransfer.setData('text/plain', path);
      event.dataTransfer.effectAllowed = 'copy';
      document.body.classList.add('dragging-sound');
    };
    const end = () => document.body.classList.remove('dragging-sound');

    element.addEventListener('dragstart', start);
    element.addEventListener('dragend', end);
    return () => {
      element.removeEventListener('dragstart', start);
      element.removeEventListener('dragend', end);
      element.removeAttribute('draggable');
    };
  },
  { eager: false }
);
