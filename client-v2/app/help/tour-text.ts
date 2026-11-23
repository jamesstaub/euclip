/** Everything the tour says, as plain strings: one title and one sentence for each step. */
export const TOUR_TEXT = {
  menuItem: 'Tour',
  dialogLabel: 'Tour',
  close: 'Close',
  back: 'Back',
  next: 'Next',
  done: 'Done',
  /** the step counter: one message with its two numbers in it */
  stepCount: (step: number, total: number): string =>
    `Step ${step} of ${total}`,
} as const;

export interface TourStepText {
  title: string;
  body: string;
}

export const TOUR_STEP_TEXTS = {
  track: {
    title: 'A track',
    body: 'Each row is a track with its own sound and script. Its number selects it; the footer shows the selected track.',
  },
  grid: {
    title: 'The step grid',
    body: 'Tap a step to turn it on or off. The pattern plays in a loop.',
  },
  tabs: {
    title: 'Sound and steps',
    body: 'The footer shows how the selected track sounds (its source and every processor, with their controls) or its steps and lanes.',
  },
  view: {
    title: 'Seq and Signal',
    body: 'Seq shows each track’s steps. Signal shows the chain of nodes the sound passes through.',
  },
  script: {
    title: 'The script',
    body: 'Everything you see is declared here. Open the script to read it, change it, and watch the controls follow.',
  },
  menu: {
    title: 'The project menu',
    body: 'Projects, files, and Help live here: this tour again, the script reference and the welcome.',
  },
} as const satisfies Record<string, TourStepText>;

export type TourStepId = keyof typeof TOUR_STEP_TEXTS;
