import { module, test } from 'qunit';
import { setupTest } from 'client-v2/tests/helpers';
import { sharedCatalog } from 'client-v2/editor/catalog';
import { getLiveCatalog } from 'client-v2/editor/live-catalog';

module('Unit | Editor | catalog', function (hooks) {
  setupTest(hooks);

  test('the editors’ catalog follows the running project, and documents the control functions', async function (assert) {
    const audio = this.owner.lookup('service:audio');
    const project = this.owner.lookup('service:project');
    await audio.boot();

    const catalog = sharedCatalog();
    assert.true(
      (catalog.get().types?.length ?? 0) > 20,
      'the library’s node types, with no engine asked',
    );
    assert.deepEqual(
      catalog.get().buffers,
      ['kick', 'snare', 'hat', 'openhat', 'clap'].map((key) => ({ key })),
      'the project’s sample pool',
    );
    assert.true(catalog.get().ids?.includes('glue'));
    assert.true(catalog.get().buses?.includes('out'));
    assert.deepEqual(catalog.get().sequences, ['steps']);
    assert.deepEqual(
      catalog.get().globals?.map((global) => global.name),
      ['slider', 'knob', 'toggle', 'select', 'sequencer', 'controls'],
      'Euclip’s own functions are offered by name',
    );
    const slider = catalog
      .get()
      .globals?.find((global) => global.name === 'slider');
    assert.true(
      slider?.signature?.startsWith('slider(selector, param, options?)'),
    );
    assert.true(slider?.description.includes('.set(v)'));

    project.apply({
      type: 'setScript',
      scope: 't-kick',
      script: `__().sampler({ id: 'thump', buffer: 'kick' }).to('out');\n__.transport.sequence('four', { steps: 4 }, () => {});`,
    });
    await audio.runNow('t-kick');

    assert.true(getLiveCatalog().ids.includes('thump'));
    assert.true(catalog.get().ids?.includes('thump'), 'a new id is offered');
    assert.true(catalog.get().sequences?.includes('four'));
    assert.strictEqual(
      catalog.get().globals?.length,
      6,
      'and the functions are still there',
    );
  });
});
