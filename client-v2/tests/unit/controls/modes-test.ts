import { module, test } from 'qunit';
import {
  availableModes,
  defaultMode,
  formatWithUnit,
  hzToNote,
  mapping,
  noteName,
  noteToHz,
  parseNote,
  trim,
  type ModeName,
  type Range,
} from 'client-v2/controls/modes';

const close = (a: number, b: number, tolerance = 1e-9): boolean =>
  Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));

const CASES: readonly [ModeName, Range][] = [
  ['linear', { min: 0, max: 1 }],
  ['linear', { min: -1, max: 1, unit: 'pan' }],
  ['linear', { min: -60, max: 0, unit: 'db' }],
  ['exponential', { min: 20, max: 20000, unit: 'hz' }],
  ['exponential', { min: 0.0001, max: 30 }],
  ['exponential', { min: 0, max: 4 }],
  ['exponential', { min: -2, max: 2 }],
  ['note', { min: 20, max: 20000, unit: 'hz' }],
  ['decibels', { min: 0, max: 1.5, unit: 'gain' }],
  ['decibels', { min: 0.01, max: 4, unit: 'gain' }],
  ['stepped', { min: 0, max: 16 }],
  ['stepped', { min: -1, max: 1, step: 0.25 }],
  ['stepped', { min: 0, max: 100, values: [0, 1, 5, 25, 100] }],
];

