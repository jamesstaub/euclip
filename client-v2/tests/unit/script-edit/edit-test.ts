import { module, test } from 'qunit';
import {
  addChain,
  branchFrom,
  addBus,
  addModulator,
  planModulator,
  planSend,
  removeModulator,
  retarget,
  sendTo,
  suggestDepth,
  addBusInsert,
  addNode,
  giveId,
  moveNode,
  planRemove,
  removeNode,
  type EditContext,
  type EditResult,
  type NodeRef,
} from 'client-v2/script-edit/edit';
import { samplerScript } from 'client-v2/project/default-project';

const ctx: EditContext = {
  nodeTypes: new Set([
    'sampler',
    'lowpass',
    'highpass',
    'gain',
    'compressor',
    'delay',
    'reverb',
    'lfo',
  ]),
  sourceTypes: new Set(['sampler']),
  modulatorTypes: new Set(['lfo']),
  shorthands: { lowpass: 'frequency', gain: 'gain' },
};

const ref = (id: string, type: string): NodeRef => ({
  id,
  type,
  ordinal: null,
});

function script(result: EditResult): string {
  if ('cannot' in result) throw new Error(result.cannot);
  return result.script;
}

const KICK = samplerScript(
  'kick',
  16,
  "  .lowpass({ id: 'filter', frequency: 2000, q: 2 })\n  .gain({ id: 'level', gain: 0.9 })",
  "slider('#filter', 'frequency');\nknob('#level', 'gain');\nwaveform('#sampler');",
);

