/** Everything the script reference says besides the entries themselves (those are in reference-data.ts). */
export const REFERENCE_TEXT = {
  menuItem: 'Script reference',
  title: 'Script reference',
  close: 'Close',
  intro:
    'These functions are in scope in every track script and in the project script. A control exists because a script declares it.',
  functionsHeading: 'Functions',
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
  basicsHeading: 'The basics of cracked-up',
  basicsIntro:
    'A track script builds a chain of nodes, sends it to the track’s channel, and plays it from a sequence. The rest of the library is in its own docs.',
  docsLink: 'cracked-up documentation',
  docsUrl: 'https://jamesstaub.github.io/cracked-up/docs.html',
  noOptions: 'No options.',
} as const;
