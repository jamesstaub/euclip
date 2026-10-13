/**
 * Positional arguments missing from the generated arg-completions.js, filled in by hand from
 * the cracked source. arg-completions.js is regenerated from the cracked JSDocs, so keep
 * hand-written additions here: an entry is only used when the generated data has none.
 */
export const supplementalArgs = {
  chance: [
    {
      label: 'percentage',
      type: 'Number',
      detail: 'chance (0 - 100) of returning true',
    },
  ],
  random: [
    {
      label: 'min',
      type: 'Number',
      detail: 'lowest value that can be returned',
    },
    {
      label: 'max',
      type: 'Number',
      detail: 'highest value that can be returned',
    },
  ],
  shuffle: [
    {
      label: 'arr',
      type: 'Array',
      detail: 'array to shuffle; it is modified and returned',
    },
  ],
  random_scale: [
    {
      label: 'scale',
      type: 'String',
      detail: 'name of a scale, see __.scales',
    },
    {
      label: 'octave_lower',
      type: 'Number',
      detail: 'lowest octave to pick from. defaults to 3',
    },
    {
      label: 'octave_upper',
      type: 'Number',
      detail: 'highest octave to pick from. defaults to 7',
    },
  ],
  random_arpeggio: [
    {
      label: 'chord',
      type: 'String',
      detail: 'name of a chord, see __.chords',
    },
    {
      label: 'octave_lower',
      type: 'Number',
      detail: 'lowest octave to pick from. defaults to 3',
    },
    {
      label: 'octave_upper',
      type: 'Number',
      detail: 'highest octave to pick from. defaults to 7',
    },
  ],
  throttle_factory: [
    {
      label: 'num',
      type: 'Number',
      detail: 'the returned function is true on every nth call',
    },
  ],
  sequence_factory: [
    {
      label: 'arr',
      type: 'Array',
      detail: 'array of call counts to step through',
    },
    { label: 'fn', type: 'Function', detail: 'function to call' },
  ],
};
