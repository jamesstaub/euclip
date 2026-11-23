/**
 * Everything the starter projects say, as plain strings, so that translation is a matter of replacing
 * this file. (Project names are the starting names of a person's own project: they are kept in the
 * project, not looked up.)
 */

export const STARTERS_TEXT = {
  /** the New project panel */
  newProjectTitle: 'New project',
  newProjectBack: '← New project',
  /** the project menu's list of starters is a group with this name */
  startersGroupLabel: 'Start from',
  emptyName: 'Empty',
  emptyDescription: 'No tracks: add your own.',
  /** the welcome dialog's list of starters has this group name */
  welcomeStartersLabel: 'Or start from one of these',
} as const;

export interface StarterText {
  /** the project's name and the starter's label */
  name: string;
  description: string;
}

export const STARTER_TEXTS = {
  'drum-machine': {
    name: 'Drum machine',
    description: 'Four drum sounds on a step grid: kick, snare, hat and clap.',
  },
  'sliced-break': {
    name: 'Sliced break',
    description:
      'A two-bar loop cut into pieces, replayed in a new order by a slice lane.',
  },
  'synth-line': {
    name: 'Synth line',
    description:
      'A bass line on a synth with a note on each step, a filter lane, and a kick.',
  },
  'effects-chain': {
    name: 'Effects chain',
    description:
      'A clap through a filter, a tape delay and a reverb, with lanes that change them on single steps.',
  },
} as const satisfies Record<string, StarterText>;

export type StarterId = keyof typeof STARTER_TEXTS;
