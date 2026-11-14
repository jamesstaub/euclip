import { module, test } from 'qunit';
import { HOST_PAN_ID, OUT_BUS, OWN_GROUP } from 'client-v2/audio/runner';
import { defaultProject, newTrack } from 'client-v2/project/default-project';
import { applyOperation } from 'client-v2/project/operations';
import {
  controlKey,
  emptyValues,
  PROJECT_SCOPE,
  sequencerKey,
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
} from 'client-v2/tests/helpers/runner';

const KICK = 't-kick';
const ONE = 't-1';
const FREQUENCY = controlKey('#filter', 'frequency');
const STEPS = sequencerKey('steps');

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
    .sequencers(scope)
    .find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No sequencer ${name} in ${scope}`);
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
    ...defaultProject(),
    script: '',
    tracks: [
      { id: ONE, name: 'one', script, level: 1, pan: 0, values: emptyValues() },
    ],
  };
}

const CHAIN = `__().sampler({ id: 's', buffer: 'kick' }).lowpass({ id: 'f', frequency: 2000, q: 6 }).gain({ id: 'g', gain: 0.8 }).to('out');\n`;

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
          'slider filter.frequency = 2000',
          'slider filter.q = 2',
          'knob level.level = 0.9',
          'slider sampler.speed = 1',
        ],
        'in the order the script declares them, with the script’s own values',
      );
      const frequency = control(h, KICK, FREQUENCY);
      assert.deepEqual(frequency.group, {
        id: 'filter',
        label: 'filter',
        type: 'lowpass',
        byPosition: false,
      });
      assert.deepEqual(frequency.meta, {
        kind: 'number',
        min: 20,
        max: 20000,
        unit: 'hz',
        curve: 'log',
      });
      assert.strictEqual(
        frequency.mode,
        'exponential',
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
        ['glue.threshold = -18', 'glue.ratio = 3'],
      );
      assert.deepEqual(h.runner.sequencers(PROJECT_SCOPE), []);

      const catalog = h.runner.catalog();
      assert.deepEqual(catalog.buffers, [
        'kick',
        'snare',
        'hat',
        'openhat',
        'clap',
      ]);
      assert.true(catalog.ids.includes('glue'), 'ids from the project script');
      assert.true(catalog.ids.includes('sampler'), 'ids from the tracks');
      assert.false(catalog.ids.includes(HOST_PAN_ID), 'not the host’s node');
      assert.deepEqual([...catalog.buses].sort(), ['main', 'out']);
      assert.deepEqual(catalog.sequences, ['steps']);
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
        ['level', 'speed'],
      );
      assert.deepEqual(h.runner.warnings(track.id), []);

      h.apply({ type: 'removeTrack', id: track.id });
      assert.deepEqual(h.runner.sequencers(track.id), []);
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
          ['slider', '#f › frequency', 'frequency', 'number', 2000],
          ['knob', '#g › gain', 'Level', 'number', 0.8],
          ['toggle', '#s › loop', 'loop', 'boolean', false],
        ],
      );
      assert.deepEqual(
        h.runner.declarations(ONE)[0],
        {
          key: '#f › frequency',
          kind: 'slider',
          bindings: [{ type: 'param', selector: '#f', param: 'frequency' }],
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
      const script = `__().sine({ id: 'osc', frequency: 440 }).gain({ id: 'g', gain: 1 }).to('out');\nslider('#g', 'gain');`;
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
        ['q', 'level', 'speed'],
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
        oneTrack(`__().saw({ class: 'voice', frequency: 110 }).gain(0.1).to('out');
