import { module, test } from 'qunit';
import {
  applyGenerator,
  applyTool,
  beatsOfNumber,
  beatsDigits,
  numberOfBeats,
  binaryMax,
  combine,
  defaultGenerator,
  generate,
  isEdited,
  keepValues,
  readGenerator,
  written,
  type GeneratorState,
} from 'client-v2/controls/generators';

const EMPTY16 = new Array<number>(16).fill(0);
const dials = (more: Partial<GeneratorState>): GeneratorState => ({
  ...defaultGenerator(EMPTY16),
  ...more,
});

module('Unit | Controls | generators', function () {
  test('each generator but Binary fills the grid’s own length', function (assert) {
    assert.strictEqual(
      generate(dials({ kind: 'euclid', hits: 5 }), 16).filter(Boolean).length,
      5,
    );
    assert.strictEqual(
      written(generate(dials({ kind: 'euclid', hits: 3 }), 8)),
      'x..x..x.',
      'the tresillo',
    );
    assert.notStrictEqual(
      written(generate(dials({ kind: 'euclid', hits: 3, rotate: 1 }), 8)),
      'x..x..x.',
      'rotate turns it',
    );
    assert.strictEqual(
      written(generate(dials({ kind: 'binary', beats: beatsOfNumber(5) }), 8)),
      '.x.x',
      'Binary: four steps a beat that is on, leading zeros kept, whatever the grid’s length',
    );
    assert.strictEqual(
      written(generate(dials({ kind: 'binary', beats: beatsOfNumber(1) }), 4)),
      '...x',
    );
    assert.strictEqual(
      written(generate(dials({ kind: 'binary', beats: beatsOfNumber(0) }), 4)),
      '...x',
      '0 is held at 1',
    );
    assert.strictEqual(
      written(
        generate(dials({ kind: 'binary', beats: beatsOfNumber(34952) }), 4),
      ),
      'x...x...x...x...',
    );
    assert.strictEqual(
      written(
        generate(dials({ kind: 'binary', beats: beatsOfNumber(65535) }), 16),
      ),
      'xxxxxxxxxxxxxxxx',
    );
    assert.strictEqual(
      written(generate(dials({ kind: 'onoff', on: 1, off: 3 }), 16)),
      'x...x...x...x...',
    );
    assert.strictEqual(
      written(generate(dials({ kind: 'onoff', on: 3, off: 2 }), 8)),
      'xxx..xxx',
      'repeated to fill, cut at the end',
    );
    assert.strictEqual(
      written(generate(dials({ kind: 'onoff', on: 0, off: 0 }), 4)),
      '....',
    );
    assert.strictEqual(
      written(
        generate(
          dials({
            kind: 'sieve',
            sieve: [
              [3, 0],
              [0, 0],
            ],
          }),
          8,
        ),
      ),
      'x..x..x.',
    );
    assert.strictEqual(
      written(
        generate(
          dials({
            kind: 'sieve',
            sieve: [
              [3, 0],
              [4, 1],
            ],
          }),
          12,
        ),
      ),
      'xx.x.xx..x..',
    );
    assert.strictEqual(
      written(
        generate(
          dials({
            kind: 'sieve',
            sieve: [
              [0, 0],
              [0, 0],
            ],
          }),
          4,
        ),
      ),
      '....',
    );
    assert.strictEqual(binaryMax(), 65535, 'up to sixteen digits');
  });

  test('a generated hit keeps the value its step had; a rest is 0', function (assert) {
    assert.deepEqual(
      keepValues([1, 1, 0, 1], [3, 0, 5, 0], [0, 0, 0, 7]),
      [3, 5, 0, 7],
      'a new hit takes the value last used on the grid',
    );
    assert.deepEqual(
      keepValues([1, 0, 1, 0], [0, 0, 0, 0]),
      [1, 0, 1, 0],
      'an empty grid: 1',
    );
    assert.deepEqual(
      keepValues([1, 0, 1, 0], [0, 0, 0, 0], [], 60),
      [60, 0, 60, 0],
      'an empty grid of a track that plays notes: the fill note, not note 1',
    );
    const slices = [1, 0, 3, 3, 5, 0, 7, 8];
    const made = applyGenerator(
      dials({ kind: 'onoff', on: 1, off: 1 }),
      slices,
    );
    assert.deepEqual(
      made.steps,
      [1, 0, 3, 0, 5, 0, 7, 0],
      'slice numbers stay where the rhythm still hits',
    );
    // a step the dials turn off and on again gets back what it held when they began
    const again = applyGenerator(
      { ...made.generator, on: 2, off: 0 },
      made.steps,
    );
    assert.deepEqual(again.steps, [1, 7, 3, 3, 5, 7, 7, 8]);
    // a note grid: new hits are the grid's note, not MIDI note 1
    const notes = applyGenerator(
      dials({ kind: 'euclid', hits: 4 }),
      [48, 0, 0, 0, 0, 0, 0, 0],
      60,
    );
    assert.deepEqual(notes.steps, [48, 0, 48, 0, 48, 0, 48, 0]);
  });

  test('Replace writes over; Or, And and Xor meet what was there when the dials began', function (assert) {
    const there = [1, 0, 0, 0, 1, 0, 0, 0];
    const gen = [1, 1, 0, 0, 0, 0, 0, 0];
    assert.strictEqual(written(combine('replace', there, gen)), 'xx......');
    assert.strictEqual(written(combine('or', there, gen)), 'xx..x...');
    assert.strictEqual(written(combine('and', there, gen)), 'x.......');
    assert.strictEqual(written(combine('xor', there, gen)), '.x..x...');

    // turning a dial again and again combines with the same base, not with its own last result
    let state = dials({ kind: 'onoff', on: 1, off: 1, combine: 'or' });
    let steps = there;
    ({ steps, generator: state } = applyGenerator(state, steps));
    assert.strictEqual(written(steps), 'x.x.x.x.');
    ({ steps, generator: state } = applyGenerator(
      { ...state, on: 1, off: 7 },
      steps,
    ));
    assert.strictEqual(
      written(steps),
      'x...x...',
      'the base Or-ed with the new pattern, not the old result',
    );
    assert.deepEqual(state.base, there);
  });

  test('"edited": steps changed by hand since the dials wrote; a dial then starts from what is there', function (assert) {
    const first = applyGenerator(
      dials({ kind: 'euclid', hits: 2 }),
      [0, 0, 0, 0],
    );
    assert.false(isEdited(first.generator, first.steps));
    assert.false(
      isEdited(null, first.steps),
      'never generated: nothing to compare',
    );
    const edited = [...first.steps];
    edited[1] = 1;
    assert.true(isEdited(first.generator, edited));
    // nothing is overwritten until a dial moves; then (in Or) the hand edit is part of the base
    const next = applyGenerator(
      { ...first.generator, combine: 'or', hits: 1 },
      edited,
    );
    assert.deepEqual(next.generator.base, edited);
    assert.strictEqual(next.steps[1], 1, 'the hand edit is kept by Or');
    assert.false(isEdited(next.generator, next.steps));
  });

  test('the tools turn the pattern as it stands, keeping its length and its values', function (assert) {
    const steps = [2, 0, 0, 3];
    assert.deepEqual(applyTool('right', steps), [3, 2, 0, 0]);
    assert.deepEqual(applyTool('left', steps), [0, 0, 3, 2]);
    assert.deepEqual(applyTool('reverse', steps), [3, 0, 0, 2]);
    assert.deepEqual(
      applyTool('invert', steps),
      [0, 3, 3, 0],
      'new hits take the value last used',
    );
    assert.deepEqual(applyTool('invert', [0, 0], 60), [60, 60]);
  });

  test('what is stored is read back within the grid’s length, and nonsense takes the defaults', function (assert) {
    const read = readGenerator(
      {
        kind: 'sieve',
        hits: 99,
        rotate: -3,
        number: 1e9,
        on: 2.4,
        off: 'x',
        sieve: [[3, 7], 'no'],
        combine: 'nope',
        made: 'x...',
        base: [1, 'a'],
      },
      [0, 0, 0, 0, 0, 0, 0, 0],
    )!;
    assert.deepEqual(read, {
      kind: 'sieve',
      hits: 8,
      rotate: 0,
      number: 65535,
      beats: [15, 15, 15, 15],
      on: 2,
      off: 3,
      sieve: [
        [3, 2],
        [0, 0],
      ],
      combine: 'replace',
      made: 'x...',
      base: [1, 0],
    });
    assert.strictEqual(readGenerator(undefined, [0, 0]), null);
  });
});

