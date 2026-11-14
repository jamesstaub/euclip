import { module, test } from 'qunit';
import { HOST_PAN_ID, OUT_BUS } from 'client-v2/audio/runner';
import { defaultProject, newTrack } from 'client-v2/project/default-project';
import { applyOperation } from 'client-v2/project/operations';
import {
  emptyValues,
  PROJECT_SCOPE,
  type ProjectDocument,
} from 'client-v2/project/schema';
import {
  channelRms,
  peak,
  rms,
  startProject,
  type Harness,
} from 'client-v2/tests/helpers/runner';

const KICK = 't-kick';

function scriptOf(h: Harness, id: string): string {
  return h.doc.tracks.find((track) => track.id === id)!.script;
}

function idsOf(h: Harness, id: string): string[] {
  return [...h.engine.scope(id).select('*')].map((node) => node.id).sort();
}

function steps(h: Harness, scope: string, name = 'steps') {
  const found = h.runner
    .sequences(scope)
    .find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No sequence ${name} in ${scope}`);
  return found;
}

/** A project of one track with the given script, and an empty project script. */
function oneTrack(script: string): ProjectDocument {
  return {
    ...defaultProject(),
    script: '',
    tracks: [
      {
        id: 't-1',
        name: 'one',
        script,
        level: 1,
        pan: 0,
        values: emptyValues(),
      },
    ],
  };
}

module('Unit | Audio | runner', function () {
  module('what the scripts make', function () {
    test('the default project builds: sequences, and names for the editors', async function (assert) {
      const h = await startProject();

      const sequence = steps(h, KICK);
      assert.deepEqual(
        sequence.steps,
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      );
      assert.false(sequence.overridden);
      assert.strictEqual(sequence.playhead, null);
      assert.deepEqual(h.runner.sequences(PROJECT_SCOPE), []);
      for (const id of [PROJECT_SCOPE, KICK, 't-snare', 't-hat']) {
        assert.strictEqual(h.runner.error(id), null, `${id} has no error`);
        assert.true(h.runner.isBuilt(id));
      }
      assert.deepEqual(
        idsOf(h, KICK),
        [HOST_PAN_ID, 'filter', 'level', 'sampler'],
        'the track’s scope holds its script’s nodes and the host’s pan',
      );
      assert.deepEqual(
        [...h.engine.bus('main').inserts].map((node) => node.id),
        ['glue'],
      );
      assert.strictEqual(h.engine.bus('main').gain.value, 0.8);

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

    test('a sequence has as many steps as its script gives it, and a track can have several', async function (assert) {
      const h = await startProject(
        oneTrack(`__().sampler({ id: 's', buffer: 'kick' }).to('out');
__.transport.sequence('a', { steps: [1, 0, 0] }, () => {});
__.transport.sequence('b', { steps: 32 }, () => {});
__.transport.sequence({ steps: 4 }, () => {});`),
      );
      assert.deepEqual(
        h.runner.sequences('t-1').map((s) => [s.name, s.steps.length]),
        [
          ['a', 3],
          ['b', 32],
        ],
        'named sequences, in the script’s order; one with no name has no grid',
      );
    });

    test('tracks can be added and removed while running', async function (assert) {
      const h = await startProject();
      const track = newTrack('extra', 'clap');
      h.apply({ type: 'addTrack', track });
      await h.runner.run(track.id);
      assert.true(h.runner.isBuilt(track.id));
      assert.deepEqual(idsOf(h, track.id), [HOST_PAN_ID, 'level', 'sampler']);
      assert.strictEqual(steps(h, track.id).steps.length, 16);

      h.apply({ type: 'removeTrack', id: track.id });
      assert.deepEqual(h.runner.sequences(track.id), []);
      assert.false(h.runner.isBuilt(track.id));
      assert.strictEqual(steps(h, KICK).steps.length, 16, 'the others stay');
    });
  });

  module('step patterns: last touched wins', function () {
    test('an edited pattern is applied again after a run, unless the script’s pattern changed', async function (assert) {
      const h = await startProject();
      const code = [...steps(h, KICK).steps];
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 1));
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 0));

      const edited = [0, 1, ...code.slice(2)];
      assert.deepEqual(steps(h, KICK).steps, edited, 'edited live');
      assert.true(steps(h, KICK).overridden);
      assert.deepEqual(h.doc.tracks[0]?.values.sequences, {
        steps: { value: edited, code },
      });

      // an edit elsewhere in the script: the pattern's line is as it was
      await h.setScript(
        KICK,
        scriptOf(h, KICK).replace('gain: 0.9', 'gain: 0.6'),
      );
      assert.strictEqual(h.runner.error(KICK), null);
      assert.deepEqual(steps(h, KICK).steps, edited, 'kept');
      assert.deepEqual(h.derived, [], 'nothing was dropped');

      // the pattern itself is edited in the script
      await h.setScript(
        KICK,
        scriptOf(h, KICK).replace('steps: [1, 0, 0, 0,', 'steps: [1, 1, 1, 1,'),
      );
      assert.deepEqual(
        steps(h, KICK).steps.slice(0, 4),
        [1, 1, 1, 1],
        'the script’s new pattern',
      );
      assert.false(steps(h, KICK).overridden);
      assert.deepEqual(h.doc.tracks[0]?.values.sequences, {}, 'dropped');
      assert.deepEqual(h.derived, [
        { type: 'clearSteps', scope: KICK, sequence: 'steps' },
      ]);

      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 2));
      assert.strictEqual(steps(h, KICK).steps[2], 0);
      h.apply({ type: 'clearSteps', scope: KICK, sequence: 'steps' });
      assert.strictEqual(steps(h, KICK).steps[2], 1, 'reset to the script’s');
    });

    test('the change is detected from the pattern the script produces, not from its text', async function (assert) {
      const h = await startProject(
        oneTrack(`const hits = 3;
__().sampler({ id: 's', buffer: 'kick' }).to('out');
__.transport.sequence('e', { steps: euclid(hits, 8) }, () => {});`),
      );
      h.apply(h.runner.toggleStepOperation('t-1', 'e', 1));
      const edited = [...steps(h, 't-1', 'e').steps];

      await h.setScript('t-1', scriptOf(h, 't-1').replace('8)', '4 + 4)'));
      assert.deepEqual(
        steps(h, 't-1', 'e').steps,
        edited,
        'same pattern: kept',
      );

      await h.setScript(
        't-1',
        scriptOf(h, 't-1').replace('hits = 3', 'hits = 5'),
      );
      assert.false(steps(h, 't-1', 'e').overridden, 'new pattern: dropped');
      assert.strictEqual(steps(h, 't-1', 'e').steps.filter(Boolean).length, 5);
    });

    test('a step that holds a value comes back to it, not to 1', async function (assert) {
      const h = await startProject(
        oneTrack(`__().sampler({ id: 's', buffer: 'kick' }).to('out');
__.transport.sequence('notes', { steps: [3, 0, 0.5, 0, 1, 0] }, () => {});`),
      );

      h.apply(h.runner.toggleStepOperation('t-1', 'notes', 0));
      assert.strictEqual(steps(h, 't-1', 'notes').steps[0], 0);
      h.apply(h.runner.toggleStepOperation('t-1', 'notes', 0));
      assert.strictEqual(steps(h, 't-1', 'notes').steps[0], 3);
      h.apply(h.runner.toggleStepOperation('t-1', 'notes', 1));
      assert.strictEqual(steps(h, 't-1', 'notes').steps[1], 1, 'never on: 1');
    });

    test('a stored pattern whose sequence disappears is kept, and applies again when it returns', async function (assert) {
      const h = await startProject();
      const original = scriptOf(h, KICK);
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 1));
      const stored = h.doc.tracks[0]?.values.sequences['steps'];

      await h.setScript(KICK, original.replace("'steps',", "'other',"));
      assert.deepEqual(
        h.runner.sequences(KICK).map((sequence) => sequence.name),
        ['other'],
      );
      assert.deepEqual(h.doc.tracks[0]?.values.sequences['steps'], stored);
      assert.deepEqual(h.derived, []);

      await h.setScript(KICK, original);
      assert.strictEqual(steps(h, KICK).steps[1], 1, 'restored');
      assert.true(steps(h, KICK).overridden);
    });

    test('a document replaced whole (undo, load) is applied to what is running', async function (assert) {
      const h = await startProject();
      const before = h.doc;
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 1));
      h.apply({ type: 'setBpm', bpm: 90 });
      h.apply({ type: 'setTrackLevel', id: KICK, level: 0.2 });
      h.apply({ type: 'removeTrack', id: 't-hat' });
      assert.strictEqual(h.engine.transport.bpm, 90);

      h.doc = before;
      await h.runner.sync();

      assert.strictEqual(steps(h, KICK).steps[1], 0);
      assert.strictEqual(h.engine.transport.bpm, 120);
      assert.strictEqual(h.engine.scope(KICK).bus('out').gain.value, 1);
      assert.strictEqual(steps(h, 't-hat').steps.length, 16, 'running again');
    });
  });

  // Not something the app does yet (how a script declares a control is being redesigned), but what
  // that design has to work with: what cracked-up's rebuild does to values a host has set.
  module('what a rebuild does to a value the host has set', function () {
    test('a kept node’s parameter goes back to the script’s value; a bus’s level is left alone', async function (assert) {
      const h = await startProject();
      const scope = h.engine.scope(KICK);
      const filter = [...scope.select('#filter')][0]!;
      const sampler = [...scope.select('#sampler')][0]!;
      const changes: unknown[] = [];
      scope.on('param:changed', (change) =>
        changes.push([change.param.name, change.previous, change.value]),
      );

      filter.param('frequency').set(500); // the script says 2000
      filter.param('q').set(9); // the script says 2
      sampler.param('speed').set(2); // the script does not mention it
      scope.bus('out').gain.set(0.4); // a bus the script does not set
      changes.length = 0;

      await h.setScript(KICK, `${scriptOf(h, KICK)}\n// the same code again`);

      assert.strictEqual([...scope.select('#filter')][0], filter, 'kept');
      assert.strictEqual(filter.param('frequency').value, 2000);
      assert.strictEqual(filter.param('q').value, 2);
      assert.strictEqual(
        sampler.param('speed').value,
        1,
        'a parameter the script leaves out goes back to its default',
      );
      assert.deepEqual(
        changes,
        [
          ['speed', 2, 1],
          ['frequency', 500, 2000],
          ['q', 9, 2],
        ],
        'each is reported as a change',
      );
      assert.strictEqual(
        scope.bus('out').gain.value,
        0.4,
        'the bus level stays',
      );
    });

    test('setting the value again straight after the rebuild is not heard', async function (assert) {
      // A sine at full level whose gain the host has set to 0: silence. Half a second in, the script
      // is run again (the rebuild puts the gain back to the script's 1) and the host sets 0 again in
      // the same turn. Both are scheduled at the same audio time, so none of the sine should come out.
      const script = `__().sine({ id: 'osc', frequency: 440 }).gain({ id: 'g', gain: 1 }).to('out');`;
      const silent = await startProject(oneTrack(script), 1);
      const gain = () =>
        [...silent.engine.scope('t-1').select('#g')][0]!.param('gain');
      gain().set(0);
      let afterRebuild: unknown;
      void silent.context.suspend(0.5).then(async () => {
        await silent.setScript('t-1', `${script}\n// run again`);
        afterRebuild = gain().value;
        gain().set(0);
        await silent.context.resume();
      });
      const quiet = await silent.render();
      assert.strictEqual(
        afterRebuild,
        1,
        'the rebuild put the script’s value back',
      );
      assert.ok(
        peak(quiet, 0.05, 0.99) < 1e-4,
        `silence all the way through (peak ${peak(quiet, 0.05, 0.99)})`,
      );

      // (the same thing without the host's value is loud, so the test above can hear)
      const loud = await (await startProject(oneTrack(script), 1)).render();
      assert.ok(peak(loud, 0.05, 0.99) > 0.5, 'the sine is audible');
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
      assert.strictEqual(steps(h, KICK).steps.length, 16, 'the old sequence');
      assert.true(
        h.doc.tracks[0]?.script.includes('second'),
        'the document holds the text as typed',
      );

      await h.setScript(KICK, good);
      assert.strictEqual(h.runner.error(KICK), null);
    });

    test('a script that throws while building keeps the previous version', async function (assert) {
      const h = await startProject();
      const good = scriptOf(h, KICK);
      const before = idsOf(h, KICK);

      await h.setScript(KICK, `__().sine(220).to('out');\nnotDefined();`);
      assert.true(
        h.runner.error(KICK)?.message.startsWith('ReferenceError'),
        h.runner.error(KICK)?.message,
      );
      assert.deepEqual(idsOf(h, KICK), before);

      await h.setScript(KICK, `__().sine(220).to('a-bus-that-is-not-there');`);
      assert.true(
        /no bus called/.test(h.runner.error(KICK)?.message ?? ''),
        h.runner.error(KICK)?.message,
      );
      assert.deepEqual(idsOf(h, KICK), before);
      assert.strictEqual(steps(h, KICK).steps.length, 16);

      await h.setScript(KICK, good);
      assert.strictEqual(h.runner.error(KICK), null);
    });

    test('a failed run leaves an edited pattern where it was', async function (assert) {
      const h = await startProject();
      h.apply(h.runner.toggleStepOperation(KICK, 'steps', 1));

      await h.setScript(KICK, `${scriptOf(h, KICK)}\n)`);

      assert.strictEqual(steps(h, KICK).steps[1], 1);
      assert.true(steps(h, KICK).overridden);
      assert.deepEqual(h.derived, [], 'nothing was dropped');
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
      assert.deepEqual(h.runner.sequences('t-snare'), []);
      assert.deepEqual(idsOf(h, 't-snare'), [], 'it made nothing');
      assert.true(h.runner.isBuilt(KICK));
      assert.strictEqual(h.runner.error(KICK), null);

      const rendered = await h.render();
      assert.ok(rms(rendered) > 0.01, 'the other tracks are heard');
    });

    test('a sequence callback that throws is switched off and reported; other tracks carry on', async function (assert) {
      const counter = globalThis as unknown as { euclipTestCalls?: number };
      counter.euclipTestCalls = 0;
      const doc = applyOperation(defaultProject(), {
        type: 'setScript',
        scope: 't-hat',
        script: `__().sampler({ id: 'sampler', buffer: 'hat' }).to('out');
__.transport.sequence('steps', { steps: 16, step: '1/16' }, () => {
  globalThis.euclipTestCalls++;
  throw new Error('bad step');
});
__.transport.sequence('other', { steps: 4, step: '1/4' }, () => {});`,
      });
      const h = await startProject(doc);
      assert.strictEqual(h.runner.error('t-hat'), null, 'it builds');

      const rendered = await h.render();

      assert.strictEqual(counter.euclipTestCalls, 1, 'it ran once');
      const error = h.runner.error('t-hat');
      assert.strictEqual(error?.message, 'Error: bad step');
      assert.strictEqual(error?.sequence, 'steps');
      assert.true(steps(h, 't-hat').disabled);
      assert.false(steps(h, 't-hat', 'other').disabled);
      assert.strictEqual(h.runner.error(KICK), null);
      assert.ok(rms(rendered) > 0.01, 'the kick and snare are heard');

      delete counter.euclipTestCalls;
    });
  });

  module('sound', function () {
    test('the default project is audible, and a step or the channel strip changes what is heard', async function (assert) {
      const plain = await (await startProject()).render();
      assert.ok(rms(plain) > 0.02, `audible (rms ${rms(plain).toFixed(4)})`);
      assert.ok(peak(plain, 0, 2) <= 1, 'not clipping');

      // every kick step off
      const stepped = await startProject();
      for (const index of [0, 4, 8, 12]) {
        stepped.apply(stepped.runner.toggleStepOperation(KICK, 'steps', index));
      }
      const withoutKick = await stepped.render();
      assert.ok(rms(withoutKick) > 0.005, 'the snare and hat are still there');
      assert.ok(
        rms(withoutKick) < rms(plain) * 0.8,
        `quieter without the kick (${rms(withoutKick).toFixed(4)} < ${rms(plain).toFixed(4)})`,
      );

      // the kick's channel strip at zero: the same thing by another route
      const turnedDown = await startProject();
      turnedDown.apply({ type: 'setTrackLevel', id: KICK, level: 0 });
      const kickAtZero = await turnedDown.render();
      assert.ok(
        Math.abs(rms(kickAtZero) - rms(withoutKick)) < rms(plain) * 0.05,
        `a kick at zero sounds like no kick (${rms(kickAtZero).toFixed(4)} ~ ${rms(withoutKick).toFixed(4)})`,
      );
    });

    test('pan is heard, and every strip at zero is silence', async function (assert) {
      const right = await startProject();
      for (const track of right.doc.tracks) {
        right.apply({ type: 'setTrackPan', id: track.id, pan: 1 });
      }
      const panned = await right.render();
      assert.ok(channelRms(panned, 1) > 0.02, 'the right channel has it');
      assert.ok(
        channelRms(panned, 0) < channelRms(panned, 1) * 0.01,
        'the left has none of it',
      );

      const off = await startProject();
      for (const track of off.doc.tracks) {
        off.apply({ type: 'setTrackLevel', id: track.id, level: 0 });
      }
      assert.ok(rms(await off.render()) < 1e-5);
    });

    test('the tempo is the document’s', async function (assert) {
      const h = await startProject();
      assert.strictEqual(h.engine.transport.bpm, 120);
      h.apply({ type: 'setBpm', bpm: 97 });
      assert.strictEqual(h.engine.transport.bpm, 97);
    });
  });
});
