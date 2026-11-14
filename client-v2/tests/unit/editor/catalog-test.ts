import { module, test } from 'qunit';
import { createEngine, type Engine } from 'cracked-up';
import { helpers, wrapUserCode } from 'cracked-up/util';
import { setupTest } from 'client-v2/tests/helpers';
import { placeholderCatalog } from 'client-v2/editor/catalog';
import {
  BUFFERS,
  PROJECT_SCRIPT,
  TRACKS,
} from 'client-v2/utils/placeholder-tracks';

type Api = Engine['$'];

/** An engine that renders offline: no sound, no audio device, nothing to resume. */
async function offlineEngine(): Promise<Engine> {
  const context = new OfflineAudioContext(2, 44100, 44100);
  const engine = await createEngine({ context });
  for (const key of BUFFERS) {
    engine.buffers.add(key, context.createBuffer(1, 4410, 44100));
  }
  return engine;
}

/** Compiles a script the way a host does: `__` and the helpers are the function's arguments. */
function compile(code: string): (api: Api) => void {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const program = new Function(
    '__',
    ...Object.keys(helpers),
    wrapUserCode(code),
  ) as (api: Api, ...rest: unknown[]) => void;
  return (api) => program(api, ...Object.values(helpers));
}

module('Unit | Editor | catalog and placeholder scripts', function (hooks) {
  setupTest(hooks);

  test('the catalog offers the placeholder project’s sounds and bus', function (assert) {
    const catalog = placeholderCatalog();
    assert.deepEqual(
      catalog.buffers,
      BUFFERS.map((key) => ({ key })),
    );
    assert.deepEqual(catalog.buses, ['drums']);
    assert.true(
      catalog.types?.some((info) => info.type === 'compressor'),
      'with the built-in node types',
    );
  });

  test('the project script and every track script build without errors', async function (assert) {
    const engine = await offlineEngine();

    const project = await engine.root.build(compile(PROJECT_SCRIPT));
    assert.deepEqual(project.errors, [], 'project script');
    assert.deepEqual(
      project.added.map((node) => node.type),
      ['compressor'],
      'the project script puts a compressor on the drum bus',
    );

    for (const track of TRACKS) {
      if (track.script === undefined) continue;
      const result = await engine.scope(track.id).build(compile(track.script));
      assert.deepEqual(result.errors, [], `${track.id}: no errors`);
      assert.deepEqual(
        result.added.map((node) => node.type),
        ['sampler', track.id === 'track-1' ? 'lowpass' : 'highpass', 'gain'],
        `${track.id}: its chain`,
      );
    }
  });
});
