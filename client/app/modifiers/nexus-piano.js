import Modifier from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';
import { guidFor } from '@ember/object/internals';
import Nexus from 'nexusui';

/**
 * A Nexus piano that shows one lit key and reports the key the user presses.
 *
 *   {{nexus-piano this.activeNote lowNote=36 highNote=71 size=(array 300 100) onSelect=this.select}}
 *
 * Only the pressed key stays lit (the piano is a selector, not a keyboard), and pressing the lit key
 * again keeps it lit. Changing `activeNote` moves the light without re-creating the piano.
 */
export default class NexusPiano extends Modifier {
  piano = null;
  lit = null;
  syncing = false;
  layout = null;
  onSelect = null;

  constructor(owner, args) {
    super(owner, args);
    registerDestructor(this, () => this.piano?.destroy());
  }

  modify(element, [activeNote], { lowNote = 36, highNote = 71, size = [300, 100], onSelect }) {
    this.onSelect = onSelect;

    const layout = `${lowNote}-${highNote}-${size.join('x')}`;
    if (layout !== this.layout) {
      this.piano?.destroy();
      element.id ||= guidFor(element); // Nexus finds its element by id
      this.piano = new Nexus.Piano(`#${element.id}`, { size, mode: 'toggle', lowNote, highNote });
      this.piano.colorize('accent', '#52ebff');
      this.piano.on('change', this.onKeyChange);
      this.layout = layout;
      this.lit = null;
      this.range = { lowNote, highNote };
    }
    this.light(activeNote);
  }

  onKeyChange = ({ note, state }) => {
    if (this.syncing) return;
    if (state) {
      this.onSelect?.(note);
    } else if (note === this.lit) {
      this.setKey(note, true); // pressing the lit key again must not turn it off
    }
  };

  setKey(note, on) {
    this.syncing = true;
    try {
      this.piano.toggleKey(note, on);
    } finally {
      this.syncing = false;
    }
  }

  light(note) {
    const { lowNote, highNote } = this.range;
    const target = Number.isFinite(note) ? Math.round(note) : null;
    const inRange = target !== null && target >= lowNote && target <= highNote;
    const next = inRange ? target : null;
    if (next === this.lit) return;

    if (this.lit !== null) this.setKey(this.lit, false);
    if (next !== null) this.setKey(next, true);
    this.lit = next;
  }
}