module('Unit | script-edit', function () {
  module('add', function () {
    test('after a node in the middle: one call to a line, an id, and a controls line at the end of the section', function (assert) {
      const result = addNode(
        KICK,
        { at: ref('filter', 'lowpass'), side: 'after', type: 'highpass' },
        ctx,
      );
      const next = script(result);
      assert.strictEqual(
        next,
        KICK.replace(
          "  .lowpass({ id: 'filter', frequency: 2000, q: 2 })\n",
          "  .lowpass({ id: 'filter', frequency: 2000, q: 2 })\n  .highpass({ id: 'highpass' })\n",
        ).replace(
          "waveform('#sampler');\n",
          "waveform('#sampler');\ncontrols('#highpass');\n",
        ),
      );
      assert.strictEqual((result as { id: string }).id, 'highpass');
    });

    test('before a node, and at the end before .to()', function (assert) {
      const before = script(
        addNode(
          KICK,
          { at: ref('filter', 'lowpass'), side: 'before', type: 'delay' },
          ctx,
        ),
      );
      assert.true(
        before.includes(
          "  .sampler({ id: 'sampler' })\n  .delay({ id: 'delay' })\n  .lowpass(",
        ),
      );
      const end = script(
        addNode(
          KICK,
          { at: ref('level', 'gain'), side: 'after', type: 'reverb' },
          ctx,
        ),
      );
      assert.true(
        end.includes(
          "  .gain({ id: 'level', gain: 0.9 })\n  .reverb({ id: 'reverb' })\n  .to('channel');",
        ),
      );
    });

    test('nothing is added before a chain’s source; after it is fine', function (assert) {
      const refused = addNode(
        KICK,
        { at: ref('sampler', 'sampler'), side: 'before', type: 'gain' },
        ctx,
      );
      assert.true('cannot' in refused);
      const after = script(
        addNode(
          KICK,
          { at: ref('sampler', 'sampler'), side: 'after', type: 'gain' },
          ctx,
        ),
      );
      assert.true(
        after.includes(
          "  .sampler({ id: 'sampler' })\n  .gain({ id: 'gain' })\n  .lowpass(",
        ),
      );
    });

    test('ids are unique in the script: lowpass, lowpass_2, lowpass_3', function (assert) {
      let text = KICK;
      const ids: string[] = [];
      for (let n = 0; n < 3; n++) {
        const result = addNode(
          text,
          { at: ref('level', 'gain'), side: 'after', type: 'lowpass' },
          ctx,
        );
        text = script(result);
        ids.push((result as { id: string }).id);
      }
      assert.deepEqual(ids, ['lowpass', 'lowpass_2', 'lowpass_3']);
      // an id the script has already (here 'filter') is never reused, even for another type
      const taken = addNode(
        "__().sampler({ id: 'gain' }).to('channel');",
        { at: ref('gain', 'sampler'), side: 'after', type: 'gain' },
        ctx,
      );
      assert.strictEqual((taken as { id: string }).id, 'gain_2');
    });

    test('ids of the running graph are avoided too', function (assert) {
      const result = addNode(
        KICK,
        { at: ref('level', 'gain'), side: 'after', type: 'delay' },
        { ...ctx, usedIds: ['delay'] },
      );
      assert.strictEqual((result as { id: string }).id, 'delay_2');
    });

    test('the const form, and a statement that is a single line', function (assert) {
      const text =
        "const kick = __().sampler({ id: 'kick' }).gain({ id: 'out' }).to('channel');\n";
      const next = script(
        addNode(
          text,
          { at: ref('kick', 'sampler'), side: 'after', type: 'lowpass' },
          ctx,
        ),
      );
      assert.strictEqual(
        next,
        "const kick = __().sampler({ id: 'kick' }).lowpass({ id: 'lowpass' }).gain({ id: 'out' }).to('channel');\n\ncontrols('#lowpass');\n".replace(
          '\n\ncontrols',
          '\ncontrols',
        ),
      );
    });

    test('a script with no Controls section gets the line at its end', function (assert) {
      const text = "__()\n  .sampler({ id: 'a' })\n  .to('channel');";
      const next = script(
        addNode(
          text,
          { at: ref('a', 'sampler'), side: 'after', type: 'gain' },
          ctx,
        ),
      );
      assert.strictEqual(
        next,
        "__()\n  .sampler({ id: 'a' })\n  .gain({ id: 'gain' })\n  .to('channel');\ncontrols('#gain');",
      );
    });

    test('the controls line goes at the end of its section, before the next one', function (assert) {
      const text = `// Chain
__()
  .sampler({ id: 'a' });

// Controls
slider('#a', 'speed');

// Notes
// nothing here
`;
      const next = script(
        addNode(
          text,
          { at: ref('a', 'sampler'), side: 'after', type: 'gain' },
          ctx,
        ),
      );
      assert.true(
        next.includes("slider('#a', 'speed');\ncontrols('#gain');\n\n// Notes"),
        next,
      );
    });

    test('comments and blank lines are left exactly as they were', function (assert) {
      const text = `// Chain: the kick
__()
  // the source
  .sampler({ id: 'a' }) // plays it

  .to('channel'); // out

// Controls
// (none yet)
`;
      const next = script(
        addNode(
          text,
          { at: ref('a', 'sampler'), side: 'after', type: 'gain' },
          ctx,
        ),
      );
      assert.strictEqual(
        next,
        `// Chain: the kick
__()
  // the source
  .sampler({ id: 'a' })
  .gain({ id: 'gain' }) // plays it

  .to('channel'); // out

// Controls
controls('#gain');
// (none yet)
`.replace(
          "  .sampler({ id: 'a' })\n  .gain({ id: 'gain' }) // plays it",
          "  .sampler({ id: 'a' })\n  .gain({ id: 'gain' }) // plays it",
        ),
        'only the inserted lines differ',
      );
    });

    test('un-id’d nodes are found by type and order', function (assert) {
      const text =
        "__()\n  .sampler()\n  .lowpass(800)\n  .lowpass()\n  .to('channel');\n";
      const second = addNode(
        text,
        {
          at: { id: 'lowpass-1', type: 'lowpass', ordinal: 2, siblings: 2 },
          side: 'after',
          type: 'gain',
        },
        ctx,
      );
      assert.true(
        script(second).includes(
          "  .lowpass()\n  .gain({ id: 'gain' })\n  .to('channel');",
        ),
      );
      const mismatch = addNode(
        text,
        {
          at: { id: 'lowpass-1', type: 'lowpass', ordinal: 2, siblings: 3 },
          side: 'after',
          type: 'gain',
        },
        ctx,
      );
      assert.true(
        'cannot' in mismatch,
        'not every node of the type is in the text',
      );
    });

    test('a script that is not in the conventional shape is refused, with the reason', function (assert) {
      const loop = `for (const f of [200, 400]) {
  __().sampler({ id: 'a' }).lowpass({ id: 'f' + f }).to('channel');
}
`;
      const refused = addNode(
        loop,
        { at: ref('a', 'sampler'), side: 'after', type: 'gain' },
        ctx,
      );
      assert.true('cannot' in refused);
      assert.true(
        /Euclip cannot edit/.test('cannot' in refused ? refused.cannot : ''),
      );
      // an un-id'd node cannot be placed when other code may make nodes
      const mixed = `__().sampler().gain().to('channel');\nfor (let i = 0; i < 2; i++) __().lowpass();\n`;
      const unplaced = addNode(
        mixed,
        {
          at: { id: 'gain-1', type: 'gain', ordinal: 1, siblings: 1 },
          side: 'after',
          type: 'delay',
        },
        ctx,
      );
      assert.true('cannot' in unplaced);
      assert.true(
        'cannot' in
          addNode(
            "__().sampler({ id: 'a' }",
            { at: ref('a', 'sampler'), side: 'after', type: 'gain' },
            ctx,
          ),
        'a syntax error',
      );
      // a chain with .split is not recognised either
      const split =
        "__().sampler({ id: 'a' }).split((b) => b.lowpass(), (b) => b.gain()).to('channel');";
      assert.true(
        'cannot' in
          addNode(
            split,
            { at: ref('a', 'sampler'), side: 'after', type: 'delay' },
            ctx,
          ),
      );
    });
  });

  module('remove', function () {
    test('a node in the middle, with its control lines; the rest is untouched', function (assert) {
      const next = script(removeNode(KICK, ref('filter', 'lowpass'), ctx));
      assert.strictEqual(
        next,
        KICK.replace(
          "  .lowpass({ id: 'filter', frequency: 2000, q: 2 })\n",
          '',
        ).replace("slider('#filter', 'frequency');\n", ''),
      );
    });

    test('the last node of the chain', function (assert) {
      const next = script(removeNode(KICK, ref('level', 'gain'), ctx));
      assert.true(
        next.includes(
          "  .lowpass({ id: 'filter', frequency: 2000, q: 2 })\n  .to('channel');",
        ),
      );
      assert.false(next.includes("knob('#level'"));
    });

    test('the source removes the whole statement, and the plan says so first', function (assert) {
      const plan = planRemove(KICK, ref('sampler', 'sampler'), ctx);
      assert.deepEqual(plan, { wholeStatement: true, modulators: 0 });
      const next = script(removeNode(KICK, ref('sampler', 'sampler'), ctx));
      assert.false(next.includes('.lowpass('));
      assert.false(
        next.includes("slider('#filter'"),
        'every node of it loses its controls',
      );
      assert.strictEqual(
        next.split('// Sequences')[0],
        '// Chain\n\n',
        'one blank line is left, not two',
      );
      assert.true(
        next.includes('__.transport.sequence('),
        'other statements stay',
      );
    });

    test('a chain of one node goes whole', function (assert) {
      const text =
        "__().gain({ id: 'a' }).to('main');\n__().lowpass({ id: 'b' }).to('main');\n";
      assert.deepEqual(planRemove(text, ref('a', 'gain'), ctx), {
        wholeStatement: true,
        modulators: 0,
      });
      assert.strictEqual(
        script(removeNode(text, ref('a', 'gain'), ctx)),
        "__().lowpass({ id: 'b' }).to('main');\n",
      );
    });

    test('only declarations whose first argument is exactly #id are deleted', function (assert) {
      const text = `__().sampler({ id: 'a' }).lowpass({ id: 'f' }).lowpass({ id: 'f2' }).to('channel');
slider('#f', 'frequency');
slider('#f2', 'frequency');
knob('#f', 'q');
toggle("#f", 'bypass');
controls('#f');
select('#f2', 'type');
waveform('#a');
const x = slider('#f', 'q', {});
`;
      const next = script(removeNode(text, ref('f', 'lowpass'), ctx));
      assert.strictEqual(
        next,
        `__().sampler({ id: 'a' }).lowpass({ id: 'f2' }).to('channel');
slider('#f2', 'frequency');
select('#f2', 'type');
waveform('#a');
const x = slider('#f', 'q', {});
`,
      );
    });

    test('a modulator that moves the node goes with it', function (assert) {
      const text = `__().sampler({ id: 'a' }).lowpass({ id: 'f' }).to('channel');
__().lfo({ id: 'wob' }).modulate('#f', 'frequency');
controls('#wob');
controls('#f');
`;
      assert.deepEqual(planRemove(text, ref('f', 'lowpass'), ctx), {
        wholeStatement: false,
        modulators: 1,
      });
      assert.strictEqual(
        script(removeNode(text, ref('f', 'lowpass'), ctx)),
        "__().sampler({ id: 'a' }).to('channel');\n",
      );
    });

    test('a comment before a removed call stays', function (assert) {
      const text = `__()
  .sampler({ id: 'a' })
  // tame it
  .lowpass({ id: 'f' })
  .to('channel');
`;
      assert.strictEqual(
        script(removeNode(text, ref('f', 'lowpass'), ctx)),
        `__()
  .sampler({ id: 'a' })
  // tame it
  .to('channel');
`,
      );
    });

    test('on a bus, removing the last insert leaves the bus', function (assert) {
      const text =
        "__.bus('main')\n  .compressor({ id: 'glue' });\ncontrols('#glue');\n";
      assert.deepEqual(planRemove(text, ref('glue', 'compressor'), ctx), {
        wholeStatement: false,
        modulators: 0,
      });
      assert.strictEqual(
        script(removeNode(text, ref('glue', 'compressor'), ctx)),
        "__.bus('main');\n",
      );
    });
  });

  module('move', function () {
    test('swaps a call with its neighbour, keeping the line breaks where they are', function (assert) {
      const right = script(
        moveNode(
          KICK,
          { node: ref('filter', 'lowpass'), direction: 'right' },
          ctx,
        ),
      );
      assert.true(
        right.includes(
          "  .sampler({ id: 'sampler' })\n  .gain({ id: 'level', gain: 0.9 })\n  .lowpass({ id: 'filter', frequency: 2000, q: 2 })\n  .to('channel');",
        ),
        right,
      );
      const left = script(
        moveNode(KICK, { node: ref('level', 'gain'), direction: 'left' }, ctx),
      );
      assert.strictEqual(left, right);
    });

    test('the ends of a chain, the source and .to() stay where they are', function (assert) {
      assert.true(
        'cannot' in
          moveNode(
            KICK,
            { node: ref('level', 'gain'), direction: 'right' },
            ctx,
          ),
      );
      assert.true(
        'cannot' in
          moveNode(
            KICK,
            { node: ref('sampler', 'sampler'), direction: 'right' },
            ctx,
          ),
      );
      assert.true(
        'cannot' in
          moveNode(
            KICK,
            { node: ref('filter', 'lowpass'), direction: 'left' },
            ctx,
          ),
        'nothing is moved before the source',
      );
    });

    test('a bus’s inserts swap too', function (assert) {
      const text =
        "__.bus('main')\n  .compressor({ id: 'glue' })\n  .reverb({ id: 'room' });\n";
      assert.strictEqual(
        script(
          moveNode(
            text,
            { node: ref('glue', 'compressor'), direction: 'right' },
            ctx,
          ),
        ),
        "__.bus('main')\n  .reverb({ id: 'room' })\n  .compressor({ id: 'glue' });\n",
      );
    });
  });

  module('ids and buses', function () {
    test('an id is written into a call that has none, in each shape of its arguments', function (assert) {
      const give = (text: string, type: string): string =>
        script(
          giveId(text, { id: `${type}-1`, type, ordinal: 1, siblings: 1 }, ctx),
        );
      assert.strictEqual(
        give('__().lowpass();', 'lowpass'),
        "__().lowpass({ id: 'lowpass' });",
      );
      assert.strictEqual(
        give('__().lowpass({ q: 2 });', 'lowpass'),
        "__().lowpass({ id: 'lowpass', q: 2 });",
      );
      assert.strictEqual(
        give('__().lowpass(800);', 'lowpass'),
        "__().lowpass({ id: 'lowpass', frequency: 800 });",
      );
      assert.strictEqual(
        give('__().lowpass({\n  q: 2,\n});', 'lowpass'),
        "__().lowpass({\n  id: 'lowpass',\n  q: 2,\n});",
      );
      assert.strictEqual(
        give('__().lowpass({});', 'lowpass'),
        "__().lowpass({ id: 'lowpass' });",
      );
    });

    test('an insert on a bus the script has no statement for', function (assert) {
      const next = script(
        addBusInsert(
          "// Master\n__.bus('main')\n  .compressor({ id: 'glue' });\n\n// Controls\ncontrols('#glue');\n",
          { bus: 'drums', type: 'reverb' },
          ctx,
        ),
      );
      assert.strictEqual(
        next,
        "// Master\n__.bus('main')\n  .compressor({ id: 'glue' });\n__.bus('drums')\n  .reverb({ id: 'reverb' });\n\n// Controls\ncontrols('#glue');\ncontrols('#reverb');\n",
      );
    });

    test('an insert added after the last one of a bus statement', function (assert) {
      const next = script(
        addNode(
          "__.bus('main')\n  .compressor({ id: 'glue' });\n",
          { at: ref('glue', 'compressor'), side: 'after', type: 'reverb' },
          ctx,
        ),
      );
      assert.strictEqual(
        next,
        "__.bus('main')\n  .compressor({ id: 'glue' })\n  .reverb({ id: 'reverb' });\ncontrols('#reverb');\n",
      );
    });
  });

  module('destinations', function () {
    test('the .to() argument is rewritten, and nothing else changes', function (assert) {
      assert.strictEqual(
        script(
          sendTo(
            KICK,
            { from: { node: ref('level', 'gain') }, to: 'drums' },
            ctx,
          ),
        ),
        KICK.replace(".to('channel')", ".to('drums')"),
      );
    });

    test('a chain with no .to() gets one, in the chain’s own style', function (assert) {
      const text = "__()\n  .sampler({ id: 'a' })\n  .gain({ id: 'g' });\n";
      assert.strictEqual(
        script(
          sendTo(
            text,
            { from: { node: ref('g', 'gain') }, to: 'channel' },
            ctx,
          ),
        ),
        "__()\n  .sampler({ id: 'a' })\n  .gain({ id: 'g' })\n  .to('channel');\n",
      );
      assert.strictEqual(
        script(
          sendTo(
            "__().sampler({ id: 'a' });",
            { from: { node: ref('a', 'sampler') }, to: 'main' },
            ctx,
          ),
        ),
        "__().sampler({ id: 'a' }).to('main');",
      );
    });

    test('a chain that ends in .connect(), or a node that is not the end, is refused with the reason', function (assert) {
      const text = "__().sampler({ id: 'a' }).gain({ id: 'g' }).connect('#x');";
      const refused = planSend(text, { node: ref('g', 'gain') }, ctx);
      assert.true(/\.connect/.test(refused?.cannot ?? ''));
      assert.true(
        /not the end/.test(
          planSend(KICK, { node: ref('filter', 'lowpass') }, ctx)?.cannot ?? '',
        ),
      );
      assert.strictEqual(
        planSend(KICK, { node: ref('level', 'gain') }, ctx),
        null,
      );
    });

    test('a bus’s own .to() is rewritten; without one it is left alone', function (assert) {
      const text = "__.bus('drums')\n  .reverb({ id: 'r' })\n  .to('main');\n";
      assert.strictEqual(
        script(sendTo(text, { from: { bus: 'drums' }, to: 'fx' }, ctx)),
        "__.bus('drums')\n  .reverb({ id: 'r' })\n  .to('fx');\n",
      );
      assert.true(
        'cannot' in
          sendTo(
            "__.bus('drums').reverb({ id: 'r' });",
            { from: { bus: 'drums' }, to: 'fx' },
            ctx,
          ),
      );
    });

    test('a new bus is made where it is used (in this script) or in the project script', function (assert) {
      assert.strictEqual(
        script(
          sendTo(
            KICK,
            { from: { node: ref('level', 'gain') }, to: 'drums', create: true },
            ctx,
          ),
        ),
        KICK.replace(".to('channel')", ".to('drums')").replace(
          '__()\n  .sampler',
          "__.bus('drums');\n__()\n  .sampler",
        ),
      );
      const project =
        "// Master\n__.bus('main')\n  .compressor({ id: 'glue' });\n\n// Controls\ncontrols('#glue');\n";
      assert.strictEqual(
        script(addBus(project, 'drums', ctx)),
        "// Master\n__.bus('main')\n  .compressor({ id: 'glue' });\n__.bus('drums');\n\n// Controls\ncontrols('#glue');\n",
      );
      assert.true('cannot' in addBus(project, 'main', ctx), 'main is refused');
    });

    test('bus names: identifier-like, and not the ones Euclip has', function (assert) {
      assert.true('cannot' in addBus('', '1drums', ctx));
      assert.true('cannot' in addBus('', 'a b', ctx));
      assert.true('cannot' in addBus('', 'channel', ctx));
      assert.strictEqual(
        script(addBus('', 'drum-bus_2', ctx)),
        "__.bus('drum-bus_2');\n",
      );
      const same = "__.bus('x');\n";
      assert.strictEqual(
        script(addBus(same, 'x', ctx)),
        same,
        'a bus the script has is not made twice',
      );
    });

    test('inserts named like a bus’s own members are refused on a bus', function (assert) {
      const text = "__.bus('main')\n  .compressor({ id: 'glue' });\n";
      assert.true(
        'cannot' in
          addNode(
            text,
            { at: ref('glue', 'compressor'), side: 'after', type: 'gain' },
            ctx,
          ),
      );
    });
  });

  module('modulators', function () {
    test('a line after the chain statements, its controls, and an id written into a target without one', function (assert) {
      const result = addModulator(
        KICK,
        {
          target: ref('filter', 'lowpass'),
          param: 'frequency',
          type: 'lfo',
          depth: 1000,
        },
        ctx,
      );
      assert.strictEqual(
        script(result),
        KICK.replace(
          "  .to('channel');\n",
          "  .to('channel');\n__().lfo({ id: 'lfo', frequency: 2, depth: 1000 }).modulate('#filter', 'frequency');\n",
        ).replace(
          "waveform('#sampler');\n",
          "waveform('#sampler');\ncontrols('#lfo');\n",
        ),
      );
      assert.strictEqual((result as { id: string }).id, 'lfo');

      const plain = "__().sampler({ id: 'a' }).lowpass().to('channel');\n";
      assert.strictEqual(
        script(
          addModulator(
            plain,
            {
              target: {
                id: 'lowpass-1',
                type: 'lowpass',
                ordinal: 1,
                siblings: 1,
              },
              param: 'frequency',
              type: 'lfo',
              depth: 5,
            },
            ctx,
          ),
        ),
        "__().sampler({ id: 'a' }).lowpass({ id: 'lowpass' }).to('channel');\n__().lfo({ id: 'lfo', frequency: 2, depth: 5 }).modulate('#lowpass', 'frequency');\ncontrols('#lfo');\n",
      );
    });

    test('a second modulator gets its own id', function (assert) {
      const once = script(
        addModulator(
          KICK,
          {
            target: ref('filter', 'lowpass'),
            param: 'frequency',
            type: 'lfo',
            depth: 100,
          },
          ctx,
        ),
      );
      const twice = addModulator(
        once,
        {
          target: ref('level', 'gain'),
          param: 'gain',
          type: 'lfo',
          depth: 0.1,
        },
        ctx,
      );
      assert.strictEqual((twice as { id: string }).id, 'lfo_2');
    });

    test('retarget rewrites the two arguments; remove takes the statement and its controls', function (assert) {
      const text = script(
        addModulator(
          KICK,
          {
            target: ref('filter', 'lowpass'),
            param: 'frequency',
            type: 'lfo',
            depth: 100,
          },
          ctx,
        ),
      );
      const moved = script(
        retarget(
          text,
          {
            modulator: ref('lfo', 'lfo'),
            target: ref('level', 'gain'),
            param: 'gain',
          },
          ctx,
        ),
      );
      assert.true(moved.includes(".modulate('#level', 'gain');"));
      assert.strictEqual(
        moved.replace("'#level', 'gain'", "'#filter', 'frequency'"),
        text,
      );
      assert.strictEqual(
        script(removeModulator(text, ref('lfo', 'lfo'), ctx)),
        KICK,
      );
    });

    test('a modulator written another way is left to the script', function (assert) {
      const text =
        "__().sampler({ id: 'a' }).to('channel');\nconst t = '#a';\n__().lfo({ id: 'w' }).modulate(t, 'gain');\n";
      assert.true(
        /changed in the script/.test(
          planModulator(text, ref('w', 'lfo'), ctx)?.cannot ?? '',
        ),
      );
    });

    test('a depth that suits the parameter', function (assert) {
      assert.strictEqual(
        suggestDepth({ min: 20, max: 20000, default: 1000, curve: 'log' }),
        500,
      );
      assert.strictEqual(
        suggestDepth({ min: 0, max: 1, default: 1, curve: 'linear' }),
        0.25,
      );
      assert.strictEqual(
        suggestDepth({ min: -1, max: 1, default: 0, curve: 'linear' }),
        0.5,
      );
    });
  });

  module('chains and branches', function () {
    test('a new chain goes after the last chain statement, with its controls', function (assert) {
      const result = addChain(KICK, { type: 'sampler', to: 'channel' }, ctx);
      assert.strictEqual(
        script(result),
        KICK.replace(
          "  .to('channel');\n",
          "  .to('channel');\n__()\n  .sampler({ id: 'sampler_2' })\n  .to('channel');\n",
        ).replace(
          "waveform('#sampler');\n",
          "waveform('#sampler');\ncontrols('#sampler_2');\n",
        ),
      );
      assert.strictEqual((result as { id: string }).id, 'sampler_2');
      assert.strictEqual(
        script(addChain('', { type: 'sampler', to: 'main' }, ctx)),
        "__()\n  .sampler({ id: 'sampler' })\n  .to('main');\ncontrols('#sampler');\n",
      );
    });

    test('a branch is one more statement that leaves the chain as it is', function (assert) {
      const next = script(
        branchFrom(KICK, { node: ref('filter', 'lowpass'), to: 'drums' }, ctx),
      );
      assert.strictEqual(
        next,
        KICK.replace(
          ".to('channel');\n",
          ".to('channel');\n__('#filter').to('drums');\n",
        ),
      );
      const plain = "__().sampler({ id: 'a' }).lowpass().to('channel');\n";
      assert.strictEqual(
        script(
          branchFrom(
            plain,
            {
              node: {
                id: 'lowpass-1',
                type: 'lowpass',
                ordinal: 1,
                siblings: 1,
              },
              to: 'x',
            },
            ctx,
          ),
        ),
        "__().sampler({ id: 'a' }).lowpass({ id: 'lowpass' }).to('channel');\n__('#lowpass').to('x');\n",
      );
    });

    test('inserting between two nodes is adding after the first', function (assert) {
      const next = script(
        addNode(
          KICK,
          { at: ref('filter', 'lowpass'), side: 'after', type: 'delay' },
          ctx,
        ),
      );
      assert.true(
        next.includes(
          "  .lowpass({ id: 'filter', frequency: 2000, q: 2 })\n  .delay({ id: 'delay' })\n  .gain({ id: 'level'",
        ),
      );
    });
  });
});
