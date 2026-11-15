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
      catalog
        .get()
        .buffers?.map((buffer) =>
          typeof buffer === 'string' ? buffer : buffer.key,
        ),
      ['kick', 'snare', 'hat', 'openhat', 'clap', 'loop'],
      'the project’s sample pool',
    );
    const named = (list: readonly (string | { name: string })[] | undefined) =>
      (list ?? []).map((entry) =>
        typeof entry === 'string' ? entry : entry.name,
      );
    assert.deepEqual(
      catalog
        .get()
        .ids?.find((id) => typeof id !== 'string' && id.name === 'glue'),
      {
        name: 'glue',
        type: 'compressor',
        description: 'compressor in the project script',
      },
      'an id comes with its node type, so the editor knows its parameters',
    );
    const channel = catalog
      .get()
      .buses?.find((bus) => typeof bus !== 'string' && bus.name === 'channel');
    assert.true(
      (typeof channel === 'object' ? (channel.description ?? '') : '').includes(
        'channel strip',
      ),
      'the channel bus says what it is',
    );
    assert.deepEqual(named(catalog.get().sequences), ['steps']);

    const functions = catalog.get().functions ?? [];
    assert.deepEqual(
      functions.map((fn) => fn.name),
      [
        'slider',
        'knob',
        'toggle',
        'select',
        'sequencer',
        'controls',
        'waveform',
      ],
      'Euclip’s own functions are described to the editor, from the declarations the script API is made of',
    );
    assert.strictEqual(catalog.get().globals, undefined, 'and only there');
    const slider = functions.find((fn) => fn.name === 'slider')!;
    assert.true(slider.description.includes('.set(v)'));
    assert.true(
      slider.description.includes('a chain'),
      'the forms a target can take are documented',
    );
    assert.deepEqual(
      slider.signatures.map((signature) =>
        signature.args.map(
          (arg) =>
            `${arg.name}:${arg.kind}${arg.of ? `(${arg.of})` : ''}${arg.optional ? '?' : ''}`,
        ),
      ),
      [
        ['target:selector', 'param:param(target)', 'options:options?'],
        ['name:name', 'options:options'],
      ],
      'each argument says what it is: a selector, a parameter of that target, options',
    );
    const mode = slider.signatures[0]!.args[2]!.options!.find(
      (option) => option.name === 'mode',
    )!;
    assert.true(
      mode.values!.includes('note'),
      'option keys come with their values',
    );
    assert.true(mode.values!.includes('decibels'));
    assert.deepEqual(
      slider.signatures[0]!.returns?.members?.map((member) => member.name),
      ['value', 'set'],
      'and what a call returns has its members',
    );
    assert.deepEqual(
      functions
        .find((fn) => fn.name === 'sequencer')!
        .signatures[0]!.args.map((arg) => arg.kind),
      ['sequence', 'options'],
    );
    assert.deepEqual(
      functions
        .find((fn) => fn.name === 'controls')!
        .signatures.map((signature) => signature.args.map((arg) => arg.kind)),
      [[], ['selector', 'list']],
    );

    project.apply({
      type: 'setScript',
      scope: 't-kick',
      script: `__().sampler({ id: 'thump', buffer: 'kick' }).to('channel');\n__.transport.sequence('four', { steps: 4 }, () => {});`,
    });
    await audio.runNow('t-kick');

    assert.true(getLiveCatalog().ids.some((id) => id.name === 'thump'));
    assert.true(
      named(catalog.get().ids).includes('thump'),
      'a new id is offered',
    );
    assert.true(named(catalog.get().sequences).includes('four'));
    assert.strictEqual(
      catalog.get().functions?.length,
      7,
      'and the functions are still there',
    );
  });
});
