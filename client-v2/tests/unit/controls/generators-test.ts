import { module, test } from 'qunit';
import {
  applyGenerator,
  applyTool,
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
  test('each generator fills the grid’s own length, whatever its dials', function (assert) {
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
      written(generate(dials({ kind: 'binary', number: 5 }), 8)),
      '.....x.x',
    );
    assert.strictEqual(
      written(generate(dials({ kind: 'binary', number: 255 }), 4)),
      'xxxx',
      'too big to fit: its front digits go',
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
    assert.strictEqual(binaryMax(16), 65535);
    assert.strictEqual(binaryMax(4), 15);
    assert.strictEqual(binaryMax(32), 65535, 'capped at sixteen bits');
  });

  test('a generated hit keeps the value its step had; a rest is 0', function (assert) {
    assert.deepEqual(
      keepValues([1, 1, 0, 1], [3, 0, 5, 0], [0, 0, 0, 7]),
      [3, 1, 0, 7],
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
    assert.deepEqual(again.steps, [1, 1, 3, 3, 5, 1, 7, 8]);
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
    assert.deepEqual(applyTool('invert', steps), [0, 1, 1, 0]);
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
      number: 255,
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
