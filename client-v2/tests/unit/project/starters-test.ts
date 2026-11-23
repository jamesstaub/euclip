import { module, test } from 'qunit';
import { HOST_PAN_ID } from 'client-v2/audio/runner';
import { STARTERS, emptyProject } from 'client-v2/project/starters';
import { PROJECT_SCOPE } from 'client-v2/project/schema';
import { STARTER_TEXTS } from 'client-v2/help/starters-text';
import { startProject } from 'client-v2/tests/helpers/runner';

module('Unit | Starter projects', function () {
  test('every starter has a name and a description', function (assert) {
    assert.deepEqual(
      STARTERS.map((starter) => starter.id).sort(),
      Object.keys(STARTER_TEXTS).sort(),
    );
  });

  for (const starter of STARTERS) {
    test(`${starter.id} builds with no error or warning, and has steps`, async function (assert) {
      const doc = starter.build();
      assert.strictEqual(doc.name, STARTER_TEXTS[starter.id].name);
      const h = await startProject(doc, 1);
      for (const id of [PROJECT_SCOPE, ...doc.tracks.map((t) => t.id)]) {
        assert.strictEqual(h.runner.error(id), null, `${id} has no error`);
        assert.deepEqual(h.runner.warnings(id), [], `${id} has no warnings`);
        assert.true(h.runner.isBuilt(id), `${id} is built`);
      }
      for (const track of doc.tracks) {
        assert.true(
          h.runner.stepGrids(track.id).length > 0,
          `${track.id} has a step grid`,
        );
        assert.true(
          [...h.engine.scope(track.id).select('*')].some(
            (node) => node.id !== HOST_PAN_ID,
          ),
          `${track.id} made nodes`,
        );
      }
    });
  }

  test('the empty project has no tracks and builds', async function (assert) {
    const h = await startProject(emptyProject(), 1);
    assert.strictEqual(h.runner.error(PROJECT_SCOPE), null);
  });
});
