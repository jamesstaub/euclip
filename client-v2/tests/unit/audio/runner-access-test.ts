import { module, test } from 'qunit';
import {
  describeError,
  heardKey,
  samePlace,
  scriptOf,
  valuesOf,
} from 'client-v2/audio/runner/access';
import { defaultProject, newTrack } from 'client-v2/project/default-project';
import { PROJECT_SCOPE } from 'client-v2/project/schema';
import type { Node } from 'cracked-up';

module('Unit | audio | runner access', function () {
  test('describeError words the original error, not the wrapper', function (assert) {
    const wrapped = new Error('build failed', {
      cause: new SyntaxError('bad token'),
    });
    const described = describeError(wrapped, 'beat');
    assert.strictEqual(described.message, 'SyntaxError: bad token');
    assert.strictEqual(described.sequence, 'beat');
    assert.strictEqual(describeError('plain').message, 'plain');
    assert.false('sequence' in describeError('plain'));
  });

  test('valuesOf and scriptOf find the project, a track, or nothing', function (assert) {
    const doc = defaultProject();
    const track = newTrack('extra');
    doc.tracks.push(track);
    assert.strictEqual(valuesOf(doc, PROJECT_SCOPE), doc.values);
    assert.strictEqual(scriptOf(doc, PROJECT_SCOPE), doc.script);
    assert.strictEqual(valuesOf(doc, track.id), track.values);
    assert.strictEqual(scriptOf(doc, track.id), track.script);
    assert.strictEqual(valuesOf(doc, 'nope'), null);
    assert.strictEqual(scriptOf(doc, 'nope'), null);
  });

  test('heardKey names a node and parameter', function (assert) {
    assert.strictEqual(
      heardKey({ id: 'lp' } as Node, 'frequency'),
      'lp/frequency',
    );
  });

  test('samePlace tolerates float noise and sub-resolution differences', function (assert) {
    const meta = { min: 0, max: 100, unit: 'none', name: 'x' } as never;
    assert.true(samePlace(1, 1 + 1e-9, 'linear', meta));
    assert.false(samePlace(1, 50, 'linear', meta));
  });
});
