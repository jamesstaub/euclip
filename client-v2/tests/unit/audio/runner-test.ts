import { module, test } from 'qunit';
import {
  EFFECTIVE_DELAY_MS,
  HOST_PAN_ID,
  OUT_BUS,
  OWN_GROUP,
} from 'client-v2/audio/runner';
import { REGION_GAP } from 'client-v2/controls/live-range';
import { mapping } from 'client-v2/controls/modes';
import {
  defaultProject,
  newSlicedLoopTrack,
  newTrack,
} from 'client-v2/project/default-project';
import { applyOperation } from 'client-v2/project/operations';
import {
  busKey,
  controlKey,
  emptyValues,
  PROJECT_SCOPE,
  stepGridKey,
  type ProjectDocument,
  type StoredValue,
} from 'client-v2/project/schema';
import {
  channelRms,
  chooser,
  peak,
  rms,
  startProject,
  type Harness,
  arrayDefaultProject,
} from 'client-v2/tests/helpers/runner';

const KICK = 't-kick';
const ONE = 't-1';
const FREQUENCY = controlKey('#filter', 'frequency');
const STEPS = stepGridKey('steps');

function scriptOf(h: Harness, id: string): string {
  return id === PROJECT_SCOPE
    ? h.doc.script
    : h.doc.tracks.find((track) => track.id === id)!.script;
}

function idsOf(h: Harness, id: string): string[] {
  return [...h.engine.scope(id).select('*')].map((node) => node.id).sort();
}

function paramOf(h: Harness, scope: string, node: string, name: string) {
  const found = [...h.engine.scope(scope).select(`#${node}`)][0];
  if (!found) throw new Error(`No #${node} in ${scope}`);
  return found.param(name);
}

function control(h: Harness, scope: string, key: string) {
  const found = h.runner
    .controls(scope)
    .find((candidate) => candidate.key === key);
  if (!found) throw new Error(`No control ${key} in ${scope}`);
  return found;
}

