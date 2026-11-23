import { module, test } from 'qunit';
import { CONTROL_NAMES } from 'client-v2/controls/script-api';
import { compile } from 'client-v2/audio/compile';
import {
  REFERENCE_BASICS,
  REFERENCE_FUNCTIONS,
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
});