module('Unit | Controls | generators | binary', function () {
  test('Binary makes the grid as long as its number’s digits', function (assert) {
    const made = applyGenerator(
      dials({ kind: 'binary', beats: beatsOfNumber(5) }),
      EMPTY16,
    );
    assert.deepEqual(made.steps, [0, 1, 0, 1], 'one beat: four steps');
    assert.strictEqual(made.generator.made, '.x.x');
    const longer = applyGenerator(
      { ...made.generator, beats: beatsOfNumber(1234) },
      made.steps,
    );
    assert.strictEqual(
      written(longer.steps),
      '.x..xx.x..x.',
      'three beats: twelve',
    );
    assert.strictEqual(beatsDigits([-1, 4, 13, 2]), '010011010010');
  });

  test('Or keeps meeting the whole pattern that was there, as the length changes', function (assert) {
    const there = [0, 1, 0, 0, 0, 0, 0, 0];
    const first = applyGenerator(
      dials({ kind: 'binary', beats: beatsOfNumber(1), combine: 'or' }),
      there,
    );
    assert.strictEqual(
      written(first.steps),
      '.x.x',
      'one beat: ...x, or-ed with the first four of what was there',
    );
    const again = applyGenerator(
      { ...first.generator, beats: [1, -1, -1, 0] },
      first.steps,
    );
    assert.strictEqual(
      written(again.steps),
      '.x.x....',
      'two beats: the whole of what was there is met again',
    );
  });

  test('the beats make the number; a beat that is off is no part of it', function (assert) {
    assert.deepEqual(beatsOfNumber(5), [-1, -1, -1, 5]);
    assert.deepEqual(beatsOfNumber(1234), [-1, 4, 13, 2]);
    assert.deepEqual(beatsOfNumber(43690), [10, 10, 10, 10]);
    assert.strictEqual(numberOfBeats([-1, 4, 13, 2]), 1234);
    assert.strictEqual(
      written(generate(dials({ kind: 'binary', beats: [9, -1, -1, -1] }), 16)),
      'x..x',
      'one beat alone: four steps',
    );
    assert.strictEqual(
      written(generate(dials({ kind: 'binary', beats: [9, -1, 0, -1] }), 16)),
      'x..x....',
      'a beat at 0 is four rests; one that is off is nothing',
    );
    assert.strictEqual(
      written(generate(dials({ kind: 'binary', beats: [-1, -1, -1, -1] }), 16)),
      '....',
      'all off: one beat of rests',
    );
  });
});