function grid(h: Harness, scope: string, name = 'steps') {
  const found = h.runner
    .stepGrids(scope)
    .find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No step grid ${name} in ${scope}`);
  return found;
}

function storedIn(
  h: Harness,
  scope: string,
): Record<string, StoredValue | undefined> {
  const values =
    scope === PROJECT_SCOPE
      ? h.doc.values
      : h.doc.tracks.find((track) => track.id === scope)!.values;
  return Object.fromEntries(
    Object.entries(values.controls).map(([key, state]) => [key, state.value]),
  );
}

/** What a user moving a control does. */
function move(
  h: Harness,
  scope: string,
  key: string,
  value: StoredValue,
): void {
  h.apply({ type: 'setControlValue', scope, key, value });
}

/** A project of one track with the given script, and an empty project script. */
function oneTrack(script: string): ProjectDocument {
  return {
    ...arrayDefaultProject(),
    script: '',
    tracks: [
      { id: ONE, name: 'one', script, level: 1, pan: 0, values: emptyValues() },
    ],
  };
}

const CHAIN = `__().sampler({ id: 's', buffer: 'kick' }).lowpass({ id: 'f', frequency: 2000, q: 6 }).gain({ id: 'g', gain: 0.8 }).to('channel');\n`;

module('Unit | Audio | runner', function () {
  module('what the scripts make', function () {
    test('the default project builds, and declares its controls and grids', async function (assert) {
      const h = await startProject();

      for (const id of [PROJECT_SCOPE, KICK, 't-snare', 't-hat']) {
        assert.strictEqual(h.runner.error(id), null, `${id} has no error`);
        assert.deepEqual(h.runner.warnings(id), [], `${id} has no warnings`);
        assert.true(h.runner.isBuilt(id));
      }
      assert.deepEqual(
        idsOf(h, KICK),
        [HOST_PAN_ID, 'filter', 'level', 'sampler'],
        'the track’s scope holds its script’s nodes and the host’s pan',
      );

      assert.deepEqual(
        h.runner
          .controls(KICK)
          .map(
            (c) => `${c.kind} ${c.group.id}.${c.label} = ${String(c.value)}`,
          ),
        [
          'slider sampler.speed = 1',
          'slider filter.frequency = 2000',
          'slider filter.q = 2',
          'knob level.level = 0.9',
        ],
        'in the order of the script’s chain, with the script’s own values',
      );
      const frequency = control(h, KICK, FREQUENCY);
      assert.deepEqual(frequency.group, {
        id: 'filter',
        label: 'lowpass filter',
        type: 'lowpass',
        name: 'filter',
        ordinal: null,
        count: 1,
        byPosition: false,
        chain: 0,
        bus: null,
      });
      assert.deepEqual(frequency.meta, {
        kind: 'number',
        min: 20,
        max: 20000,
        unit: 'hz',
        curve: 'log',
        name: 'frequency',
        stepSeconds: 0.125,
      });
      assert.strictEqual(
        frequency.mode,
        'hz',
        'the mode comes from the parameter',
      );
      assert.false(frequency.stored);
      assert.false(frequency.implicit);
      assert.strictEqual(frequency.effective, null);

      assert.deepEqual(
        grid(h, KICK).steps,
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      );
      assert.false(grid(h, KICK).stored);
      assert.strictEqual(grid(h, KICK).playhead, null);
      assert.strictEqual(grid(h, KICK).view, 'toggles');

      assert.deepEqual(
        h.runner
          .controls(PROJECT_SCOPE)
          .map((c) => `${c.group.id}.${c.label} = ${String(c.value)}`),
        ['bus:main.master = 0.8', 'glue.threshold = -18', 'glue.ratio = 3'],
      );
      assert.deepEqual(h.runner.stepGrids(PROJECT_SCOPE), []);

      const catalog = h.runner.catalog();
      assert.deepEqual(
        catalog.buffers.map((buffer) => buffer.key),
        ['kick', 'snare', 'hat', 'openhat', 'clap', 'loop'],
      );
      assert.deepEqual(
        catalog.buffers.find((buffer) => buffer.key === 'loop'),
        { key: 'loop', duration: 4, slices: 16 },
        'a sound says how long it is and how it is cut',
      );
      assert.deepEqual(
        catalog.ids.find((id) => id.name === 'glue'),
        {
          name: 'glue',
          type: 'compressor',
          description: 'compressor in the project script',
        },
        'ids from the project script, with their node type',
      );
      assert.strictEqual(
        catalog.ids.find((id) => id.name === 'sampler')?.description,
        'sampler in track 1',
        'ids from the tracks',
      );
      assert.false(
        catalog.ids.some((id) => id.name === HOST_PAN_ID),
        'not the host’s node',
      );
      assert.deepEqual(
        catalog.buses.map((bus) => bus.name),
        ['channel'],
      );
      assert.true(
        catalog.buses[0]!.description!.includes('channel strip'),
        'the channel bus says what it is',
      );
      assert.deepEqual(catalog.sequences, [
        { name: 'steps', description: '16 steps, in track 1' },
      ]);
    });

    test('each track has a host-made out bus with a pan insert, and both survive rebuilds', async function (assert) {
      const h = await startProject();
      const scope = h.engine.scope(KICK);
      const out = scope.bus(OUT_BUS);
      assert.strictEqual(out.scope, scope, 'the bus is the track’s own');
      assert.deepEqual(
        [...out.inserts].map((node) => node.id),
        [HOST_PAN_ID],
      );

      h.apply({ type: 'setTrackLevel', id: KICK, level: 0.5 });
      h.apply({ type: 'setTrackPan', id: KICK, pan: -0.25 });
      await h.setScript(
        KICK,
        scriptOf(h, KICK).replace('frequency: 2000', 'frequency: 900'),
      );
      await h.setScript(KICK, scriptOf(h, KICK) + '\n// again');

      assert.strictEqual(scope.bus(OUT_BUS), out, 'the same bus');
      assert.strictEqual(out.gain.value, 0.5, 'its level is kept');
      const inserts = [...out.inserts];
      assert.deepEqual(
        inserts.map((node) => node.id),
        [HOST_PAN_ID],
      );
      assert.strictEqual(inserts[0]?.param('pan').value, -0.25);
      assert.strictEqual(h.runner.error(KICK), null);
    });

    test('tracks can be added and removed while running', async function (assert) {
      const h = await startProject();
      const track = newTrack('extra', 'clap');
      h.apply({ type: 'addTrack', track });
      await h.runner.run(track.id);
      assert.true(h.runner.isBuilt(track.id));
      assert.deepEqual(idsOf(h, track.id), [HOST_PAN_ID, 'level', 'sampler']);
      assert.strictEqual(grid(h, track.id).steps.length, 16);
      assert.deepEqual(
        h.runner.controls(track.id).map((c) => c.label),
        ['speed', 'level'],
      );
      assert.deepEqual(h.runner.warnings(track.id), []);

      h.apply({ type: 'removeTrack', id: track.id });
      assert.deepEqual(h.runner.stepGrids(track.id), []);
      assert.false(h.runner.isBuilt(track.id));
      assert.strictEqual(grid(h, KICK).steps.length, 16, 'the others stay');
    });
  });

  module('declared controls', function () {
    test('a control exists only where the script declares one', async function (assert) {
      const h = await startProject(oneTrack(CHAIN));
      assert.deepEqual(
        h.runner.controls(ONE),
        [],
        'no declarations, no controls',
      );

      await h.setScript(
        ONE,
        `${CHAIN}slider('#f', 'frequency');\nknob('#g', 'gain', { label: 'Level' });\ntoggle('#s', 'loop');`,
      );
      assert.deepEqual(
        h.runner
          .controls(ONE)
          .map((c) => [c.kind, c.key, c.label, c.meta.kind, c.value]),
        [
          ['toggle', '#s › loop', 'loop', 'boolean', false],
          ['slider', '#f › frequency', 'frequency', 'number', 2000],
          ['knob', '#g › gain', 'Level', 'number', 0.8],
        ],
        'in the order of the chain (sampler, filter, gain), not of the declarations',
      );
      assert.deepEqual(
        h.runner.declarations(ONE)[0],
        {
          key: '#f › frequency',
          kind: 'slider',
          bindings: [{ type: 'param', selector: '#f', param: 'frequency' }],
          nodes: ['f'],
          options: {},
          implicit: false,
          line: 2,
        },
        'a declaration is plain data, with the line it is on',
      );
      assert.false(
        JSON.stringify(h.runner.declarations(ONE)).includes('function'),
      );
    });

    test('moving a control sets the parameter and stores the value; the script does not re-run', async function (assert) {
      const h = await startProject();
      const filter = [...h.engine.scope(KICK).select('#filter')][0];

      move(h, KICK, FREQUENCY, 500);

      assert.strictEqual(paramOf(h, KICK, 'filter', 'frequency').value, 500);
      assert.deepEqual(storedIn(h, KICK), { [FREQUENCY]: 500 });
      assert.strictEqual(control(h, KICK, FREQUENCY).value, 500);
      assert.true(control(h, KICK, FREQUENCY).stored);
      assert.strictEqual(
        [...h.engine.scope(KICK).select('#filter')][0],
        filter,
        'no node was rebuilt',
      );
      assert.deepEqual(h.derived, []);
    });

    test('a stored value passes through the script when it re-runs: no change, no jump', async function (assert) {
      const h = await startProject();
      move(h, KICK, FREQUENCY, 500);
      const changes: unknown[] = [];
      h.engine
        .scope(KICK)
        .scope('script')
        .on('param:changed', (change) =>
          changes.push([change.param.name, change.value]),
        );

      await h.setScript(KICK, `${scriptOf(h, KICK)}\n// the same code again`);
      assert.strictEqual(
        paramOf(h, KICK, 'filter', 'frequency').value,
        500,
        'the rebuild ends on the stored value',
      );
      assert.deepEqual(changes, [], 'and the parameter never moved');
      assert.deepEqual(storedIn(h, KICK), { [FREQUENCY]: 500 });
      assert.deepEqual(
        h.derived,
        [],
        'nothing was written to the document by the run',
      );

      // an edit elsewhere in the script, and to the default itself: the stored value still wins
      await h.setScript(
        KICK,
        scriptOf(h, KICK)
          .replace('gain: 0.9', 'gain: 0.5')
          .replace('frequency: 2000', 'frequency: 3000'),
      );
      assert.strictEqual(paramOf(h, KICK, 'filter', 'frequency').value, 500);
      assert.strictEqual(paramOf(h, KICK, 'level', 'gain').value, 0.5);
      assert.deepEqual(changes, [['gain', 0.5]], 'only what the edit changed');
    });

    test('re-running with a stored value is not heard', async function (assert) {
      // A sine at full level whose gain control is stored at 0: silence. Half a second in, the script
      // runs again. The declaration sets the stored 0 during the build; none of the sine should come out.
      const script = `__().sine({ id: 'osc', frequency: 440 }).gain({ id: 'g', gain: 1 }).to('channel');\nslider('#g', 'gain');`;
      const silent = await startProject(oneTrack(script), 1);
      move(silent, ONE, controlKey('#g', 'gain'), 0);
      void silent.context.suspend(0.5).then(async () => {
        await silent.setScript(ONE, `${script}\n// run again`);
        await silent.context.resume();
      });
      const quiet = await silent.render();
      assert.strictEqual(paramOf(silent, ONE, 'g', 'gain').value, 0);
      assert.true(
        peak(quiet, 0.05, 0.99) < 1e-4,
        `silence all the way through (peak ${peak(quiet, 0.05, 0.99)})`,
      );

      // (the same thing with nothing stored is loud, so the test above can hear)
      const loud = await (await startProject(oneTrack(script), 1)).render();
      assert.true(peak(loud, 0.05, 0.99) > 0.5, 'the sine is audible');
    });

    test('the number in the node is the default: it applies when nothing is stored, and Reset returns to it', async function (assert) {
      const h = await startProject();
      assert.strictEqual(control(h, KICK, FREQUENCY).value, 2000);

      await h.setScript(
        KICK,
        scriptOf(h, KICK).replace('frequency: 2000', 'frequency: 1500'),
      );
      assert.strictEqual(
        control(h, KICK, FREQUENCY).value,
        1500,
        'with nothing stored the control follows the code',
      );

      move(h, KICK, FREQUENCY, 500);
      h.apply({ type: 'resetControl', scope: KICK, key: FREQUENCY });
      await h.runner.run(KICK); // (the reset re-runs the script; wait for it)
      assert.strictEqual(
        paramOf(h, KICK, 'filter', 'frequency').value,
        1500,
        'back to the code’s value',
      );
      assert.strictEqual(control(h, KICK, FREQUENCY).value, 1500);
      assert.false(control(h, KICK, FREQUENCY).stored);
      assert.deepEqual(storedIn(h, KICK), {});
    });

    test('a value whose declaration disappears is kept dormant, and applies again when it returns', async function (assert) {
      const h = await startProject();
      const original = scriptOf(h, KICK);
      move(h, KICK, FREQUENCY, 500);

      await h.setScript(
        KICK,
        original.replace("slider('#filter', 'frequency');\n", ''),
      );
      assert.deepEqual(
        h.runner.controls(KICK).map((c) => c.label),
        ['speed', 'q', 'level'],
      );
      assert.strictEqual(
        paramOf(h, KICK, 'filter', 'frequency').value,
        2000,
        'with no control the code fixes the parameter',
      );
      assert.deepEqual(
        storedIn(h, KICK),
        { [FREQUENCY]: 500 },
        'the value is still in the document',
      );

      move(h, KICK, FREQUENCY, 700);
      assert.strictEqual(
        paramOf(h, KICK, 'filter', 'frequency').value,
        2000,
        'a dormant value moves nothing',
      );

      await h.setScript(KICK, original);
      assert.strictEqual(
        paramOf(h, KICK, 'filter', 'frequency').value,
        700,
        'restored',
      );
      assert.true(control(h, KICK, FREQUENCY).stored);
    });

    test('a selector that finds several nodes gives one control for all of them', async function (assert) {
      const h = await startProject(
        oneTrack(`__().saw({ class: 'voice', frequency: 110 }).gain(0.1).to('channel');
__().saw({ class: 'voice', frequency: 220 }).gain(0.1).to('channel');
slider('.voice', 'detune');`),
      );
      const key = controlKey('.voice', 'detune');
      assert.strictEqual(h.runner.controls(ONE).length, 1);
      assert.strictEqual(control(h, ONE, key).group.label, '.voice (2 nodes)');
      assert.strictEqual(
        control(h, ONE, key).group.id,
        `several:${key}`,
        'a section of its own, not either node’s',
      );

      move(h, ONE, key, 25);
      assert.deepEqual(
        [...h.engine.scope(ONE).select('.voice')].map(
          (node) => node.param('detune').value,
        ),
        [25, 25],
      );
      await h.setScript(ONE, `${scriptOf(h, ONE)}\n// again`);
      assert.deepEqual(
        [...h.engine.scope(ONE).select('.voice')].map(
          (node) => node.param('detune').value,
        ),
        [25, 25],
        'and the stored value reaches both when the script runs',
      );
    });

    test('a declaration that cannot work is a warning on its line; the rest of the script runs', async function (assert) {
      const h = await startProject(
        oneTrack(`${CHAIN}slider('#nope', 'frequency');
slider('#f', 'cutoff');
toggle('#f', 'frequency');
slider('#s', 'loop');
select('#f');
slider('#f', 'q');
__.transport.sequence('steps', { steps: 4 }, () => {});`),
      );

      assert.strictEqual(
        h.runner.error(ONE),
        null,
        'not an error: the script ran',
      );
      assert.true(h.runner.isBuilt(ONE));
      assert.deepEqual(
        h.runner.controls(ONE).map((c) => c.key),
        ['#f › q'],
        'the good declaration still works',
      );
      assert.strictEqual(
        h.engine.scope(ONE).scope('script').transport.sequences.length,
        1,
        'and so does what follows',
      );

      const warnings = h.runner.warnings(ONE);
      assert.deepEqual(
        warnings.map((w) => w.line),
        [2, 3, 4, 5, 6],
      );
      assert.true(
        warnings[0]!.message.includes('matches no node'),
        warnings[0]!.message,
      );
      assert.true(
        warnings[1]!.message.includes(
          'has no parameter "cutoff". It has: frequency, q',
        ),
        warnings[1]!.message,
      );
      assert.true(
        warnings[2]!.message.includes('toggle() cannot show. Use slider()'),
        warnings[2]!.message,
      );
      assert.true(
        warnings[3]!.message.includes(
          'true or false, which slider() cannot show. Use toggle()',
        ),
        warnings[3]!.message,
      );
      assert.true(
        warnings[4]!.message.includes('needs a parameter name'),
        warnings[4]!.message,
      );

      await h.setScript(ONE, `${CHAIN}slider('#f', 'q');`);
      assert.deepEqual(h.runner.warnings(ONE), [], 'fixed');
    });

    test('controls(selector) declares every parameter of the node; with a list, those named', async function (assert) {
      const h = await startProject(oneTrack(`${CHAIN}controls('#s');`));
      assert.deepEqual(
        h.runner.controls(ONE).map((c) => `${c.key}:${c.kind}`),
        [
          '#s › speed:slider',
          '#s › start:slider',
          '#s › end:slider',
          '#s › loop:toggle',
          '#s › loopStart:slider',
          '#s › loopEnd:slider',
          '#s › reverse:toggle',
          '#s › gain:slider',
        ],
        'the kind that suits each parameter, keyed by the node',
      );

      await h.setScript(ONE, `${CHAIN}controls('#s', ['speed', 'loop']);`);
      assert.deepEqual(
        h.runner.controls(ONE).map((c) => c.label),
        ['speed', 'loop'],
      );

      await h.setScript(ONE, `${CHAIN}controls('#s', ['speed', 'tempo']);`);
      assert.deepEqual(
        h.runner.controls(ONE).map((c) => c.label),
        ['speed'],
      );
      assert.true(
        h.runner
          .warnings(ONE)[0]!
          .message.includes(
            'has no parameter "tempo". It has: speed, start, end, loop, loopStart, loopEnd, reverse, gain',
          ),
        h.runner.warnings(ONE)[0]!.message,
      );

      await h.setScript(ONE, `${CHAIN}controls('#nothing');`);
      assert.true(
        h.runner.warnings(ONE)[0]!.message.includes('matches no node'),
      );
    });

    test('controls() with nothing declares every node the script has made, each in its own section, in order', async function (assert) {
      const h = await startProject(oneTrack(`${CHAIN}controls();`));

      const sections = new Map<string, string[]>();
      for (const c of h.runner.controls(ONE)) {
        sections.set(c.group.id, [
          ...(sections.get(c.group.id) ?? []),
          c.label,
        ]);
      }
      assert.deepEqual(
        [...sections],
        [
          [
            's',
            [
              'speed',
              'start',
              'end',
              'loop',
              'loopStart',
              'loopEnd',
              'reverse',
              'gain',
            ],
          ],
          ['f', ['frequency', 'q']],
          ['g', ['gain']],
        ],
        'a section per node, in the order the script made them, with all of each node’s parameters',
      );
      assert.deepEqual(h.runner.warnings(ONE), []);
      assert.strictEqual(
        control(h, ONE, '#f › frequency').group.type,
        'lowpass',
      );
      assert.false(
        h.runner.controls(ONE).some((c) => c.label === 'pan'),
        'the host’s own pan is not among them',
      );

      move(h, ONE, '#f › frequency', 500);
      assert.strictEqual(paramOf(h, ONE, 'f', 'frequency').value, 500);
      assert.strictEqual(
        paramOf(h, ONE, 'g', 'gain').value,
        0.8,
        'each control is its own node’s',
      );

      // the same nodes however they are found: the stored value follows the node, not the selector
      await h.setScript(ONE, `${CHAIN}controls('*');`);
      assert.strictEqual(paramOf(h, ONE, 'f', 'frequency').value, 500);
      assert.strictEqual(h.runner.controls(ONE).length, 11);
      await h.setScript(ONE, `${CHAIN}slider('#f', 'frequency');`);
      assert.strictEqual(control(h, ONE, '#f › frequency').value, 500);

      await h.setScript(ONE, `controls();\n${CHAIN}`);
      assert.true(
        h.runner
          .warnings(ONE)[0]!
          .message.includes('has made no nodes at this point'),
        'before the chain there is nothing yet',
      );
      assert.strictEqual(h.runner.warnings(ONE)[0]!.line, 1);
    });

    test('a selector that finds several nodes: controls() gives each its own section; nodes with no id are found by position', async function (assert) {
      const h = await startProject(
        oneTrack(
          `__().sampler({ buffer: 'kick' }).lowpass(800).lowpass({ frequency: 300, q: 4 }).to('channel');\ncontrols('lowpass');`,
        ),
      );
      assert.deepEqual(
        h.runner
          .controls(ONE)
          .map((c) => [c.key, c.group.id, c.group.byPosition, c.value]),
        [
          ['#lowpass-0 › frequency', 'lowpass-0', true, 800],
          ['#lowpass-0 › q', 'lowpass-0', true, 1],
          ['#lowpass-1 › frequency', 'lowpass-1', true, 300],
          ['#lowpass-1 › q', 'lowpass-1', true, 4],
        ],
        'each matched node has all of its own parameters, with its own values',
      );

      move(h, ONE, '#lowpass-1 › frequency', 111);
      assert.deepEqual(
        [...h.engine.scope(ONE).select('lowpass')].map(
          (node) => node.param('frequency').value,
        ),
        [800, 111],
        'and moving one moves only that node',
      );
    });

    test('a chain, a selection or a node can be given instead of a selector', async function (assert) {
      const h = await startProject(
        oneTrack(`const kick = __().sampler({ buffer: 'kick' }).lowpass(2000).gain({ id: 'level', gain: 0.8 }).to('channel');
const other = __().sine(110).gain(0).to('channel');
controls(kick, ['frequency', 'gain']);
slider(kick.nodes.filter('lowpass'), 'q', { label: 'Res' });
knob(kick.tail, 'gain');
slider(__('sine').first(), 'frequency');
slider(other.nodes, 'detune');`),
      );
      assert.deepEqual(h.runner.warnings(ONE), []);
      assert.deepEqual(
        h.runner.controls(ONE).map((c) => `${c.kind} ${c.key} [${c.group.id}]`),
        [
          'slider #sampler-0 › gain [sampler-0]',
          'slider #lowpass-0 › frequency [lowpass-0]',
          'slider #lowpass-0 › q [lowpass-0]',
          'knob #level › gain [level]',
          'slider #sine-0 › frequency [sine-0]',
          'slider #sine-0 › detune [sine-0]',
        ],
        'resolved to node ids when declared; the explicit knob replaces the slider controls() gave #level',
      );
      assert.strictEqual(control(h, ONE, '#lowpass-0 › q').label, 'Res');
      assert.true(control(h, ONE, '#lowpass-0 › q').group.byPosition);
      assert.false(control(h, ONE, '#level › gain').group.byPosition);
      assert.deepEqual(
        h.runner.declarations(ONE).map((d) => d.nodes),
        [
          ['sampler-0'],
          ['lowpass-0'],
          ['lowpass-0'],
          ['level'],
          ['sine-0'],
          ['sine-0'],
        ],
        'only ids leave the script',
      );

      move(h, ONE, '#lowpass-0 › q', 9);
      assert.strictEqual(paramOf(h, ONE, 'lowpass-0', 'q').value, 9);
      await h.setScript(ONE, `${scriptOf(h, ONE)}\n// again`);
      assert.strictEqual(
        paramOf(h, ONE, 'lowpass-0', 'q').value,
        9,
        'kept through a run',
      );
    });

    test('a selection of several nodes given to slider() is one control that moves them together', async function (assert) {
      const h = await startProject(
        oneTrack(`const voices = __().saw(110).gain(0.1).to('channel');
__().saw(220).gain(0.1).to('channel');
slider(__('saw'), 'detune');
controls();`),
      );
      const key = '#saw-0, #saw-1 › detune';
      const detune = control(h, ONE, key);
      assert.strictEqual(detune.group.label, 'several (2 nodes)');
      assert.deepEqual(
        h.runner
          .controls(ONE)
          .filter((c) => c.label === 'detune')
          .map((c) => c.key),
        [key],
        'controls() does not add a second detune for either node',
      );

      move(h, ONE, key, 12);
      assert.deepEqual(
        [...h.engine.scope(ONE).select('saw')].map(
          (node) => node.param('detune').value,
        ),
        [12, 12],
      );
    });

    test('nodes Euclip makes are never a script’s: not controlled, not found by its selectors', async function (assert) {
      const h = await startProject(
        oneTrack(`${CHAIN}controls('*');
slider('*', 'pan');
slider('panner', 'pan');
globalThis.euclipFound = [...__('*')].map((node) => node.id);
__('*').set({ pan: 1 });`),
      );
      const pan = [...h.engine.scope(ONE).bus(OUT_BUS).inserts][0]!;
      assert.strictEqual(pan.id, HOST_PAN_ID);
      assert.strictEqual(
        pan.tags['euclip'],
        'host',
        'it is tagged as the host’s',
      );
      assert.deepEqual(
        (globalThis as unknown as { euclipFound: string[] }).euclipFound,
        ['s', 'f', 'g'],
        'a track script’s selectors do not find it: it is in the scope above',
      );
      assert.strictEqual(
        pan.param('pan').value,
        0,
        'so the script’s own set() cannot move it',
      );
      assert.false(
        h.runner.controls(ONE).some((c) => c.label === 'pan'),
        'and nothing declares a control for it',
      );
      assert.strictEqual(
        h.runner.warnings(ONE).length,
        2,
        'slider(…, "pan") finds nothing to control',
      );
      delete (globalThis as unknown as { euclipFound?: string[] }).euclipFound;
    });

    test('the project script’s controls() takes only its own nodes, not the tracks’ nor their pans', async function (assert) {
      const doc = applyOperation(arrayDefaultProject(), {
        type: 'setScript',
        scope: PROJECT_SCOPE,
        script: `__.bus('main').compressor({ id: 'glue' });\ncontrols();\nslider('panner', 'pan');`,
      });
      const h = await startProject(doc);
      assert.deepEqual(
        [...new Set(h.runner.controls(PROJECT_SCOPE).map((c) => c.group.id))],
        ['glue'],
      );
      assert.true(
        h.runner
          .warnings(PROJECT_SCOPE)[0]!
          .message.includes('matches no node'),
        'the tracks’ pans are found by the root’s selectors, but no declaration reaches them',
      );
    });

    test('an explicit declaration wins over the same parameter from controls()', async function (assert) {
      for (const order of [
        `knob('#f', 'q', { label: 'Res' });\ncontrols('#f');`,
        `controls('#f');\nknob('#f', 'q', { label: 'Res' });`,
      ]) {
        const h = await startProject(oneTrack(CHAIN + order));
        const q = control(h, ONE, '#f › q');
        assert.strictEqual(q.kind, 'knob');
        assert.strictEqual(q.label, 'Res');
        assert.false(q.implicit);
        assert.true(control(h, ONE, '#f › frequency').implicit);
        assert.strictEqual(h.runner.controls(ONE).length, 2);
      }
    });

    test('a select is declared for a parameter that takes one of a list', async function (assert) {
      const h = await startProject(
        oneTrack(
          `__().sine(220).chooser({ id: 'c' }).gain(0.1).to('channel');\nselect('#c', 'shape');\ncontrols('#c');\nslider('#c', 'shape');`,
        ),
        2,
        [chooser],
      );
      const shape = control(h, ONE, '#c › shape');
      assert.strictEqual(shape.kind, 'select');
      assert.false(
        shape.implicit,
        'the explicit select() wins over controls()',
      );
      assert.deepEqual(shape.meta, {
        kind: 'choice',
        choices: ['soft', 'hard', 'fold'],
      });
      assert.strictEqual(shape.value, 'soft');
      assert.deepEqual(
        h.runner.controls(ONE).map((c) => `${c.label}:${c.kind}`),
        ['shape:select', 'amount:slider'],
      );
      assert.true(
        h.runner
          .warnings(ONE)[0]!
          .message.includes('slider() cannot show. Use select()'),
        h.runner.warnings(ONE)[0]!.message,
      );

      move(h, ONE, '#c › shape', 'fold');
      assert.strictEqual(paramOf(h, ONE, 'c', 'shape').value, 'fold');
      await h.setScript(ONE, `${scriptOf(h, ONE)}\n// again`);
      assert.strictEqual(
        paramOf(h, ONE, 'c', 'shape').value,
        'fold',
        'kept through a run',
      );
    });

    test('declared options: a label, a mode, a narrower range', async function (assert) {
      const h = await startProject(
        oneTrack(
          `${CHAIN}slider('#f', 'frequency', { label: 'Cutoff', mode: 'note', min: 100, max: 5000 });\nslider('#g', 'gain', { mode: 'nonsense' });`,
        ),
      );
      const cutoff = control(h, ONE, '#f › frequency');
      assert.strictEqual(cutoff.label, 'Cutoff');
      assert.strictEqual(cutoff.mode, 'note');
      assert.deepEqual(
        [
          (cutoff.meta as { min: number }).min,
          (cutoff.meta as { max: number }).max,
        ],
        [100, 5000],
      );
      assert.strictEqual(
        control(h, ONE, '#g › gain').mode,
        'linear',
        'a mode that does not exist is ignored',
      );

      h.apply({
        type: 'setControlOptions',
        scope: ONE,
        key: '#f › frequency',
        options: { mode: 'cents' },
      });
      assert.strictEqual(
        control(h, ONE, '#f › frequency').mode,
        'cents',
        'the user’s choice overrides the script’s',
      );
      h.apply({
        type: 'setControlOptions',
        scope: ONE,
        key: '#f › frequency',
        options: { mode: undefined },
      });
      assert.strictEqual(
        control(h, ONE, '#f › frequency').mode,
        'note',
        'and can be given up',
      );
    });

    test('a control of its own has a name, a value in the project, and can be read any time', async function (assert) {
      const seen = globalThis as unknown as { euclipSeen?: unknown[] };
      seen.euclipSeen = [];
      const h = await startProject(
        oneTrack(`${CHAIN}const density = slider('density', { min: 0, max: 1, default: 0.5 });
const fills = toggle('fills', { default: true });
globalThis.euclipSeen.push(['build', density.value, fills.value]);
__.transport.sequence('s', { steps: 2, step: '1/2' }, () => {
  globalThis.euclipSeen.push(density.value);
});`),
      );
      assert.deepEqual(
        h.runner
          .controls(ONE)
          .map((c) => [c.key, c.kind, c.group.id, c.group.label, c.value]),
        [
          ['density', 'slider', OWN_GROUP, 'Track', 0.5],
          ['fills', 'toggle', OWN_GROUP, 'Track', true],
        ],
      );
      assert.deepEqual(control(h, ONE, 'density').meta, {
        kind: 'number',
        min: 0,
        max: 1,
        unit: 'none',
        name: 'density',
        stepSeconds: 1,
      });

      move(h, ONE, 'density', 0.9);
      assert.deepEqual(storedIn(h, ONE), { density: 0.9 });
      assert.strictEqual(control(h, ONE, 'density').value, 0.9);

      await h.render();
      assert.deepEqual(
        seen.euclipSeen[0],
        ['build', 0.5, true],
        'read while building',
      );
      assert.strictEqual(
        seen.euclipSeen[1],
        0.9,
        'and read live inside a callback, after it was moved',
      );
      delete seen.euclipSeen;
    });

    test('control.set() from a script moves the control and the parameter together, on the step', async function (assert) {
      // A sine whose level control starts at 0. On the third quarter note (1 second in, at 120 bpm) the
      // script turns its own control up.
      const script = `__().sine({ id: 'osc', frequency: 440 }).gain({ id: 'g', gain: 0 }).to('channel');
const level = slider('#g', 'gain');
__.transport.sequence('s', { steps: [0, 0, 1, 0], step: '1/4' }, (ev) => {
  if (ev.value) level.set(0.5);
});`;
      const h = await startProject(oneTrack(script), 2);
      const key = controlKey('#g', 'gain');
      assert.strictEqual(control(h, ONE, key).value, 0);

      const rendered = await h.render();

      assert.true(peak(rendered, 0.05, 0.98) < 1e-4, 'silent until the step');
      assert.true(
        peak(rendered, 1.02, 1.5) > 0.3,
        `sounding from the step (peak ${peak(rendered, 1.02, 1.5)})`,
      );
      assert.strictEqual(
        control(h, ONE, key).value,
        0.5,
        'the control moved with it',
      );
      assert.strictEqual(
        control(h, ONE, key).effective,
        null,
        'control and parameter agree',
      );
      assert.deepEqual(storedIn(h, ONE), { [key]: 0.5 }, 'and it is stored');
      assert.deepEqual(
        h.derived,
        [{ type: 'setControlValue', scope: ONE, key, value: 0.5 }],
        'as a change from the script, not a step to undo',
      );

      await h.setScript(ONE, `${script}\n// run again`);
      assert.strictEqual(
        paramOf(h, ONE, 'g', 'gain').value,
        0.5,
        'the stored value passes through the next run',
      );
    });

    test('a parameter moved directly by code does not move the control: the control shows both', async function (assert) {
      const script = `${CHAIN}slider('#f', 'frequency');
__.transport.sequence('s', { steps: [0, 1], step: '1/4' }, (ev) => {
  if (ev.value) __('#f').set({ frequency: 900 });
});`;
      const h = await startProject(oneTrack(script), 1);
      const key = controlKey('#f', 'frequency');

      await h.render();
      assert.strictEqual(
        paramOf(h, ONE, 'f', 'frequency').value,
        900,
        'the parameter moved',
      );
      assert.strictEqual(
        control(h, ONE, key).value,
        2000,
        'the control is where it was',
      );
      assert.strictEqual(
        control(h, ONE, key).effective,
        900,
        'and shows where the parameter is',
      );
      assert.deepEqual(storedIn(h, ONE), {}, 'nothing was stored');
      assert.deepEqual(h.derived, []);

      move(h, ONE, key, 500);
      assert.strictEqual(control(h, ONE, key).value, 500);
      assert.strictEqual(
        control(h, ONE, key).effective,
        null,
        'moving the control puts the parameter back under it',
      );
    });
  });

  module('sections, buses and the channel', function () {
    const heading = (h: Harness, scope: string): string[] => {
      const seen = new Map<string, string>();
      for (const c of h.runner.controls(scope)) {
        const g = c.group;
        seen.set(
          g.id,
          `${g.chain}: ${g.type}${g.ordinal === null ? '' : ` ${g.ordinal}`}${g.name === null ? '' : ` "${g.name}"`}${g.byPosition ? ' (no id)' : ''}${g.bus === null ? '' : ` [${g.bus}]`}`,
        );
      }
      return [...seen.values()];
    };

    test('sections follow the script’s chains; a node is headed by its type, its id if it was given one, a number if it has twins', async function (assert) {
      const h = await startProject(
        oneTrack(`const drum = __().sampler({ buffer: 'kick' }).lowpass(800).highpass({ id: 'filter', frequency: 100 }).lowpass(300).to('channel');
__().sine(110).gain(0).to('channel');
slider('gain', 'gain');
slider('#filter', 'frequency');
controls(drum);
slider('sine', 'frequency');`),
      );
      assert.deepEqual(h.runner.warnings(ONE), []);
      assert.deepEqual(
        heading(h, ONE),
        [
          '0: sampler (no id)',
          '0: lowpass 1 (no id)',
          '0: highpass "filter"',
          '0: lowpass 2 (no id)',
          '1: sine (no id)',
          '1: gain (no id)',
        ],
        'in the order the script wrote the nodes, chain by chain, whatever order the controls were declared in',
      );
      assert.deepEqual(
        h.runner
          .controls(ONE)
          .filter((c) => c.group.id === 'filter')
          .map((c) => c.label),
        ['frequency', 'q'],
        'within a node, the order declared',
      );
      assert.false(
        JSON.stringify(
          h.runner
            .controls(ONE)
            .map((c) => [c.group.type, c.group.name, c.group.ordinal]),
        ).includes('lowpass-'),
        'an automatic id is never part of a heading',
      );
      assert.strictEqual(
        control(h, ONE, '#lowpass-1 › frequency').group.label,
        'lowpass 2',
      );
      assert.strictEqual(
        control(h, ONE, '#filter › frequency').group.label,
        'highpass filter',
      );
    });

    test('a bus can be given for its level; its inserts are sections of the same block', async function (assert) {
      const h = await startProject(
        oneTrack(`__.bus('drums').compressor({ id: 'squash' }).to('channel');
__().sampler({ id: 's', buffer: 'kick' }).to('drums');
const level = knob(__.bus('drums'), 'gain', { default: 0.5 });
globalThis.euclipLevel = level;
controls('#squash', ['threshold']);
controls('#s', ['speed']);`),
      );
      const key = busKey('drums');
      assert.strictEqual(key, 'bus drums › gain', 'keyed by the bus’s name');
      assert.strictEqual(h.runner.error(ONE)?.message, undefined);
      assert.deepEqual(h.runner.warnings(ONE), []);
      assert.deepEqual(
        h.runner
          .controls(ONE)
          .map((c) => `${c.kind} ${c.key} = ${String(c.value)}`),
        [
          `knob ${key} = 0.5`,
          'slider #squash › threshold = -24',
          'slider #s › speed = 1',
        ],
        'the bus’s level comes before its inserts',
      );
      assert.deepEqual(heading(h, ONE), [
        '0: level [drums]',
        '0: compressor "squash" [drums]',
        '1: sampler "s"',
      ]);
      const level = control(h, ONE, key);
      assert.strictEqual(level.label, 'level');
      assert.deepEqual(
        level.modes,
        ['linear', 'decibels'],
        'the units of any level',
      );
      assert.deepEqual(
        h.runner.declarations(ONE).find((d) => d.key === key)?.bindings,
        [{ type: 'bus', name: 'drums' }],
        'only the name leaves the script',
      );
      const bus = h.engine.scope(ONE).scope('script').bus('drums');
      assert.strictEqual(
        bus.gain.value,
        0.5,
        'with nothing stored the bus is at the declared default',
      );

      move(h, ONE, key, 0.25);
      assert.strictEqual(bus.gain.value, 0.25);
      assert.deepEqual(storedIn(h, ONE), { [key]: 0.25 });
      assert.strictEqual(control(h, ONE, key).effective, null);
      await h.setScript(ONE, `${scriptOf(h, ONE)}\n// again`);
      assert.strictEqual(
        bus.gain.value,
        0.25,
        'the stored level is applied when the script runs',
      );

      (
        globalThis as unknown as { euclipLevel: { set(v: number): void } }
      ).euclipLevel.set(0.75);
      assert.strictEqual(
        bus.gain.value,
        0.75,
        'the handle moves bus and control together',
      );
      assert.strictEqual(control(h, ONE, key).value, 0.75);

      h.apply({ type: 'resetControl', scope: ONE, key });
      await h.runner.run(ONE, true);
      assert.strictEqual(bus.gain.value, 0.5, 'reset: back to the default');
      assert.true(
        h.runner.sendsToChannel(ONE),
        'a bus of the script’s routed to channel counts as sending there',
      );
      delete (globalThis as unknown as { euclipLevel?: unknown }).euclipLevel;

      await h.setScript(
        ONE,
        `const squash = __.bus('drums').compressor({ id: 'squash' }).to('channel');
__().sampler({ id: 's', buffer: 'kick' }).to('drums');
controls(squash);
controls(__.bus('drums'));
controls(__.bus('drums').delay({ id: 'echo' }));
controls(__.bus('fx').overdrive({ id: 'dirt' }));`,
      );
      assert.strictEqual(h.runner.error(ONE)?.message, undefined);
      assert.deepEqual(h.runner.warnings(ONE), []);
      assert.deepEqual(
        heading(h, ONE),
        [
          '0: level [drums]',
          '0: compressor "squash" [drums]',
          '0: delay "echo" [drums]',
          '2: overdrive "dirt" [fx]',
        ],
        'controls(bus) is its level; what adding inserts returns works as a chain does, and gives those inserts',
      );
    });

    test('a bus that is not the script’s, and anything but its level, are refused in words', async function (assert) {
      const h = await startProject(
        oneTrack(`${CHAIN}slider(__.bus('channel'), 'gain');
knob(__.bus('main'), 'gain');
__.bus('mine').to('channel');
slider(__.bus('mine'), 'pan');
toggle(__.bus('mine'), 'gain');
slider('*', 'pan');`),
      );
      const said = h.runner.warnings(ONE).map((w) => w.message);
      assert.strictEqual(said.length, 5);
      assert.true(said[0]!.includes("are the channel strip's"), said[0]);
      assert.true(said[1]!.includes('Main Output'), said[1]);
      assert.true(
        said[2]!.includes('a bus has one value to control, its level'),
        said[2],
      );
      assert.true(said[3]!.includes('Use slider() or knob()'), said[3]);
      assert.deepEqual(
        h.runner.controls(ONE),
        [],
        'and none of them is a control',
      );
      assert.strictEqual(
        h.engine.scope(ONE).bus(OUT_BUS).gain.value,
        1,
        'the channel strip’s level was not touched',
      );
    });

    test('the default project script declares the master level on the main bus', async function (assert) {
      const h = await startProject();
      const key = busKey('main');
      assert.deepEqual(h.runner.warnings(PROJECT_SCOPE), []);
      assert.deepEqual(
        h.runner
          .controls(PROJECT_SCOPE)
          .map(
            (c) =>
              `${c.group.bus} ${c.group.type}: ${c.label} = ${String(c.value)}`,
          ),
        [
          'main level: master = 0.8',
          'main compressor: threshold = -18',
          'main compressor: ratio = 3',
        ],
      );
      assert.strictEqual(h.engine.bus('main').gain.value, 0.8);
      move(h, PROJECT_SCOPE, key, 0.4);
      assert.strictEqual(h.engine.bus('main').gain.value, 0.4);
    });

    test('whether a track’s script sends anything to its channel is known from its graph', async function (assert) {
      const h = await startProject();
      assert.strictEqual(OUT_BUS, 'channel');
      assert.true(h.runner.sendsToChannel(KICK));
      await h.setScript(
        KICK,
        scriptOf(h, KICK).replace(".to('channel')", ".to('main')"),
      );
      assert.strictEqual(h.runner.error(KICK), null);
      assert.false(
        h.runner.sendsToChannel(KICK),
        'it goes straight to main: the strip has nothing to act on',
      );
      await h.setScript(
        KICK,
        scriptOf(h, KICK).replace(".to('main')", ".to('out')"),
      );
      assert.true(
        /no bus called "out"/.test(h.runner.error(KICK)?.message ?? ''),
        'the old name is no bus at all now: the script says so, and the last version plays on',
      );
      assert.false(h.runner.sendsToChannel(KICK));
      await h.setScript(
        KICK,
        scriptOf(h, KICK).replace(".to('out')", ".to('channel')"),
      );
      assert.true(h.runner.sendsToChannel(KICK));
      assert.true(
        h.runner.sendsToChannel('t-nothing'),
        'nothing running: nothing to say',
      );
    });
  });

  module('ranges from live data', function () {
    const REGION = `__().sampler({ id: 's', buffer: 'kick' }).to('channel');\ncontrols('#s', ['start', 'end', 'speed']);`;
    const number = (h: Harness, key: string) => {
      const c = control(h, ONE, key);
      if (c.meta.kind !== 'number') throw new Error('not a number');
      return { ...c, meta: c.meta, map: mapping(c.mode, c.meta) };
    };

    test('a sampler’s start and end run the length of the sample it plays, and keep to their own sides', async function (assert) {
      const h = await startProject(oneTrack(REGION));
      const length = h.engine.buffers.get('kick')!.duration!;
      assert.true(length > 0.05, `the kick is ${length}s long`);
      assert.true(length < 60);

      const start = number(h, '#s › start');
      const end = number(h, '#s › end');
      assert.strictEqual(
        start.meta.max,
        length,
        'not the parameter’s 60 seconds',
      );
      assert.strictEqual(end.meta.max, length);
      assert.strictEqual(
        end.value,
        length,
        'an end of 0 means the end of the sample: the control stands there',
      );
      assert.strictEqual(end.map.toPosition(end.value as number), 1);
      assert.strictEqual(end.effective, null);
      assert.deepEqual(
        start.modes,
        ['seconds', 'ms', 'steps', 'percent'],
        'a place in a sample',
      );
      assert.strictEqual(mapping('percent', end.meta).format(length), '100%');
      assert.strictEqual(start.waiting, undefined);

      move(h, ONE, '#s › end', length / 2);
      assert.strictEqual(
        number(h, '#s › start').meta.ceiling,
        length / 2 - REGION_GAP,
      );
      assert.strictEqual(
        number(h, '#s › start').map.toValue(1),
        length / 2 - REGION_GAP,
        'start stops short of end',
      );
      assert.strictEqual(
        number(h, '#s › start').map.toPosition(length / 2),
        0.5,
        'on a travel that is still the whole sample',
      );
      move(h, ONE, '#s › start', length / 4);
      assert.strictEqual(
        number(h, '#s › end').map.toValue(0),
        length / 4 + REGION_GAP,
        'end stops short of start',
      );
      assert.strictEqual(
        number(h, '#s › end').map.parse('0'),
        length / 4 + REGION_GAP,
      );

      // slices, once the sample has them
      h.engine.buffers.get('kick')!.slices = [
        0,
        length / 4,
        length / 2,
        length,
      ];
      assert.deepEqual(number(h, '#s › start').modes, [
        'seconds',
        'ms',
        'steps',
        'percent',
        'slice',
      ]);
      h.apply({
        type: 'setControlOptions',
        scope: ONE,
        key: '#s › end',
        options: { mode: 'slice' },
      });
      assert.strictEqual(number(h, '#s › end').mode, 'slice');
      assert.strictEqual(
        number(h, '#s › end').map.format(length / 2),
        'slice 1',
        'an end is the slice it ends',
      );
      assert.strictEqual(number(h, '#s › start').meta.edge, 'start');

      const speed = number(h, '#s › speed');
      assert.deepEqual(speed.modes, ['ratio', 'semitones', 'ratio-cents']);
      assert.strictEqual(
        speed.meta.max,
        8,
        'a parameter with no live range keeps its own',
      );
    });

    test('until the sample is there the parameter’s own range stands, and the control says it is waiting', async function (assert) {
      const h = await startProject(oneTrack(REGION));
      const before = h.changes;
      await h.setScript(
        ONE,
        REGION.replace("buffer: 'kick'", "buffer: 'late'"),
      );
      const start = number(h, '#s › start');
      assert.strictEqual(start.meta.max, 60);
      assert.true(/late/.test(start.waiting ?? ''), start.waiting);
      assert.deepEqual(
        start.modes,
        ['seconds', 'ms', 'steps'],
        'only a time, for now',
      );

      const kick = h.engine.buffers.get('kick')!.buffer!;
      const changes = h.changes;
      assert.true(changes > before);
      h.engine.buffers.add('later', kick);
      await h.engine.buffers.get('later')!.ready;
      assert.true(h.changes > changes, 'the UI is told when a sample arrives');
      await h.setScript(
        ONE,
        REGION.replace("buffer: 'kick'", "buffer: 'later'"),
      );
      assert.strictEqual(number(h, '#s › start').meta.max, kick.duration);
      assert.strictEqual(number(h, '#s › start').waiting, undefined);
    });

    test('a time can be shown in steps of the track’s sequence at the tempo', async function (assert) {
      const h = await startProject(
        oneTrack(`__().sine(220).adsr({ id: 'env' }).to('channel');
__.transport.sequence('steps', { steps: 8, step: '1/8' }, () => {});
stepGrid('steps');
slider('#env', 'attack');`),
      );
      const attack = number(h, '#env › attack');
      assert.deepEqual(attack.modes, ['seconds', 'ms', 'steps']);
      assert.strictEqual(attack.meta.stepSeconds, 0.25, 'an eighth at 120');
      h.apply({ type: 'setBpm', bpm: 60 });
      assert.strictEqual(
        number(h, '#env › attack').meta.stepSeconds,
        0.5,
        'it follows the tempo',
      );
      h.apply({
        type: 'setControlOptions',
        scope: ONE,
        key: '#env › attack',
        options: { mode: 'steps' },
      });
      const steps = number(h, '#env › attack');
      move(h, ONE, '#env › attack', steps.map.parse('1.5')!);
      assert.strictEqual(
        paramOf(h, ONE, 'env', 'attack').value,
        0.75,
        'stored and set in seconds',
      );
      assert.strictEqual(
        number(h, '#env › attack').map.format(0.75),
        '1.5 steps',
      );
    });
  });

  module('where the parameter really is', function () {
    const wait = (ms: number): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, ms));

    test('a person’s own move never shows as "the parameter is elsewhere"; code moving it does, after a moment', async function (assert) {
      const h = await startProject(
        oneTrack(`${CHAIN}slider('#f', 'frequency');`),
        2,
        [],
        { realtime: true },
      );
      const key = '#f › frequency';
      const seen: unknown[] = [];
      for (const value of [300, 310, 2500, 2400, 900, 905]) {
        move(h, ONE, key, value);
        seen.push(control(h, ONE, key).effective);
      }
      await wait(EFFECTIVE_DELAY_MS + 60);
      seen.push(control(h, ONE, key).effective);
      assert.deepEqual(
        seen,
        [null, null, null, null, null, null, null],
        'a quick drag never shows the marker, then or later',
      );

      // something else moves the parameter: a callback, a set in the console
      paramOf(h, ONE, 'f', 'frequency').set(4000);
      assert.strictEqual(
        control(h, ONE, key).effective,
        null,
        'not at once: it might be passing through',
      );
      const changes = h.changes;
      await wait(EFFECTIVE_DELAY_MS + 60);
      assert.true(h.changes > changes, 'the UI is told when the moment is up');
      assert.strictEqual(
        control(h, ONE, key).effective,
        4000,
        'it has stayed away: now the control says where',
      );
      assert.strictEqual(control(h, ONE, key).value, 905);

      move(h, ONE, key, 1000);
      assert.strictEqual(
        control(h, ONE, key).effective,
        null,
        'moving the control puts them together again, at once',
      );

      // a brief visit elsewhere and back never shows
      paramOf(h, ONE, 'f', 'frequency').set(5000);
      void control(h, ONE, key).effective;
      await wait(40);
      paramOf(h, ONE, 'f', 'frequency').set(1000);
      assert.strictEqual(control(h, ONE, key).effective, null);
      await wait(EFFECTIVE_DELAY_MS + 60);
      assert.strictEqual(control(h, ONE, key).effective, null);

      // nearer than the control can show is not elsewhere
      paramOf(h, ONE, 'f', 'frequency').set(1000.5);
      void control(h, ONE, key).effective;
      await wait(EFFECTIVE_DELAY_MS + 60);
      assert.strictEqual(
        control(h, ONE, key).effective,
        null,
        'half a hertz at 1 kHz is the same place on the slider',
      );
      h.runner.dispose();
    });
  });

  module('controls() is all the UI', function () {
    const kinds = (h: Harness, scope = ONE): string[] =>
      h.runner
        .declarations(scope)
        .filter((d) => !d.hidden)
        .map((d) => `${d.kind} ${d.key}${d.implicit ? '' : ' (explicit)'}`);

    test('one line: controls for every node, a waveform for every sampler, a grid for every named sequence', async function (assert) {
      const h = await startProject(
        oneTrack(`__().sampler({ id: 's', buffer: 'kick' }).gain({ id: 'g', gain: 0.8 }).to('channel');
__.transport.sequence('steps', { steps: [1, 0, 1, 0] }, (ev) => { if (ev.value) __('#s').trigger(); });
controls();
__.transport.sequence('late', { steps: [0, 1] }, () => {});
__.transport.sequence({ steps: 4 }, () => {});`),
      );
      assert.deepEqual(h.runner.warnings(ONE), []);
      assert.strictEqual(h.runner.error(ONE), null);
      assert.deepEqual(
        h.runner
          .stepGrids(ONE)
          .map((grid) => `${grid.name} ${grid.steps.join('')}`),
        ['steps 1010', 'late 01'],
        'a grid for each named sequence, the one made after the call too; none for the unnamed one',
      );
      assert.deepEqual(
        h.runner.waveforms(ONE).map((w) => w.nodeId),
        ['s'],
        'a waveform for the sampler',
      );
      assert.deepEqual(
        [...new Set(h.runner.controls(ONE).map((c) => c.group.id))],
        ['s', 'g'],
        'and the nodes’ parameters, as before',
      );
      assert.strictEqual(
        h.runner.waveforms(ONE)[0]!.params['start']!.key,
        '#s › start',
        'the waveform is a view over the same controls',
      );
      assert.strictEqual(
        h.runner.stepGrids(ONE)[0]!.line,
        3,
        'each points at the controls() line',
      );

      // a pattern edited in such a grid is stored and applied like any other
      h.apply(h.runner.toggleStepOperation(ONE, 'late', 0));
      assert.deepEqual(
        h.doc.tracks[0]!.values.controls['stepGrid › late']?.value,
        [1, 1],
      );
      await h.setScript(ONE, `${scriptOf(h, ONE)}\n// again`);
      assert.deepEqual(
        h.runner.stepGrids(ONE).find((grid) => grid.name === 'late')!.steps,
        [1, 1],
      );
    });

    test('a stepGrid, waveform or slider of the script’s own is used instead, before or after, with no duplicate and no warning', async function (assert) {
      const BODY = `__().sampler({ id: 's', buffer: 'kick' }).to('channel');
__.transport.sequence('steps', { steps: 4 }, () => {});`;
      for (const [order, script] of [
        [
          'before',
          `${BODY}\nstepGrid('steps', { label: 'Hits' });\nwaveform('#s', { label: 'Drum' });\nknob('#s', 'gain');\ncontrols();`,
        ],
        [
          'after',
          `${BODY}\ncontrols();\nstepGrid('steps', { label: 'Hits' });\nwaveform('#s', { label: 'Drum' });\nknob('#s', 'gain');`,
        ],
      ] as const) {
        const h = await startProject(oneTrack(script));
        assert.deepEqual(h.runner.warnings(ONE), [], `${order}: no warnings`);
        assert.deepEqual(
          h.runner.stepGrids(ONE).map((grid) => grid.label),
          ['Hits'],
          `${order}: one grid, the script’s own`,
        );
        assert.deepEqual(
          h.runner.waveforms(ONE).map((w) => w.label),
          ['Drum'],
          `${order}: one waveform, the script’s own`,
        );
        assert.deepEqual(
          kinds(h)
            .filter((kind) => /stepGrid|waveform|gain/.test(kind))
            .sort(),
          [
            'knob #s › gain (explicit)',
            'stepGrid stepGrid › steps (explicit)',
            'waveform #s › waveform (explicit)',
          ],
          `${order}: each once`,
        );
        assert.strictEqual(control(h, ONE, '#s › gain').kind, 'knob');
      }
    });

    test('controls(target) stays about those nodes’ parameters: no grid, no waveform', async function (assert) {
      const h = await startProject(
        oneTrack(`__().sampler({ id: 's', buffer: 'kick' }).to('channel');
__.transport.sequence('steps', { steps: 4 }, () => {});
controls('#s');`),
      );
      assert.deepEqual(h.runner.stepGrids(ONE), []);
      assert.deepEqual(h.runner.waveforms(ONE), []);
      assert.strictEqual(h.runner.controls(ONE).length, 8);
    });

    test('a script of only sequences: controls() still gives them grids', async function (assert) {
      const h = await startProject(
        oneTrack(
          `controls();\n__.transport.sequence('steps', { steps: [1, 1] }, () => {});`,
        ),
      );
      assert.deepEqual(
        h.runner.stepGrids(ONE).map((grid) => grid.name),
        ['steps'],
      );
      assert.true(
        h.runner.warnings(ONE)[0]!.message.includes('no nodes at this point'),
        'it says there were no nodes to make controls for',
      );
    });

    test('a step can be given a value: 0 is off, above 0 is on with that value, and it is what comes back', async function (assert) {
      const h = await startProject();
      h.apply(h.runner.setStepOperation(KICK, 'steps', 2, 3));
      assert.strictEqual(grid(h, KICK).steps[2], 3);
      assert.strictEqual(
        h.engine.scope(KICK).scope('script').transport.get('steps')!.steps[2],
        3,
        'the sequence has it',
      );
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 2));
      assert.strictEqual(grid(h, KICK).steps[2], 0);
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 2));
      assert.strictEqual(
        grid(h, KICK).steps[2],
        3,
        'switched on again, it is 3 again',
      );
      h.apply(h.runner.setStepOperation(KICK, 'steps', 2, 0));
      assert.strictEqual(grid(h, KICK).steps[2], 0);
      h.apply(h.runner.setStepOperation(KICK, 'steps', 3, 0.25));
      assert.strictEqual(
        grid(h, KICK).steps[3],
        0.25,
        'a fraction is a value too',
      );
      assert.strictEqual(h.runner.setStepOperation(KICK, 'steps', 99, 1), null);
      assert.strictEqual(h.runner.setStepOperation(KICK, 'nope', 0, 1), null);
      assert.strictEqual(
        h.runner.setStepOperation(KICK, 'steps', 0, NaN),
        null,
      );
    });
  });

  module('a speed synced to a sequence', function () {
    const SPEED = '#s › speed';
    // the loop is 4 s; 16 eighths at 120 are 4 s, 8 sixteenths 1 s
    const SYNCED = (more = '', options = "{ mode: 'sequence-sync' }") =>
      `__().sampler({ id: 's', buffer: 'loop' }).to('channel');
__.transport.sequence('slices', { steps: 16, step: '1/8' }, () => {});
${more}slider('#s', 'speed', ${options});`;
    const FILLS = `__.transport.sequence('fills', { steps: 8, step: '1/16' }, () => {});\n`;
    const speedOf = (h: Harness): number =>
      h.runner.sampler(ONE, 's')!.param('speed').value as number;
    const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;

    test('the control holds a multiplier; the speed is the sound’s length over the sequence’s, times it', async function (assert) {
      const h = await startProject(oneTrack(SYNCED()));
      const view = control(h, ONE, SPEED);
      assert.strictEqual(view.mode, 'sequence-sync');
      assert.strictEqual(view.value, 1, 'once through, with nothing stored');
      assert.false(view.stored);
      assert.true(near(speedOf(h), 1), '4 s of sound in 4 s of sequence');
      assert.strictEqual(view.effective, null, 'not out of step with itself');
      assert.deepEqual(storedIn(h, ONE), {}, 'nothing written');

      move(h, ONE, SPEED, 2);
      assert.true(near(speedOf(h), 2));
      assert.strictEqual(control(h, ONE, SPEED).value, 2);
      move(h, ONE, SPEED, 1 / 3);
      assert.true(near(speedOf(h), 1 / 3));
      assert.deepEqual(
        storedIn(h, ONE),
        { [SPEED]: 1 / 3 },
        'the multiplier is what is stored',
      );
      assert.strictEqual(control(h, ONE, SPEED).effective, null);
    });

    test('it follows the tempo, the sequence and the sound, with nothing stored and no rebuild', async function (assert) {
      const h = await startProject(oneTrack(SYNCED()));
      const node = h.runner.sampler(ONE, 's');
      h.apply({ type: 'setBpm', bpm: 90 });
      assert.true(
        near(speedOf(h), 0.75),
        `at 90 the sequence lasts longer (${speedOf(h)})`,
      );
      assert.strictEqual(
        h.runner.sampler(ONE, 's'),
        node,
        'the same node: no rebuild',
      );
      assert.deepEqual(h.derived, [], 'nothing dispatched');
      assert.deepEqual(storedIn(h, ONE), {});
      assert.strictEqual(control(h, ONE, SPEED).effective, null);
      h.apply({ type: 'setBpm', bpm: 120 });

      // the sequence: half as many steps is half as long
      await h.setScript(ONE, SYNCED().replace('steps: 16', 'steps: 8'));
      assert.true(near(speedOf(h), 2), 'half the steps');
      await h.setScript(ONE, SYNCED().replace("step: '1/8'", "step: '1/16'"));
      assert.true(near(speedOf(h), 2), 'half the step length');
      await h.setScript(ONE, SYNCED().replace("step: '1/8'", "span: '1 bar'"));
      assert.true(near(speedOf(h), 2), 'a span of one bar: 2 s');

      // the sound: the kick is shorter
      await h.setScript(
        ONE,
        SYNCED().replace("buffer: 'loop'", "buffer: 'kick'"),
      );
      const kick = h.engine.buffers.get('kick')!.duration!;
      assert.true(
        near(speedOf(h), kick / 4),
        `the kick's length over 4 s (${speedOf(h)})`,
      );
    });

    test('with no sound or no sequence the speed is 1, and the control says there is nothing to sync to', async function (assert) {
      const none = await startProject(
        oneTrack(`__().sampler({ id: 's', buffer: 'loop' }).to('channel');
slider('#s', 'speed', { mode: 'sequence-sync' });`),
      );
      assert.strictEqual(speedOf(none), 1);
      assert.true(
        /no named sequence/.test(control(none, ONE, SPEED).waiting ?? ''),
      );

      const silent = await startProject(
        oneTrack(SYNCED().replace("buffer: 'loop'", "buffer: 'nothing-here'")),
      );
      assert.strictEqual(speedOf(silent), 1);
      assert.true(
        /has not loaded/.test(control(silent, ONE, SPEED).waiting ?? ''),
      );
    });

    test('the sequence option names another; an item for each named sequence; a missing one falls back and recovers', async function (assert) {
      const h = await startProject(
        oneTrack(SYNCED(FILLS, "{ mode: 'sequence-sync', sequence: 'fills' }")),
      );
      assert.true(near(speedOf(h), 4), '4 s of sound in the 1 s of fills');
      assert.deepEqual(
        control(h, ONE, SPEED).choices.map((choice) => choice.label),
        [
          'Ratio',
          'Semitones',
          'Cents',
          'Sequence sync: slices',
          'Sequence sync: fills',
        ],
      );
      assert.strictEqual(control(h, ONE, SPEED).choice, 'sequence-sync:fills');

      // chosen from the menu: the other sequence, keeping the speed as near as the values allow
      for (const op of h.runner.modeOperations(
        ONE,
        SPEED,
        'sequence-sync:slices',
      ))
        h.apply(op);
      assert.strictEqual(control(h, ONE, SPEED).choice, 'sequence-sync:slices');
      assert.strictEqual(
        control(h, ONE, SPEED).value,
        4,
        'speed 4 over a factor of 1',
      );
      assert.true(near(speedOf(h), 4));
      for (const op of h.runner.modeOperations(
        ONE,
        SPEED,
        'sequence-sync:fills',
      ))
        h.apply(op);
      assert.strictEqual(control(h, ONE, SPEED).value, 1);
      assert.true(near(speedOf(h), 4));

      // the chosen sequence goes: speed 1, the choice kept and said to be missing
      await h.setScript(
        ONE,
        SYNCED('', "{ mode: 'sequence-sync', sequence: 'fills' }"),
      );
      assert.strictEqual(speedOf(h), 1);
      const lost = control(h, ONE, SPEED);
      assert.true(/no sequence named 'fills'/.test(lost.waiting ?? ''));
      assert.strictEqual(lost.choice, 'sequence-sync:fills');
      assert.deepEqual(lost.choices.map((choice) => choice.label).slice(3), [
        'Sequence sync',
        'Sequence sync: fills (missing)',
      ]);
      // ...and comes back
      await h.setScript(
        ONE,
        SYNCED(FILLS, "{ mode: 'sequence-sync', sequence: 'fills' }"),
      );
      assert.true(near(speedOf(h), 4), 'recovered');
      assert.strictEqual(control(h, ONE, SPEED).waiting, undefined);

      // no named sequence: no item at all for a speed that is not synced
      const plain = await startProject(
        oneTrack(
          `__().sampler({ id: 's', buffer: 'loop' }).to('channel');\nslider('#s', 'speed');`,
        ),
      );
      assert.deepEqual(
        control(plain, ONE, SPEED).choices.map((choice) => choice.label),
        ['Ratio', 'Semitones', 'Cents'],
      );
    });

    test('changing unit keeps the speed, as near as the multipliers allow', async function (assert) {
      const h = await startProject(oneTrack(SYNCED('', '{}')));
      move(h, ONE, SPEED, 1.4);
      for (const op of h.runner.modeOperations(
        ONE,
        SPEED,
        'sequence-sync:slices',
      ))
        h.apply(op);
      assert.strictEqual(
        control(h, ONE, SPEED).value,
        1.5,
        '1.4 is nearest 3/2',
      );
      assert.true(near(speedOf(h), 1.5));
      h.apply({ type: 'setBpm', bpm: 60 });
      assert.true(near(speedOf(h), 0.75), 'synced: it follows the tempo');
      for (const op of h.runner.modeOperations(ONE, SPEED, 'ratio'))
        h.apply(op);
      assert.strictEqual(control(h, ONE, SPEED).mode, 'ratio');
      assert.strictEqual(
        control(h, ONE, SPEED).value,
        0.75,
        'out of sync: the speed it was at',
      );
      h.apply({ type: 'setBpm', bpm: 120 });
      assert.true(near(speedOf(h), 0.75), 'and it no longer follows');
      for (const op of h.runner.modeOperations(ONE, SPEED, 'semitones'))
        h.apply(op);
      assert.true(near(speedOf(h), 0.75), 'another plain unit changes nothing');
    });

    test('control.set() from a script works in the multiplier; the sliced-loop template is synced', async function (assert) {
      const h = await startProject(
        oneTrack(`__().sampler({ id: 's', buffer: 'loop' }).to('channel');
__.transport.sequence('slices', { steps: 16, step: '1/16' }, () => {});
const speed = slider('#s', 'speed', { mode: 'sequence-sync' });
globalThis.euclipSpeed = speed.value;
speed.set(0.5);`),
      );
      assert.strictEqual(
        (globalThis as unknown as { euclipSpeed: number }).euclipSpeed,
        1,
      );
      assert.true(near(speedOf(h), 1), 'half of (4 s over 2 s)');
      assert.deepEqual(storedIn(h, ONE), { [SPEED]: 0.5 });

      const loop = newSlicedLoopTrack('loop');
      const t = await startProject({
        ...arrayDefaultProject(),
        tracks: [loop],
      });
      const sampler = t.runner.sampler(loop.id, 'sampler')!;
      assert.true(near(sampler.param('speed').value as number, 1));
      t.apply({ type: 'setBpm', bpm: 90 });
      assert.true(
        near(sampler.param('speed').value as number, 0.75),
        'the loop stays in time at 90',
      );
    });
  });

  module('declared step grids', function () {
    test('a grid exists only for a sequence with a stepGrid() line', async function (assert) {
      const h = await startProject(
        oneTrack(`${CHAIN}__.transport.sequence('a', { steps: [1, 0, 0] }, () => {});
__.transport.sequence('b', { steps: 32 }, () => {});
__.transport.sequence('quiet', { steps: 8 }, () => {});
stepGrid('b', { label: 'Long one', view: 'toggles' });
stepGrid('a');`),
      );
      assert.deepEqual(
        h.runner
          .stepGrids(ONE)
          .map((s) => [s.name, s.label, s.steps.length, s.view, s.line]),
        [
          ['b', 'Long one', 32, 'toggles', 5],
          ['a', 'a', 3, 'toggles', 6],
        ],
        'in the order declared; a sequence with no stepGrid() has no grid',
      );
      assert.strictEqual(
        h.engine.scope(ONE).scope('script').transport.sequences.length,
        3,
        'though it runs',
      );
      assert.strictEqual(
        h.runner.toggleStepOperation(ONE, 'quiet', 0),
        null,
        'and cannot be edited from the UI',
      );
    });

    test('a stored pattern is applied by the declaration; the steps in the script are the default', async function (assert) {
      const h = await startProject();
      const code = [...grid(h, KICK).steps];
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 1));
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 0));

      const edited = [0, 1, ...code.slice(2)];
      assert.deepEqual(grid(h, KICK).steps, edited, 'edited live');
      assert.true(grid(h, KICK).stored);
      assert.deepEqual(
        storedIn(h, KICK),
        { [STEPS]: edited },
        'stored as the pattern, with no copy of the script’s',
      );

      await h.setScript(
        KICK,
        scriptOf(h, KICK).replace('gain: 0.9', 'gain: 0.6'),
      );
      assert.deepEqual(grid(h, KICK).steps, edited, 'kept through a run');

      // while a pattern is stored it wins, even when the default in the script is edited
      await h.setScript(
        KICK,
        scriptOf(h, KICK).replace('steps: [1, 0, 0, 0,', 'steps: [1, 1, 1, 1,'),
      );
      assert.deepEqual(
        grid(h, KICK).steps,
        edited,
        'the stored pattern still wins',
      );
      assert.deepEqual(h.derived, [], 'nothing was dropped or rewritten');

      h.apply({ type: 'resetControl', scope: KICK, key: STEPS });
      await h.runner.run(KICK);
      assert.deepEqual(
        grid(h, KICK).steps.slice(0, 4),
        [1, 1, 1, 1],
        'Reset returns to the script’s steps as they are now',
      );
      assert.false(grid(h, KICK).stored);
      assert.deepEqual(storedIn(h, KICK), {});
    });

    module(
      'a sequence made with a count: the grid owns the pattern',
      function () {
        const COUNT = (steps: string, more = "stepGrid('s');") =>
          `${CHAIN}__.transport.sequence('s', { steps: ${steps}, step: '1/16' }, (ev) => { if (ev.value) __('#s').trigger(); });\n${more}`;
        const stepsOf = (h: Harness): number[] => [
          ...h.engine.scope(ONE).scope('script').transport.get('s')!.steps,
        ];
        test('a count with a grid starts empty and silent, and nothing is stored for that', async function (assert) {
          const h = await startProject(oneTrack(COUNT('8')));
          assert.deepEqual(grid(h, ONE, 's').steps, [0, 0, 0, 0, 0, 0, 0, 0]);
          assert.deepEqual(stepsOf(h), [0, 0, 0, 0, 0, 0, 0, 0]);
          assert.false(grid(h, ONE, 's').stored);
          assert.deepEqual(storedIn(h, ONE), {}, 'nothing written');
          assert.deepEqual(h.derived, [], 'by any road');
          assert.strictEqual(rms(await h.render()), 0, 'and it is silent');
          // (the same script with a step set is heard: the silence is the empty grid's)
          const loud = await startProject(oneTrack(COUNT('8')));
          loud.apply(loud.runner.toggleStepOperation(ONE, 's', 0));
          assert.true(rms(await loud.render()) > 0.001, 'a step set, it plays');

          // the same through controls(), whichever side of the sequence it is on
          const viaControls = await startProject(
            oneTrack(`controls();\n${COUNT('4', '')}`),
          );
          assert.deepEqual(grid(viaControls, ONE, 's').steps, [0, 0, 0, 0]);
          assert.deepEqual(storedIn(viaControls, ONE), {});
        });

        test('an explicit pattern is the default, all ones included; a count with no grid is left to fire every step', async function (assert) {
          const ones = await startProject(oneTrack(COUNT('[1, 1, 1, 1]')));
          assert.deepEqual(
            grid(ones, ONE, 's').steps,
            [1, 1, 1, 1],
            'four written on are four on',
          );
          const text = await startProject(oneTrack(COUNT("'x.x.'")));
          assert.deepEqual(grid(text, ONE, 's').steps, [1, 0, 1, 0]);

          const bare = await startProject(oneTrack(COUNT('4', '')));
          assert.deepEqual(bare.runner.stepGrids(ONE), [], 'no grid');
          assert.deepEqual(
            stepsOf(bare),
            [1, 1, 1, 1],
            'as the library makes it',
          );
        });

        test('the first step set is stored and plays; undoing it returns to empty', async function (assert) {
          const h = await startProject(oneTrack(COUNT('4')));
          const op = h.runner.toggleStepOperation(ONE, 's', 2)!;
          h.apply(op);
          assert.deepEqual(grid(h, ONE, 's').steps, [0, 0, 1, 0]);
          assert.deepEqual(storedIn(h, ONE), {
            [stepGridKey('s')]: [0, 0, 1, 0],
          });

          // through a rebuild the stored pattern wins, and the count is still read as a count
          await h.runner.run(ONE);
          assert.deepEqual(grid(h, ONE, 's').steps, [0, 0, 1, 0]);

          // undo: the store forgets the value (as its undo of a first edit does)
          h.apply({ type: 'resetControl', scope: ONE, key: stepGridKey('s') });
          await h.runner.run(ONE);
          assert.deepEqual(
            grid(h, ONE, 's').steps,
            [0, 0, 0, 0],
            'empty again',
          );
          assert.false(grid(h, ONE, 's').stored);
          assert.deepEqual(storedIn(h, ONE), {});
        });

        test('a changed count keeps the stored steps as far as they go, and the new ones are rests', async function (assert) {
          const h = await startProject(oneTrack(COUNT('4')));
          move(h, ONE, stepGridKey('s'), [1, 0, 2, 1]);
          await h.setScript(ONE, COUNT('6'));
          assert.deepEqual(grid(h, ONE, 's').steps, [1, 0, 2, 1, 0, 0]);
          await h.setScript(ONE, COUNT('2'));
          assert.deepEqual(grid(h, ONE, 's').steps, [1, 0]);
          await h.setScript(ONE, COUNT('3'));
          assert.deepEqual(grid(h, ONE, 's').steps, [1, 0, 2]);
          // from a count to a pattern in the script, with something stored: stored still wins
          await h.setScript(ONE, COUNT('[1, 1, 1, 1, 1]'));
          assert.deepEqual(grid(h, ONE, 's').steps, [1, 0, 2, 1, 1]);
        });

        test('the templates give a count, with their starting patterns stored: they show and play them', async function (assert) {
          const doc = defaultProject();
          for (const track of doc.tracks) {
            assert.true(
              /steps: 16,/.test(track.script),
              `${track.name}: a count`,
            );
          }
          const fresh = newTrack('new');
          const loop = newSlicedLoopTrack('loop');
          const h = await startProject({
            ...doc,
            tracks: [...doc.tracks, fresh, loop],
          });
          const shown = (id: string, name = 'steps'): string =>
            grid(h, id, name).steps.join('');
          assert.strictEqual(shown(KICK), '1000100010001000');
          assert.strictEqual(shown('t-snare'), '0000100000001001');
          assert.strictEqual(shown('t-hat'), '1010101010101011');
          assert.strictEqual(shown(fresh.id), '1000000000000000');
          assert.deepEqual(
            grid(h, loop.id, 'slices').steps,
            [1, 0, 3, 3, 5, 0, 7, 8, 9, 0, 3, 12, 13, 14, 0, 16],
          );
          assert.true(grid(h, KICK).stored);
          assert.deepEqual(h.derived, [], 'nothing rewritten on the way');

          // only the kick: it sounds on its beats and not between them
          const solo = await startProject({ ...doc, tracks: [doc.tracks[0]!] });
          const rendered = await solo.render();
          const level = (from: number, to: number): number =>
            rms(rendered, from, to);
          assert.true(
            level(0, 0.1) > 0.01,
            `the first beat sounds (${level(0, 0.1)})`,
          );
          assert.true(level(0.5, 0.6) > 0.01, 'and the second');
        });
      },
    );

    test('a stored pattern is fitted when the script changes the number of steps', async function (assert) {
      const script = `${CHAIN}__.transport.sequence('s', { steps: [1, 0, 0, 0, 1, 0, 0, 0] }, () => {});\nstepGrid('s');`;
      const h = await startProject(oneTrack(script));
      move(h, ONE, stepGridKey('s'), [0, 1, 1, 0, 0, 0, 0, 1]);

      await h.setScript(
        ONE,
        script.replace('[1, 0, 0, 0, 1, 0, 0, 0]', '[1, 0, 0, 0]'),
      );
      assert.deepEqual(
        grid(h, ONE, 's').steps,
        [0, 1, 1, 0],
        'shorter: the stored steps as far as they go',
      );

      await h.setScript(
        ONE,
        script.replace(
          '[1, 0, 0, 0, 1, 0, 0, 0]',
          '[1, 0, 0, 0, 1, 0, 0, 0, 2, 2, 2, 2]',
        ),
      );
      assert.deepEqual(
        grid(h, ONE, 's').steps,
        [0, 1, 1, 0, 0, 0, 0, 1, 2, 2, 2, 2],
        'longer: the stored steps, then the script’s for the new ones',
      );
      assert.deepEqual(
        storedIn(h, ONE)[stepGridKey('s')],
        [0, 1, 1, 0, 0, 0, 0, 1],
        'the stored pattern itself is not rewritten',
      );
    });

    test('a step that holds a value comes back to it, not to 1', async function (assert) {
      const h = await startProject(
        oneTrack(
          `${CHAIN}__.transport.sequence('notes', { steps: [3, 0, 0.5, 0, 1, 0] }, () => {});\nstepGrid('notes');`,
        ),
      );
      h.apply(h.runner.toggleStepOperation(ONE, 'notes', 0));
      assert.strictEqual(grid(h, ONE, 'notes').steps[0], 0);
      h.apply(h.runner.toggleStepOperation(ONE, 'notes', 0));
      assert.strictEqual(grid(h, ONE, 'notes').steps[0], 3);
      h.apply(h.runner.toggleStepOperation(ONE, 'notes', 1));
      assert.strictEqual(grid(h, ONE, 'notes').steps[1], 1, 'never on: 1');
    });

    test('stepGrid() for a sequence that is not there is a warning on its line', async function (assert) {
      const h = await startProject(
        oneTrack(`${CHAIN}stepGrid('nope');
stepGrid('late');
__.transport.sequence('late', { steps: 4 }, () => {});`),
      );
      assert.strictEqual(h.runner.error(ONE), null);
      assert.deepEqual(h.runner.stepGrids(ONE), []);
      const [missing, early] = h.runner.warnings(ONE);
      assert.strictEqual(missing?.line, 2);
      assert.true(
        missing!.message.includes('there is no sequence called "nope"'),
        missing!.message,
      );
      assert.strictEqual(early?.line, 3);
      assert.true(
        early!.message.includes(
          "stepGrid('late') is declared before the sequence is made. Move it below",
        ),
        early!.message,
      );
    });

    test('a value whose stepGrid() line disappears is kept, and applies again when it returns', async function (assert) {
      const h = await startProject();
      const original = scriptOf(h, KICK);
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 1));
      const stored = storedIn(h, KICK)[STEPS];

      await h.setScript(KICK, original.replace("stepGrid('steps');\n", ''));
      assert.deepEqual(h.runner.stepGrids(KICK), [], 'no grid');
      assert.strictEqual(
        h.engine.scope(KICK).scope('script').transport.get('steps')?.steps[1],
        0,
        'the sequence plays the script’s steps',
      );
      assert.deepEqual(
        storedIn(h, KICK)[STEPS],
        stored,
        'the pattern is still in the document',
      );

      await h.setScript(KICK, original);
      assert.strictEqual(grid(h, KICK).steps[1], 1, 'restored');
    });

    test('stepGrid().set() from a script changes the grid and the sequence, and is stored', async function (assert) {
      const h = await startProject(
        oneTrack(`${CHAIN}__.transport.sequence('s', { steps: [1, 0, 0, 0] }, () => {});
const grid = stepGrid('s');
globalThis.euclipGrid = grid.value;
grid.set([1, 1, 1, 1]);`),
      );
      assert.deepEqual(
        (globalThis as unknown as { euclipGrid: number[] }).euclipGrid,
        [1, 0, 0, 0],
        '.value is the steps',
      );
      assert.deepEqual(grid(h, ONE, 's').steps, [1, 1, 1, 1]);
      assert.deepEqual(storedIn(h, ONE), { [stepGridKey('s')]: [1, 1, 1, 1] });
      assert.deepEqual(
        h.derived.map((op) => op.type),
        ['setControlValue'],
        'not a step to undo',
      );
      delete (globalThis as unknown as { euclipGrid?: number[] }).euclipGrid;
    });

    test('a document replaced whole (undo, load) is applied to what is running', async function (assert) {
      const h = await startProject();
      const before = h.doc;
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 1));
      move(h, KICK, FREQUENCY, 500);
      h.apply({ type: 'setBpm', bpm: 90 });
      h.apply({ type: 'setTrackLevel', id: KICK, level: 0.2 });
      h.apply({ type: 'removeTrack', id: 't-hat' });

      h.doc = before;
      await h.runner.sync();

      assert.strictEqual(grid(h, KICK).steps[1], 0);
      assert.strictEqual(paramOf(h, KICK, 'filter', 'frequency').value, 2000);
      assert.strictEqual(h.engine.transport.bpm, 120);
      assert.strictEqual(h.engine.scope(KICK).bus('channel').gain.value, 1);
      assert.strictEqual(
        grid(h, 't-hat').steps.length,
        16,
        'the removed track is running again',
      );
    });
  });

  module('errors', function () {
    test('a syntax error keeps the previous version running and is reported until it is fixed', async function (assert) {
      const h = await startProject();
      const good = scriptOf(h, KICK);
      const before = idsOf(h, KICK);

      await h.setScript(KICK, `${good}\n__().sampler({ id: 'second' `);
      assert.true(
        h.runner.error(KICK)?.message.startsWith('SyntaxError'),
        h.runner.error(KICK)?.message,
      );
      assert.deepEqual(idsOf(h, KICK), before, 'the old nodes');
      assert.strictEqual(grid(h, KICK).steps.length, 16, 'the old grid');
      assert.strictEqual(
        h.runner.controls(KICK).length,
        4,
        'and the old controls',
      );
      assert.true(
        h.doc.tracks[0]?.script.includes('second'),
        'the document holds the text as typed',
      );

      await h.setScript(KICK, good);
      assert.strictEqual(h.runner.error(KICK), null);
    });

    test('a script that throws while building keeps the previous version and what it declared', async function (assert) {
      const h = await startProject();
      const good = scriptOf(h, KICK);
      const before = idsOf(h, KICK);

      await h.setScript(
        KICK,
        `__().sine({ id: 'osc' }).to('channel');\nslider('#osc', 'frequency');\nnotDefined();`,
      );
      assert.true(
        h.runner.error(KICK)?.message.startsWith('ReferenceError'),
        h.runner.error(KICK)?.message,
      );
      assert.deepEqual(idsOf(h, KICK), before);
      assert.deepEqual(
        h.runner.controls(KICK).map((c) => c.label),
        ['speed', 'frequency', 'q', 'level'],
        'the failed run’s declarations are not used',
      );

      await h.setScript(KICK, `__().sine(220).to('a-bus-that-is-not-there');`);
      assert.true(
        /no bus called/.test(h.runner.error(KICK)?.message ?? ''),
        h.runner.error(KICK)?.message,
      );
      assert.deepEqual(idsOf(h, KICK), before);

      await h.setScript(KICK, good);
      assert.strictEqual(h.runner.error(KICK), null);
    });

    test('a project loaded with a broken script: that track is silent and marked, the rest play', async function (assert) {
      const doc = applyOperation(arrayDefaultProject(), {
        type: 'setScript',
        scope: 't-snare',
        script: `__().sampler({ id: 's', buffer: 'snare' }).to('channel'`,
      });
      const h = await startProject(doc);

      assert.true(h.runner.error('t-snare')?.message.startsWith('SyntaxError'));
      assert.false(h.runner.isBuilt('t-snare'));
      assert.deepEqual(h.runner.stepGrids('t-snare'), []);
      assert.deepEqual(h.runner.controls('t-snare'), []);
      assert.deepEqual(
        idsOf(h, 't-snare'),
        [HOST_PAN_ID],
        'it made nothing: only the host’s pan is there',
      );
      assert.true(h.runner.isBuilt(KICK));
      assert.strictEqual(h.runner.error(KICK), null);

      const rendered = await h.render();
      assert.true(rms(rendered) > 0.01, 'the other tracks are heard');
    });

    test('a sequence callback that throws is muted and reported; the rest carries on; a fixed script plays again', async function (assert) {
      const counter = globalThis as unknown as { euclipTestCalls?: number };
      counter.euclipTestCalls = 0;
      const broken = `__().sampler({ id: 'sampler', buffer: 'hat' }).to('channel');
__.transport.sequence('steps', { steps: 16, step: '1/16' }, () => {
  globalThis.euclipTestCalls++;
  throw new Error('bad step');
});
__.transport.sequence('other', { steps: 4, step: '1/4' }, () => {});
stepGrid('steps');
stepGrid('other');`;
      const h = await startProject(
        applyOperation(arrayDefaultProject(), {
          type: 'setScript',
          scope: 't-hat',
          script: broken,
        }),
      );
      assert.strictEqual(h.runner.error('t-hat'), null, 'it builds');

      const rendered = await h.render();

      assert.strictEqual(counter.euclipTestCalls, 1, 'it ran once');
      const error = h.runner.error('t-hat');
      assert.strictEqual(error?.message, 'Error: bad step');
      assert.strictEqual(error?.sequence, 'steps');
      const sequences = h.engine.scope('t-hat').scope('script')
        .transport.sequences;
      assert.deepEqual(
        sequences.map((s) => [s.name, s.muted]),
        [
          ['steps', true],
          ['other', false],
        ],
      );
      assert.true(grid(h, 't-hat').disabled);
      assert.false(grid(h, 't-hat', 'other').disabled);
      assert.strictEqual(h.runner.error(KICK), null);
      assert.true(rms(rendered) > 0.01, 'the kick and snare are heard');

      await h.setScript(
        't-hat',
        broken.replace("throw new Error('bad step');", ''),
      );
      assert.strictEqual(h.runner.error('t-hat'), null);
      assert.false(
        h.engine.scope('t-hat').scope('script').transport.get('steps')?.muted,
        'un-muted by the run that fixed it',
      );
      assert.false(grid(h, 't-hat').disabled);
      delete counter.euclipTestCalls;
    });
  });

  module('sound', function () {
    test('the default project is audible; a step, a control and the channel strip change what is heard', async function (assert) {
      const plain = await (await startProject()).render();
      assert.true(rms(plain) > 0.02, `audible (rms ${rms(plain).toFixed(4)})`);
      assert.true(peak(plain, 0, 2) <= 1, 'not clipping');

      // every kick step off
      const stepped = await startProject();
      for (const index of [0, 4, 8, 12]) {
        stepped.apply(stepped.runner.toggleStepOperation(KICK, 'steps', index));
      }
      const withoutKick = await stepped.render();
      assert.true(
        rms(withoutKick) > 0.005,
        'the snare and hat are still there',
      );
      assert.true(
        rms(withoutKick) < rms(plain) * 0.8,
        `quieter without the kick (${rms(withoutKick).toFixed(4)} < ${rms(plain).toFixed(4)})`,
      );

      // the kick's level control at zero: the same thing by another route
      const controlled = await startProject();
      move(controlled, KICK, controlKey('#level', 'gain'), 0);
      const levelAtZero = await controlled.render();
      assert.true(
        Math.abs(rms(levelAtZero) - rms(withoutKick)) < rms(plain) * 0.05,
        `the level control at zero sounds like no kick (${rms(levelAtZero).toFixed(4)} ~ ${rms(withoutKick).toFixed(4)})`,
      );

      // and the channel strip at zero: a third route
      const turnedDown = await startProject();
      turnedDown.apply({ type: 'setTrackLevel', id: KICK, level: 0 });
      const stripAtZero = await turnedDown.render();
      assert.true(
        Math.abs(rms(stripAtZero) - rms(withoutKick)) < rms(plain) * 0.05,
        'so does the strip at zero',
      );
    });

    test('pan is heard, and every strip at zero is silence', async function (assert) {
      const right = await startProject();
      for (const track of right.doc.tracks) {
        right.apply({ type: 'setTrackPan', id: track.id, pan: 1 });
      }
      const panned = await right.render();
      assert.true(channelRms(panned, 1) > 0.02, 'the right channel has it');
      assert.true(
        channelRms(panned, 0) < channelRms(panned, 1) * 0.01,
        'the left has none of it',
      );

      const off = await startProject();
      for (const track of off.doc.tracks) {
        off.apply({ type: 'setTrackLevel', id: track.id, level: 0 });
      }
      assert.true(rms(await off.render()) < 1e-5);
    });

    test('the tempo is the document’s', async function (assert) {
      const h = await startProject();
      assert.strictEqual(h.engine.transport.bpm, 120);
      h.apply({ type: 'setBpm', bpm: 97 });
      assert.strictEqual(h.engine.transport.bpm, 97);
    });
  });
});
