import { module, test } from 'qunit';
import { CONTROL_NAMES } from 'client-v2/controls/script-api';
import { REFERENCE_TEXT } from 'client-v2/help/reference-text';
import { compile } from 'client-v2/audio/compile';
import {
  REFERENCE_BASICS,
  REFERENCE_FUNCTIONS,
  REFERENCE_OPTIONS,
  REFERENCE_SECTION_IDS,
} from 'client-v2/help/reference-data';

module('Unit | Script reference', function () {
  test('every function the scripts can call has an entry, and every entry is a function they can call', function (assert) {
    const entries = REFERENCE_FUNCTIONS.map((entry) => entry.name);
    assert.deepEqual(
      CONTROL_NAMES.filter((name) => !entries.includes(name)),
      [],
      'no function without an entry',
    );
    assert.deepEqual(
      entries.filter((name) => !CONTROL_NAMES.includes(name)),
      [],
      'no entry without a function',
    );
    assert.strictEqual(new Set(entries).size, entries.length, 'no repeats');
  });

  test('every example is two to four lines (the basics, a template’s worth) and is valid script', function (assert) {
    for (const entry of [...REFERENCE_FUNCTIONS, REFERENCE_BASICS]) {
      const lines = entry.example.split('\n').length;
      const max = entry === REFERENCE_BASICS ? 8 : 4;
      assert.true(lines <= max, `${entry.name}: ${lines} lines`);
      assert.notStrictEqual(entry.summary, '', `${entry.name} has a summary`);
      assert.notStrictEqual(
        entry.signature,
        '',
        `${entry.name} has a signature`,
      );
      // (a script is compiled, not run: a syntax error would throw here)
      assert.strictEqual(typeof compile(entry.example), 'function', entry.name);
    }
  });

  test('every entry is in exactly one section, every section has a label and something in it', function (assert) {
    const ids: readonly string[] = REFERENCE_SECTION_IDS;
    for (const entry of [...REFERENCE_FUNCTIONS, REFERENCE_BASICS]) {
      assert.true(
        ids.includes(entry.section),
        `${entry.name}: ${entry.section}`,
      );
    }
    assert.strictEqual(
      new Set(ids).size,
      ids.length,
      'sections are not repeated',
    );
    for (const id of REFERENCE_SECTION_IDS) {
      assert.notStrictEqual(
        REFERENCE_TEXT.sections[id],
        '',
        `${id} has a label`,
      );
      const count =
        id === 'options'
          ? REFERENCE_OPTIONS.length
          : [...REFERENCE_FUNCTIONS, REFERENCE_BASICS].filter(
              (entry) => entry.section === id,
            ).length;
      assert.true(count > 0, `${id} has content`);
    }
    assert.deepEqual(
      REFERENCE_FUNCTIONS.filter((e) => e.section === 'controls').map(
        (e) => e.name,
      ),
      ['slider', 'knob', 'toggle', 'select', 'controls'],
    );
    assert.deepEqual(
      REFERENCE_FUNCTIONS.filter((e) => e.section === 'editors').map(
        (e) => e.name,
      ),
      ['stepGrid', 'waveform', 'synth'],
    );
  });
});
