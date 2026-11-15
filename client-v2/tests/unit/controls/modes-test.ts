import { module, test } from 'qunit';
import {
  availableModes,
  defaultMode,
  familyOf,
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

  test('the units on offer come from what the parameter is: its unit, range and curve; its name only for a speed', function (assert) {
    const frequency = { min: 20, max: 20000, unit: 'hz', curve: 'log' };
    assert.strictEqual(familyOf(frequency), 'frequency');
    assert.strictEqual(defaultMode(frequency), 'hz');
    assert.deepEqual(availableModes(frequency), ['hz', 'note', 'cents']);
    assert.deepEqual(
      availableModes({ min: 0.01, max: 20, unit: 'hz', curve: 'log' }),
      ['hz'],
      'an LFO’s rate is a frequency with no notes',
    );

    const gain = { min: 0, max: 4, unit: 'gain', curve: 'linear' };
    assert.strictEqual(defaultMode(gain), 'linear');
    assert.deepEqual(availableModes(gain), ['linear', 'decibels']);

    const time = { min: 0, max: 2, unit: 'seconds', curve: 'exp' };
    assert.deepEqual(
      availableModes(time),
      ['seconds', 'ms'],
      'no steps without a tempo',
    );
    assert.deepEqual(availableModes({ ...time, stepSeconds: 0.125 }), [
      'seconds',
      'ms',
      'steps',
    ]);

    const place = {
      min: 0,
      max: 1.5,
      unit: 'seconds',
      duration: 1.5,
      stepSeconds: 0.125,
    };
    assert.strictEqual(
      familyOf(place),
      'place',
      'a time the host gave a sample length for is a place in the sample',
    );
    assert.deepEqual(availableModes(place), ['seconds', 'ms', 'percent']);
    assert.deepEqual(
      availableModes({
        ...place,
        slices: [0, 0.5, 1, 1.5],
        edge: 'start' as const,
      }),
      ['seconds', 'ms', 'percent', 'slice'],
    );
    assert.deepEqual(
      availableModes({ ...place, slices: [0, 1.5] }),
      ['seconds', 'ms', 'percent'],
      'one slice is nothing to choose between',
    );

    const speed = {
      min: 0.0625,
      max: 8,
      unit: 'ratio',
      curve: 'log',
      name: 'speed',
    };
    assert.deepEqual(availableModes(speed), [
      'ratio',
      'semitones',
      'ratio-cents',
    ]);
    assert.deepEqual(
      availableModes({ min: 1, max: 20, unit: 'ratio', name: 'ratio' }),
      ['linear', 'exponential', 'stepped'],
      'a compressor’s ratio has the same unit and is not a speed',
    );

    assert.deepEqual(availableModes({ min: -1, max: 1, unit: 'pan' }), [
      'linear',
      'exponential',
      'stepped',
    ]);
    assert.deepEqual(
      availableModes({ min: 0.0001, max: 30, unit: 'q', curve: 'log' }),
      ['exponential', 'linear', 'stepped'],
    );
    const count = { min: 1, max: 16, unit: 'none', step: 1 };
    assert.strictEqual(defaultMode(count), 'stepped');
    assert.strictEqual(availableModes(count)[0], 'stepped');
    assert.strictEqual(
      defaultMode({ min: 20, max: 2000, unit: 'hz', values: [110, 220, 440] }),
      'stepped',
      'a list of values is stepped whatever the unit',
    );
    for (const meta of [frequency, gain, time, place, speed, count]) {
      assert.strictEqual(
        availableModes(meta)[0],
        defaultMode(meta),
        'the default comes first',
      );
    }
  });

  module('every unit there and back', function () {
    const close = (a: number, b: number, tolerance = 1e-6): boolean =>
      Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
    // [mode, range, a value that is exactly sayable in the unit, how it is said]
    const UNITS: readonly [ModeName, Range, number, string][] = [
      [
        'hz',
        { min: 20, max: 20000, unit: 'hz', curve: 'log' },
        2500,
        '2.5 kHz',
      ],
      ['note', { min: 20, max: 20000, unit: 'hz', curve: 'log' }, 440, 'A4'],
      [
        'cents',
        { min: 20, max: 20000, unit: 'hz', curve: 'log' },
        440 * 2 ** (13 / 1200),
        'A4 +13 ct',
      ],
      ['linear', { min: 0, max: 2, unit: 'gain' }, 0.5, '0.5'],
      ['decibels', { min: 0, max: 2, unit: 'gain' }, 0.5, '-6.0 dB'],
      [
        'seconds',
        { min: 0, max: 2, unit: 'seconds', curve: 'exp' },
        0.25,
        '0.25 s',
      ],
      ['ms', { min: 0, max: 2, unit: 'seconds', curve: 'exp' }, 0.25, '250 ms'],
      [
        'steps',
        { min: 0, max: 2, unit: 'seconds', stepSeconds: 0.125 },
        0.375,
        '3 steps',
      ],
      [
        'percent',
        { min: 0, max: 1.6, unit: 'seconds', duration: 1.6 },
        0.4,
        '25%',
      ],
      [
        'slice',
        {
          min: 0,
          max: 1.6,
          unit: 'seconds',
          duration: 1.6,
          slices: [0, 0.3, 0.9, 1.6],
          edge: 'start',
        },
        0.9,
        'slice 2',
      ],
      [
        'slice',
        {
          min: 0,
          max: 1.6,
          unit: 'seconds',
          duration: 1.6,
          slices: [0, 0.3, 0.9, 1.6],
          edge: 'end',
        },
        0.9,
        'slice 1',
      ],
      [
        'ratio',
        { min: 0.0625, max: 8, unit: 'ratio', curve: 'log' },
        1.5,
        '1.5×',
      ],
      [
        'semitones',
        { min: 0.0625, max: 8, unit: 'ratio', curve: 'log' },
        2 ** (7 / 12),
        '+7 st',
      ],
      [
        'ratio-cents',
        { min: 0.0625, max: 8, unit: 'ratio', curve: 'log' },
        2 ** (-50 / 1200),
        '-50 ct',
      ],
      [
        'exponential',
        { min: 0.0001, max: 30, unit: 'q', curve: 'log' },
        3,
        '3',
      ],
      ['stepped', { min: 0, max: 16 }, 5, '5'],
    ];

    for (const [mode, range, value, said] of UNITS) {
      test(`${mode}${range.edge ? ` (${range.edge})` : ''}: ${said}`, function (assert) {
        const m = mapping(mode, range);
        assert.strictEqual(
          m.format(value),
          said,
          'the stored value, said in the unit',
        );
        const typed = m.parse(said) ?? NaN;
        assert.true(
          close(typed, value, mode === 'decibels' ? 0.01 : 1e-6),
          `typed back: ${typed} for ${value}`,
        );
        const position = m.toPosition(value);
        assert.true(position >= 0, 'on the travel');
        assert.true(position <= 1);
        assert.true(
          close(m.toValue(position), value),
          `along the travel and back: ${m.toValue(position)}`,
        );
        // (a unit that moves in whole steps starts and ends on its first and last step, not the range's ends)
        const ends = m.discrete
          ? [m.toValue(0), m.toValue(1)]
          : [range.min, range.max];
        assert.true(
          close(m.toValue(0), ends[0]!),
          `the start of the travel: ${m.toValue(0)}`,
        );
        assert.true(
          close(m.toValue(1), ends[1]!),
          `the end of the travel: ${m.toValue(1)}`,
        );
        assert.true(m.keyStep > 0, 'the keys move it');
        assert.true(m.keyStep <= 0.5);
        // every stop along the travel can be said and read back as the same stop
        for (const p of [0.1, 0.37, 0.5, 0.82]) {
          const at = m.toValue(p);
          const back = m.parse(m.format(at)) ?? NaN;
          assert.true(
            Math.abs(m.toPosition(back) - m.toPosition(at)) < 0.01,
            `${m.format(at)} reads back near where it was`,
          );
        }
        assert.strictEqual(m.parse('nonsense'), null);
      });
    }

    test('what a unit steps by', function (assert) {
      const speed = { min: 0.0625, max: 8, unit: 'ratio', curve: 'log' };
      const semis = mapping('semitones', speed);
      assert.true(semis.discrete);
      assert.true(
        close(
          semis.toValue(semis.toPosition(1) + semis.keyStep),
          2 ** (1 / 12),
        ),
        'a key press is a semitone',
      );
      assert.strictEqual(
        semis.format(semis.toValue(0.5031)),
        '-6 st',
        'a drag stops on whole semitones',
      );

      const time = { min: 0, max: 2, unit: 'seconds', stepSeconds: 0.125 };
      const steps = mapping('steps', time);
      assert.true(
        close(steps.toValue(steps.keyStep), 0.125 * 0.25),
        'a quarter of a step',
      );
      assert.strictEqual(steps.format(0.125), '1 step');
      assert.strictEqual(
        mapping('steps', { ...time, stepSeconds: 0.25 }).format(0.125),
        '0.5 steps',
        'the same time is fewer steps at a slower tempo',
      );

      const cents = mapping('ratio-cents', speed);
      assert.true(
        close(
          cents.toValue(cents.toPosition(1) + cents.keyStep),
          2 ** (10 / 1200),
        ),
        'ten cents',
      );
      assert.strictEqual(
        mapping('ms', time).parse('0.5s'),
        0.5,
        'a unit typed with the number is honoured',
      );
      assert.strictEqual(mapping('seconds', time).parse('250ms'), 0.25);
      assert.strictEqual(
        mapping('cents', { min: 20, max: 20000, unit: 'hz' }).parse('a4'),
        440,
      );
      assert.true(
        close(
          mapping('cents', { min: 20, max: 20000, unit: 'hz' }).parse('6900')!,
          440,
        ),
      );
    });

    test('limits inside the range hold the value without changing the travel', function (assert) {
      const start = mapping('seconds', {
        min: 0,
        max: 2,
        unit: 'seconds',
        ceiling: 1.5,
      });
      assert.strictEqual(
        start.toPosition(1),
        0.5,
        'the travel is the whole range',
      );
      assert.strictEqual(
        start.toValue(0.9),
        1.5,
        'the value stops at the limit',
      );
      assert.strictEqual(start.parse('1.9'), 1.5);
      const end = mapping('percent', {
        min: 0,
        max: 2,
        unit: 'seconds',
        duration: 2,
        floor: 0.5,
      });
      assert.strictEqual(end.toValue(0), 0.5);
      assert.strictEqual(end.format(end.parse('10')!), '25%');
    });
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