__().saw({ class: 'voice', frequency: 220 }).gain(0.1).to('out');
slider('.voice', 'detune');`),
      );
      const key = controlKey('.voice', 'detune');
      assert.strictEqual(h.runner.controls(ONE).length, 1);
      assert.strictEqual(control(h, ONE, key).group.label, '.voice (2 nodes)');

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
        h.engine.scope(ONE).transport.sequences.length,
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

    test('controls(selector) declares every parameter, under "more"; with a list, those named', async function (assert) {
      const h = await startProject(oneTrack(`${CHAIN}controls('#s');`));
      const all = h.runner.controls(ONE);
      assert.deepEqual(
        all.map((c) => `${c.label}:${c.kind}`),
        [
          'speed:slider',
          'start:slider',
          'end:slider',
          'loop:toggle',
          'reverse:toggle',
          'gain:slider',
        ],
        'the kind that suits each parameter',
      );
      assert.true(
        all.every((c) => c.implicit),
        'all flagged for "more"',
      );

      await h.setScript(ONE, `${CHAIN}controls('#s', ['speed', 'loop']);`);
      assert.deepEqual(
        h.runner.controls(ONE).map((c) => [c.label, c.implicit]),
        [
          ['speed', false],
          ['loop', false],
        ],
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
            'has no parameter "tempo". It has: speed, start, end, loop, reverse, gain',
          ),
        h.runner.warnings(ONE)[0]!.message,
      );

      await h.setScript(ONE, `${CHAIN}controls('#nothing');`);
      assert.true(
        h.runner.warnings(ONE)[0]!.message.includes('matches no node'),
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
          `__().sine(220).chooser({ id: 'c' }).gain(0.1).to('out');\nselect('#c', 'shape');\ncontrols('#c');\nslider('#c', 'shape');`,
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
        options: { mode: 'linear' },
      });
      assert.strictEqual(
        control(h, ONE, '#f › frequency').mode,
        'linear',
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
      const script = `__().sine({ id: 'osc', frequency: 440 }).gain({ id: 'g', gain: 0 }).to('out');
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

  module('declared sequencers', function () {
    test('a grid exists only for a sequence with a sequencer() line', async function (assert) {
      const h = await startProject(
        oneTrack(`${CHAIN}__.transport.sequence('a', { steps: [1, 0, 0] }, () => {});
__.transport.sequence('b', { steps: 32 }, () => {});
__.transport.sequence('quiet', { steps: 8 }, () => {});
sequencer('b', { label: 'Long one', view: 'toggles' });
sequencer('a');`),
      );
      assert.deepEqual(
        h.runner
          .sequencers(ONE)
          .map((s) => [s.name, s.label, s.steps.length, s.view, s.line]),
        [
          ['b', 'Long one', 32, 'toggles', 5],
          ['a', 'a', 3, 'toggles', 6],
        ],
        'in the order declared; a sequence with no sequencer() has no grid',
      );
      assert.strictEqual(
        h.engine.scope(ONE).transport.sequences.length,
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

    test('a stored pattern is fitted when the script changes the number of steps', async function (assert) {
      const script = `${CHAIN}__.transport.sequence('s', { steps: [1, 0, 0, 0, 1, 0, 0, 0] }, () => {});\nsequencer('s');`;
      const h = await startProject(oneTrack(script));
      move(h, ONE, sequencerKey('s'), [0, 1, 1, 0, 0, 0, 0, 1]);

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
        storedIn(h, ONE)[sequencerKey('s')],
        [0, 1, 1, 0, 0, 0, 0, 1],
        'the stored pattern itself is not rewritten',
      );
    });

    test('a step that holds a value comes back to it, not to 1', async function (assert) {
      const h = await startProject(
        oneTrack(
          `${CHAIN}__.transport.sequence('notes', { steps: [3, 0, 0.5, 0, 1, 0] }, () => {});\nsequencer('notes');`,
        ),
      );
      h.apply(h.runner.toggleStepOperation(ONE, 'notes', 0));
      assert.strictEqual(grid(h, ONE, 'notes').steps[0], 0);
      h.apply(h.runner.toggleStepOperation(ONE, 'notes', 0));
      assert.strictEqual(grid(h, ONE, 'notes').steps[0], 3);
      h.apply(h.runner.toggleStepOperation(ONE, 'notes', 1));
      assert.strictEqual(grid(h, ONE, 'notes').steps[1], 1, 'never on: 1');
    });

    test('sequencer() for a sequence that is not there is a warning on its line', async function (assert) {
      const h = await startProject(
        oneTrack(`${CHAIN}sequencer('nope');
sequencer('late');
__.transport.sequence('late', { steps: 4 }, () => {});`),
      );
      assert.strictEqual(h.runner.error(ONE), null);
      assert.deepEqual(h.runner.sequencers(ONE), []);
      const [missing, early] = h.runner.warnings(ONE);
      assert.strictEqual(missing?.line, 2);
      assert.true(
        missing!.message.includes('there is no sequence called "nope"'),
        missing!.message,
      );
      assert.strictEqual(early?.line, 3);
      assert.true(
        early!.message.includes(
          "sequencer('late') is declared before the sequence is made. Move it below",
        ),
        early!.message,
      );
    });

    test('a value whose sequencer() line disappears is kept, and applies again when it returns', async function (assert) {
      const h = await startProject();
      const original = scriptOf(h, KICK);
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 1));
      const stored = storedIn(h, KICK)[STEPS];

      await h.setScript(KICK, original.replace("sequencer('steps');\n", ''));
      assert.deepEqual(h.runner.sequencers(KICK), [], 'no grid');
      assert.strictEqual(
        h.engine.scope(KICK).transport.get('steps')?.steps[1],
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

    test('sequencer().set() from a script changes the grid and the sequence, and is stored', async function (assert) {
      const h = await startProject(
        oneTrack(`${CHAIN}__.transport.sequence('s', { steps: [1, 0, 0, 0] }, () => {});
const grid = sequencer('s');
globalThis.euclipGrid = grid.value;
grid.set([1, 1, 1, 1]);`),
      );
      assert.deepEqual(
        (globalThis as unknown as { euclipGrid: number[] }).euclipGrid,
        [1, 0, 0, 0],
        '.value is the steps',
      );
      assert.deepEqual(grid(h, ONE, 's').steps, [1, 1, 1, 1]);
      assert.deepEqual(storedIn(h, ONE), { [sequencerKey('s')]: [1, 1, 1, 1] });
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
      assert.strictEqual(h.engine.scope(KICK).bus('out').gain.value, 1);
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
        `__().sine({ id: 'osc' }).to('out');\nslider('#osc', 'frequency');\nnotDefined();`,
      );
      assert.true(
        h.runner.error(KICK)?.message.startsWith('ReferenceError'),
        h.runner.error(KICK)?.message,
      );
      assert.deepEqual(idsOf(h, KICK), before);
      assert.deepEqual(
        h.runner.controls(KICK).map((c) => c.label),
        ['frequency', 'q', 'level', 'speed'],
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
      const doc = applyOperation(defaultProject(), {
        type: 'setScript',
        scope: 't-snare',
        script: `__().sampler({ id: 's', buffer: 'snare' }).to('out'`,
      });
      const h = await startProject(doc);

      assert.true(h.runner.error('t-snare')?.message.startsWith('SyntaxError'));
      assert.false(h.runner.isBuilt('t-snare'));
      assert.deepEqual(h.runner.sequencers('t-snare'), []);
      assert.deepEqual(h.runner.controls('t-snare'), []);
      assert.deepEqual(idsOf(h, 't-snare'), [], 'it made nothing');
      assert.true(h.runner.isBuilt(KICK));
      assert.strictEqual(h.runner.error(KICK), null);

      const rendered = await h.render();
      assert.true(rms(rendered) > 0.01, 'the other tracks are heard');
    });

    test('a sequence callback that throws is muted and reported; the rest carries on; a fixed script plays again', async function (assert) {
      const counter = globalThis as unknown as { euclipTestCalls?: number };
      counter.euclipTestCalls = 0;
      const broken = `__().sampler({ id: 'sampler', buffer: 'hat' }).to('out');
__.transport.sequence('steps', { steps: 16, step: '1/16' }, () => {
  globalThis.euclipTestCalls++;
  throw new Error('bad step');
});
__.transport.sequence('other', { steps: 4, step: '1/4' }, () => {});
sequencer('steps');
sequencer('other');`;
      const h = await startProject(
        applyOperation(defaultProject(), {
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
      const sequences = h.engine.scope('t-hat').transport.sequences;
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
        h.engine.scope('t-hat').transport.get('steps')?.muted,
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
