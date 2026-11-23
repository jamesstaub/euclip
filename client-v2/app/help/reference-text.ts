/** Everything the script reference says besides the entries themselves (those are in reference-data.ts). */
export const REFERENCE_TEXT = {
  menuItem: 'Script reference',
  title: 'Script reference',
  close: 'Close',
  intro:
    'These functions are in scope in every track script and in the project script. A control exists because a script declares it.',
  navLabel: 'Sections',
  sections: {
    controls: 'Controls',
    editors: 'Editors',
    options: 'Options',
    basics: 'Sound basics',
  },
  controlsIntro:
    'The controls a script declares. Each appears in the track’s sound pane, in the lane of the node it belongs to.',
  editorsIntro:
    'Editors a script asks for: a richer view of a sequence or a source than a single control.',
  optionsIntro:
    'The options slider and knob take. The other controls take a label, and any option listed with them.',
  sharedOptions: 'Also takes the options listed under Options.',
  optionsHeading: 'Options',
  optionName: 'Option',
  optionType: 'Type',
  optionMeaning: 'Meaning',
  exampleLabel: 'Example',
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Not copied',
  /** the Copy button's accessible name, said once per example: the function is named in it */
  copyLabel: (name: string): string => `Copy the ${name} example`,
  basicsIntro:
    'A track script builds a chain of nodes, sends it to the track’s channel, and plays it from a sequence. The rest of the library is in its own docs.',
  docsLink: 'cracked-up documentation',
  docsUrl: 'https://jamesstaub.github.io/cracked-up/docs.html',
  noOptions: 'No options.',
} as const;