module('Unit | Controls | modes', function () {
  test('every mode covers its range: the ends of the travel are the ends of the range', function (assert) {
    for (const [mode, range] of CASES) {
      const m = mapping(mode, range);
      const label = `${mode} ${range.min}..${range.max}`;
      const bottom = m.toValue(0);
      const top = m.toValue(1);
      const inRange = (value: number): boolean =>
        value >= range.min - 1e-9 && value <= range.max + 1e-9;
      assert.true(inRange(bottom), `${label}: bottom ${bottom} is in range`);
      assert.true(inRange(top), `${label}: top ${top} is in range`);
      assert.strictEqual(
        m.toPosition(bottom),
        0,
        `${label}: the bottom value is position 0`,
      );
      assert.true(
        close(m.toPosition(top), 1),
        `${label}: the top value is position 1`,
      );
      assert.strictEqual(
        m.toValue(-5),
        bottom,
        `${label}: below the travel is held at the bottom`,
      );
      assert.strictEqual(
        m.toValue(5),
        top,
        `${label}: above the travel is held at the top`,
      );
      assert.strictEqual(
        m.toPosition(range.min - 1000),
        0,
        `${label}: a value below the range is position 0`,
      );
      assert.true(
        close(m.toPosition(range.max + 1000), 1),
        `${label}: a value above the range is position 1`,
      );
    }
  });

  test('every mode round-trips: position to value and back, and value to position and back', function (assert) {
    for (const [mode, range] of CASES) {
      const m = mapping(mode, range);
      const label = `${mode} ${range.min}..${range.max}`;
      let worst = 0;
      for (let i = 0; i <= 200; i++) {
        const value = m.toValue(i / 200);
        // a value the mode can produce comes back exactly from its own position
        worst = Math.max(
          worst,
          Math.abs(m.toValue(m.toPosition(value)) - value) /
            Math.max(1, Math.abs(value)),
        );
      }
      assert.true(
        worst < 1e-9,
        `${label}: value -> position -> value (worst error ${worst})`,
      );
      let increasing = true;
      for (let i = 1; i <= 200; i++) {
        if (m.toValue(i / 200) < m.toValue((i - 1) / 200) - 1e-12)
          increasing = false;
      }
      assert.true(
        increasing,
        `${label}: never goes down as the control goes up`,
      );
    }
  });

  test('every mode reads back what it writes', function (assert) {
    for (const [mode, range] of CASES) {
      const m = mapping(mode, range);
      for (const position of [0, 0.25, 0.5, 0.75, 1]) {
        const value = m.toValue(position);
        const text = m.format(value);
        const read = m.parse(text);
        assert.notStrictEqual(read, null, `${mode}: "${text}" can be read`);
        // text is rounded for the eye, so it reads back close, not exact
        assert.true(
          Math.abs(m.toPosition(read!) - m.toPosition(value)) < 0.02,
          `${mode} ${range.min}..${range.max}: "${text}" reads back near ${value} (${read})`,
        );
      }
      assert.strictEqual(
        m.parse('not a number'),
        null,
        `${mode}: nonsense is not read`,
      );
    }
  });

  test('linear', function (assert) {
    const m = mapping('linear', { min: 0, max: 10 });
    assert.strictEqual(m.toValue(0.5), 5);
    assert.strictEqual(m.toPosition(2.5), 0.25);
    assert.false(m.bipolar);
    assert.true(
      mapping('linear', { min: -1, max: 1 }).bipolar,
      'a range centred on zero fills from the centre',
    );
    assert.strictEqual(
      m.parse('12'),
      10,
      'a typed value is held inside the range',
    );
    assert.strictEqual(m.parse(' 3.5 '), 3.5);
  });

  test('exponential: equal ratios along the travel', function (assert) {
    const m = mapping('exponential', { min: 20, max: 20000, unit: 'hz' });
    assert.true(
      close(m.toValue(1 / 3), 200),
      'a third of the way is one decade up',
    );
    assert.true(close(m.toValue(2 / 3), 2000));
    assert.true(
      close(m.toPosition(632.4555), 0.5, 1e-6),
      'the middle is the geometric mean',
    );
    assert.strictEqual(m.format(2000), '2 kHz');
    assert.strictEqual(m.format(440), '440 Hz');
    assert.strictEqual(m.parse('2.5k'), 2500);
    assert.strictEqual(m.parse('440 Hz'), 440);

    const fromZero = mapping('exponential', { min: 0, max: 4 });
    assert.strictEqual(
      fromZero.toValue(0.5),
      1,
      'a range from zero is squared instead: fine at the bottom',
    );
    assert.strictEqual(fromZero.toPosition(1), 0.5);
  });

  test('MIDI note: whole notes, named, stored as Hz', function (assert) {
    const m = mapping('note', { min: 20, max: 20000, unit: 'hz' });
    assert.strictEqual(noteName(69), 'A4');
    assert.strictEqual(noteName(60), 'C4');
    assert.strictEqual(noteName(0), 'C-1');
    assert.strictEqual(parseNote('a4'), 69);
    assert.strictEqual(parseNote('C#3'), 49);
    assert.strictEqual(parseNote('Bb2'), 46);
    assert.strictEqual(parseNote('60'), 60);
    assert.strictEqual(parseNote('H9'), null);
    assert.true(close(noteToHz(69), 440));
    assert.true(close(hzToNote(880), 81));

    assert.strictEqual(m.format(440), 'A4');
    assert.strictEqual(
      m.format(450),
      'A4',
      'a value between notes shows the nearest',
    );
    assert.true(close(m.parse('A3')!, 220));
    assert.true(
      close(m.parse('60')!, 261.6255653, 1e-6),
      'a note number is read too',
    );
    const value = m.toValue(0.5);
    assert.true(
      close(hzToNote(value), Math.round(hzToNote(value))),
      'every position is a whole note',
    );
    const up = m.toValue(m.toPosition(440) + m.keyStep);
    assert.true(close(up, noteToHz(70)), 'one key step is one semitone');
    assert.strictEqual(
      m.format(m.toValue(0)),
      'E0',
      'the lowest whole note in the range',
    );
  });

  test('decibels: even decibels, silence at the bottom', function (assert) {
    const m = mapping('decibels', { min: 0, max: 1, unit: 'gain' });
    assert.strictEqual(m.toValue(0), 0, 'the very bottom is silence');
    assert.strictEqual(m.toValue(1), 1);
    assert.true(
      close(m.toValue(0.5), 10 ** (-30 / 20)),
      'halfway is -30 dB of a 60 dB travel',
    );
    assert.strictEqual(m.format(1), '0.0 dB');
    assert.strictEqual(m.format(0.5), '-6.0 dB');
    assert.strictEqual(m.format(0), '-∞ dB');
    assert.strictEqual(
      mapping('decibels', { min: 0, max: 2 }).format(2),
      '+6.0 dB',
    );
    assert.true(close(m.parse('-6')!, 0.5011872336, 1e-6));
    assert.true(close(m.parse('-12 dB')!, 0.2511886432, 1e-6));
    assert.strictEqual(m.parse('-inf'), 0);
    assert.strictEqual(m.parse('+20'), 1, 'held inside the range');
    assert.strictEqual(
      m.toPosition(0.0001),
      0,
      'below the floor is the bottom',
    );
  });

  test('stepped: whole numbers, a step, or a list', function (assert) {
    const whole = mapping('stepped', { min: 0, max: 16 });
    assert.strictEqual(whole.toValue(0.49), 8);
    assert.strictEqual(whole.toValue(0.53), 8);
    assert.strictEqual(whole.toValue(0.54), 9);
    assert.strictEqual(whole.keyStep, 1 / 16, 'one key step is one step');
    assert.strictEqual(whole.parse('7.6'), 8);

    const quarter = mapping('stepped', { min: -1, max: 1, step: 0.25 });
    assert.strictEqual(quarter.toValue(0.5), 0);
    assert.strictEqual(quarter.toValue(0.56), 0);
    assert.strictEqual(quarter.toValue(0.57), 0.25);
    assert.strictEqual(quarter.parse('0.3'), 0.25);

    const list = mapping('stepped', {
      min: 0,
      max: 100,
      values: [0, 1, 5, 25, 100],
    });
    assert.deepEqual(
      [0, 0.25, 0.5, 0.75, 1].map((p) => list.toValue(p)),
      [0, 1, 5, 25, 100],
    );
    assert.strictEqual(list.toPosition(20), 0.75, 'the nearest listed value');
    assert.strictEqual(list.parse('3.5'), 5);
  });

  test('the default mode and the modes on offer come from the parameter’s metadata', function (assert) {
    const frequency = { min: 20, max: 20000, unit: 'hz', curve: 'log' };
    assert.strictEqual(defaultMode(frequency), 'exponential');
    assert.deepEqual(availableModes(frequency), [
      'exponential',
      'linear',
      'note',
      'stepped',
    ]);

    const gain = { min: 0, max: 4, unit: 'gain', curve: 'linear' };
    assert.strictEqual(defaultMode(gain), 'linear');
    assert.deepEqual(availableModes(gain), [
      'linear',
      'exponential',
      'decibels',
      'stepped',
    ]);

    const count = { min: 1, max: 16, unit: 'none', step: 1 };
    assert.strictEqual(defaultMode(count), 'stepped');
    assert.strictEqual(availableModes(count)[0], 'stepped');
    assert.false(
      availableModes({ min: -1, max: 1, unit: 'pan' }).includes('decibels'),
    );
  });

  test('numbers are written short', function (assert) {
    assert.strictEqual(trim(0), '0');
    assert.strictEqual(trim(0.8), '0.8');
    assert.strictEqual(trim(1234.5678), '1235');
    assert.strictEqual(trim(0.012345), '0.0123');
    assert.strictEqual(trim(-18), '-18');
    assert.strictEqual(formatWithUnit(0.25, 'seconds'), '0.25 s');
    assert.strictEqual(formatWithUnit(12000, 'hz'), '12 kHz');
    assert.strictEqual(formatWithUnit(3, 'none'), '3');
  });
});
