# cracked-up and Euclip v2: refactor plan

Status: decisions made (section 0, 2026-11-11). cracked-up Phases 0 and 1 are done (API approved; graph core implemented and tested). Next is Phase 2, the transport. Nothing in Euclip has changed yet.

The cracked-up API was reviewed after this plan was written. Where section 3 and the library differ, the library's `design/README.md` (in `../cracked-up`) is authoritative: it records the API decisions and what is implemented.
Audience: the project owner, and whoever (person or agent) implements a phase. Each phase is written to be picked up without the conversation that produced this plan.
Date: 2026-11-11.

This plan covers three initiatives, in order:

1. **cracked-up**: a new TypeScript audio library that replaces our fork of Cracked. Detailed here (sections 2 to 5).
2. **Euclip script API and parameter state**: one source of truth per parameter, and signal chains that can be edited from the UI as well as from scripts. Outlined here (section 6); it gets its own design doc once cracked-up's core API is settled.
3. **Euclip project document and local-first persistence**: drop Ember Data, store a project as one JSON document, run with no backend. Outlined here (section 7).

None of this is backward compatible. Section 8 covers branches and phasing.

The plan rests on three read-only code audits made on 2026-11-10/11 (the Cracked fork, the Euclip client, the Rails server). The audits read code and ran nothing, so behaviour claims taken from them are "by reading". Appendix A lists the findings the design depends on. The full client audit is saved at [audits/2026-11-euclip-client-audit.md](audits/2026-11-euclip-client-audit.md).

## 0. Decisions (from the project owner, 2026-11-11)

| # | Decision | Consequence for the plan |
|---|---|---|
| D1 | **cracked-up is its own repo**, a sibling of this one (`../cracked-up`), consumed by Euclip as a pinned dependency | A saved project records the library version it was written against |
| D2 | **The new transport replaces `loop`/`bind`.** The API must stay convenient for live coders | A step grid is one kind of sequence on the transport. Section 3.6 lists the live-coding conveniences this requires |
| D3 | **Keep the `__` syntax**: chaining and CSS-style selectors. Old scripts are not promised to run | "Familiar, not compatible" |
| D4 | **Existing production projects are not kept** | No converter. v2 starts with an empty database |
| D5 | **Expect realtime collaboration, and design for script security (XSS) from the start** | Every document change is a recorded operation from day one. Because a shared project runs another person's scripts in your browser, D7 is no longer optional |
| D6 | **All modern browsers**: Chrome, Firefox and Safari on desktop, plus mobile Safari and Chrome | Web MIDI availability differs by browser and is checked before Phase 6; features that a browser lacks degrade with a clear message |
| D7 | **User scripts run sandboxed when they may be someone else's** (follows from D5). Amended 2026-11-12 by the owner: a user working alone on their own project runs scripts directly, with no sandbox; the sandbox is used only in collaboration mode (and for any project whose scripts the user did not write). cracked-up makes the two interchangeable (`scope.build` and `remote.build` run the same script text; see `../cracked-up/demo/collaboration.html`) | Scripts must not be able to read the session token, call the API as the viewer, or touch the page. cracked-up therefore makes every node operation expressible as a plain timed command (section 3.6) |

On D7: a Worker alone is not a sufficient boundary, because a same-origin Worker can still make authenticated same-origin requests and read IndexedDB. The candidates to evaluate in initiative 2 are a sandboxed iframe with an opaque origin hosting the script runtime, combined with a strict content security policy; the session token also moves out of `localStorage`, where any injected script can read it today.

## 1. Problems being fixed

From the audits and the earlier review. Appendix A has the evidence.

**In the library**

- Selection, the previous node in a chain, and the current macro are module-level variables. Any callback that selects nodes can corrupt a chain in progress. Presets work around this by re-selecting before every call.
- Selectors are exact-string hash lookups. There is no parser: `"sine, saw"` fails on the space, `.a.b` never matches, and ids are page-global, so duplicated tracks collide on `#main-output`.
- One `AudioContext` is created at load. Offline rendering, tests against rendered audio, and two engines on one page are impossible.
- The step callback is fired from a Worker `setInterval` on the main thread. Audio events inside a callback are snapped to the next step's audio-clock time, so on-the-grid playback is accurate, but there is no way to schedule inside a step: sub-steps and rates above 1 fall back to `setTimeout`. Rates are limited to whole multiples and divisions.
- The library does not track parameter values. `stop()` rebuilds a source's native node from its creation settings, so later changes are lost, and only one incoming connection is restored. This is why Euclip re-sends every control value before each sampler start.
- Buffer sources never get an `onended` handler, so a finished one-shot still counts as playing and the next `start()` is ignored until `stop()` is called.
- `bitcrusher` uses `ScriptProcessor`, which runs on the main thread and is deprecated.
- No recording, no analysis nodes, MIDI input on channel 1 only, no MIDI output or clock.
- No parameter metadata at runtime. Euclip keeps three hand-written tables that can disagree, plus autocomplete data pasted from a JSDoc parser.
- No tests. Grunt 0.4 build run with `--force`.

**In Euclip**

- A parameter's value lives in five places: the script literal, the stored control value, a one-step script offset, the Cracked node, and snapshot copies. Controls are matched to nodes by `(node type, attribute, order)` and repaired heuristically when a script reorders nodes.
- The app depends on fork-only hooks and private internals (`onCreateNode`, `_getNodeLookup`, `_setNodeLookup`, `selector_array`) and monkey-patches `polysynth`, `monosynth` and `channelStrip`.
- Every Play rebuilds the whole audio graph. Samples are decoded twice (by the sampler node and by the sample pool).
- Scripts are compiled with `new Function`, unsandboxed, and the play script is recompiled on every step. A script error stops the whole project.
- There is no way to add an effect to a track without editing its setup script.
- Persistence is a normalized Ember Data graph with one request per edited record. Project bootstrap, track-type scripts, duplication and ordering live in Rails models, so nothing works offline. There is no whole-project save.
- No test inspects audio output.

## 2. cracked-up: goals and scope

cracked-up is a TypeScript library for building and sequencing Web Audio graphs in a terse, chainable style. It is a reimagining of Bill Orcutt's *I Dropped My Phone The Screen Cracked* (MIT), not a port: the node vocabulary and the feel of the syntax carry over, the internals do not.

**Attribution.** The README opens with a credit and link to the original project and its author. The LICENSE keeps the original MIT copyright notice alongside ours, since node designs and some DSP (pink noise filter, ring modulator, overdrive curve) are derived from it. `package.json` links the original in its description.

**In scope**

- Graph building, selection, parameters, macros (composite nodes).
- A transport and look-ahead scheduler with polyrhythm, polymeter, swing and sub-step timing.
- Samplers, synth voices, effects, envelopes, modulators.
- AudioWorklet DSP in place of `ScriptProcessor`.
- Recording, looping, input, metering.
- MIDI in and out, including clock sync in both directions.
- Offline rendering, used for export and for the library's own tests.
- Runtime metadata for every node and parameter.

**Out of scope** (these stay in Euclip)

- Tracks, projects, snapshots, presets, persistence.
- UI controls and their layout.
- Script editing, compilation and sandboxing.
- Sample browsing and the sound index.

cracked-up provides the generic mechanisms Euclip builds those on: scopes, tags, parameter objects, graph descriptions.

## 3. cracked-up: design

### 3.1 Engine instead of globals

All state belongs to an `Engine` instance created around an audio context that the caller supplies.

```ts
import { createEngine } from 'cracked-up';

const engine = await createEngine({ context: new AudioContext() });
const offline = await createEngine({ context: new OfflineAudioContext(2, 48000 * 8, 48000) });
```

- Creation is async because worklet modules must load first.
- Two engines can exist on one page. Tests create one per case.
- An optional entry point, `cracked-up/global`, creates a default engine and exports `__` bound to it, for live-coding use and the docs playground. The core never touches `window`.

### 3.2 Nodes are defined with metadata

Every node type is registered through one function that declares its parameters. The library's own nodes use the same function as user-defined ones.

```ts
defineNode({
  type: 'lowpass',
  category: 'filter',
  params: {
    frequency: { default: 440, min: 20, max: 20000, unit: 'hz', curve: 'log', rate: 'audio' },
    q:         { default: 0,   min: 0,  max: 30,    unit: 'q',  rate: 'audio' },
  },
  build(ctx, params) { /* returns native nodes and the input/output ports */ },
});
```

- The metadata is available at runtime (`engine.registry.describe('lowpass')`) and is exported as JSON at build time. It replaces Euclip's `audio-node-config.js`, the defaults in `audio-param-config.js`, and the JSDoc-parsed autocomplete data.
- TypeScript types for the chain methods are generated from the same definitions, so the editor's autocomplete cannot drift from behaviour.
- Units carry conversions in both directions. Euclip's unit transforms are one-way today, which is why it cannot draw a modulated value for most units.

### 3.3 Selection without shared state

`select` returns an immutable `Selection` that holds its own node list. Nothing global changes.

```ts
const filters = scope.select('lowpass');      // a Selection
filters.set({ frequency: 800 });               // acts on those nodes only
scope.select('sampler.kick, sampler.snare');   // whitespace is fine
```

**Selector grammar.** A parsed subset of CSS:

| Form | Example | Meaning |
|---|---|---|
| Type | `sampler` | Nodes of that type |
| Id | `#bass` | Unique within its scope |
| Class | `.wet`, `.a.b` | Classes are a set; compound classes work in any order |
| Attribute | `[role=send]`, `[track]` | Arbitrary tags set at creation |
| Descendant, child | `polysynth lowpass`, `delay > gain` | Inside a macro; matches at any depth, or direct children only |
| List | `sine, saw` | Union |
| Negation | `:not(.muted)` | |
| Universal | `*` | |

**Scopes.** A scope is a named subtree of the graph with its own id namespace. Selecting from a scope searches only that subtree.

- Euclip creates one scope per track and gives the track's scripts a `__` bound to it. `__('sampler')` then means "this track's samplers" with no `.track-id-N` suffix, and two tracks can both use `#filter`.
- Macros are scopes too, so a macro's internal ids (`delay-input` and so on) no longer collide across instances.
- Reaching outside a scope is explicit: `engine.select(...)` or a named bus (3.5).

**Chains.** The fluent style stays, but the "previous node" lives in the chain object.

```ts
__().sampler({ id: 'kick', buffer }).lowpass({ frequency: 2000 }).gain(0.8).to('main');
```

`__()` starts a new `Chain`; each call appends a node, connects it to the chain's tail, and returns the chain. A chain started inside a `setTimeout` or another callback cannot disturb any other chain.

### 3.4 Parameters hold their own state

Each parameter on each node is a `Param` object.

```ts
const cutoff = scope.select('#filter').param('frequency');
cutoff.set(1200);                         // base value
cutoff.set(1200, { at: ev.time });        // scheduled
cutoff.ramp(200, { at: ev.time, duration: 0.5, curve: 'exp' });
cutoff.offset(+300, { at: ev.time, duration: ev.duration });  // temporary, on top of base
cutoff.value;                             // base value, always readable (0 included)
cutoff.meta;                              // min, max, unit, curve
cutoff.on('change', fn);
```

- The library remembers the base value. Rebuilding a native node (which one-shot sources require) reapplies it, so nothing is lost on restart.
- Temporary offsets are a separate layer from the base value. This is the primitive behind Euclip's "script modulates for one step without moving the slider".
- Audio-rate modulation is a recorded connection: `lfo.modulate(target, 'frequency')`. The `modulates` creation option remains as shorthand. A parameter can list what is modulating it, which the UI needs in order to show that a control is being driven.

### 3.5 Connections, buses and the graph as data

- Every connection is recorded as an edge, including fan-in. Rebuilding a node restores all of its inputs and outputs.
- **Buses** are named mix points owned by a scope or the engine: `chain.to('main')`, `engine.bus('reverb-send')`. They replace connecting to a global id such as `#main-output`, and remove the requirement that the master track is built first.
- **Graph descriptions.** A scope can describe itself as plain data, and can be made to match a description:

```ts
const spec = scope.describe();   // { nodes: [{ id, type, classes, tags, params }], edges: [...] }
scope.apply(nextSpec);           // creates, removes and updates only what differs
```

`apply` reconciles: unchanged nodes keep playing, changed parameters are set, only new or removed nodes are touched. Two things follow:

- Pressing Play, or re-running a setup script, no longer tears down and rebuilds every track.
- A UI can edit a signal chain by editing data, which is what makes the two-way UI and script relationship in section 6 feasible.

Chains built inside `scope.build(fn)` are collected into a description and applied once at the end, so a setup script and a UI edit go through the same path.

- **Introspection events** replace the `onCreateNode` hook and the private lookups: `scope.on('node:added' | 'node:removed' | 'param:changed' | 'error', fn)`.

### 3.6 Transport and scheduler

This replaces `loop`, `bind` and `unbind`.

**Mechanism.** The standard look-ahead design: a Worker timer wakes the scheduler every 25 ms or so; the scheduler finds every event that falls in the next 100 ms or so of musical time and calls its callback early, passing the exact audio-clock time at which it should sound. Callbacks schedule audio at that time. Timer jitter and brief main-thread stalls shorter than the look-ahead window are inaudible, and events are sample-accurate wherever they fall, not only on step boundaries.

**Musical time.** The transport keeps position in beats, with a tempo map (tempo can change at a position), optional time signature, and swing.

```ts
const t = engine.transport;
t.bpm = 120;
t.start();

t.sequence({ steps: [1, 0, 0, 1, 0, 0, 1, 0], step: '1/16' }, (ev) => {
  if (ev.value) kick.trigger({ at: ev.time });
});

t.sequence({ steps: 5, span: '1 bar' }, (ev) => hat.trigger({ at: ev.time }));   // 5 against the bar
t.sequence({ steps: pattern, step: '1/8t', swing: 0.6 }, fn);                     // triplets, swung
```

The callback receives one event object:

| Field | Meaning |
|---|---|
| `time` | Audio-clock time at which the event sounds |
| `beat`, `bar` | Musical position |
| `index`, `value`, `steps` | Position in the sequence, the step's value, the whole array |
| `duration` | Length of this step in seconds, for gates and ramps |
| `cycle` | How many times the sequence has wrapped |
| `at(fraction)` | Audio time part-way through the step, for ratchets, flams and nudges |

- **Polyrhythm and polymeter.** Each sequence has its own step length (any ratio) and its own number of steps. All sequences read the one transport position, so they stay phase-locked.
- **Changing things while playing.** A sequence added or replaced mid-play computes its place from the transport position. This replaces Euclip's `loopIndexFor` workaround and its deferred rebinding.
- **Other scheduling.** `t.at(position, fn)` and `t.every(interval, fn)` for one-off and repeating events that are not step sequences. Callbacks can be given an order, which covers the "once per step before the tracks" hook that snapshots use.
- **Display sync.** Callbacks run ahead of the sound, so UI playheads must not be driven from them. `t.onDisplay(fn)` fires on animation frames at the moment each event is heard.
- **Determinism.** Random helpers (`random`, `chance`, `shuffle`, noise and reverb impulse generation) draw from a seedable generator on the engine, so an offline render can be repeated exactly.

**Live-coding conveniences (D2).** The explicit forms above are the foundation; these shorthands sit on top so that performing with the library stays terse.

- *Implicit event time.* Inside a sequence callback, an operation with no `at` uses the event's time, so `kick.trigger()` is enough. The engine holds the current event time only while a callback runs synchronously; code that continues after an `await` or a timer must pass a time.
- *Named sequences replace themselves.* `t.sequence('hats', spec, fn)` evaluated a second time swaps the pattern and callback in place, in phase, on the next step. Re-running a block of code is the normal way to change it.
- *Pattern shorthand.* A string such as `'x..x..x.'` or `'1 0 0 2'` is accepted wherever a step array is, and `euclid(3, 8, 2)` returns one.
- *Step-grid helper.* `t.steps(pattern, fn)` gives a callback of `(index, value, array, ev)` at the transport's default step length, for the familiar Cracked feel.
- *Stop and clear.* `t.clear()` removes all sequences; `t.clear('hats')` removes one.

**Why this makes script sandboxing possible (D7).** Because callbacks run ahead of time and only need to say "do X at time T", a callback does not have to run on the main thread. A sandboxed script can return timed commands that the main thread applies, provided the look-ahead exceeds the message round trip. cracked-up's part is to make every node operation accept an explicit time and be expressible as a plain, serializable command.

**Clock sources.** The transport follows a `ClockSource`. The default is the audio clock. Section 3.9 adds MIDI clock.

### 3.7 Sources, voices and buffers

- **Triggering.** Source nodes share one protocol: `trigger({ at, ...options })` and `release({ at })`.
- **Sampler.** Each trigger plays a new one-shot voice from the sampler's buffer, with `speed`, `start`, `end`, `slice`, `reverse` and `loop` options, and a setting for whether a new trigger cuts off the previous voice. Voices clean themselves up when they end. `stop().start()` and re-sending parameters are no longer needed, and `end` works for one-shots.
- **Buffer store.** `engine.buffers` loads and decodes each source once and shares it. A host can hand in buffers it already decoded, and can attach slice boundaries to a buffer. This removes Euclip's double decode. Load state and errors are reported per buffer as events and promises, not through a creation-time callback.
- **Envelopes.** `adsr` takes explicit times and levels and schedules against an audio time.
- **Synth macros.** `monosynth` and `polysynth` are rebuilt on the macro system with proper voice allocation, `noteOn`/`noteOff` taking a time, more than one instance allowed, and all settings exposed as live parameters. That removes Euclip's `cracked-overrides.js`.
- **Macros.** `defineMacro` declares inner nodes, which inner parameters are exposed under which names, and any methods. A macro instance is a scope (3.3), appears as one node from outside, and its exposed parameters are ordinary `Param` objects with metadata, so a host can generate controls for it the same way as for any node.

### 3.8 Worklets, recording and looping

- **Worklets.** DSP that cannot be built from native nodes ships as AudioWorklet processors: bitcrusher first, then a recorder and a meter. `defineWorklet` is the escape hatch for custom DSP, replacing the `script` node. The Rust/WASM bitcrusher under `client/wasm` in Euclip can be evaluated as the worklet's implementation. Processors are registered per context, so they also work in offline renders. Loading needs a module URL; the package ships the files and documents the bundler setup, with an inlined fallback for hosts whose content security policy allows it.
- **Recorder node.** `recorder` can be placed anywhere in a graph. It captures PCM in a worklet and returns an `AudioBuffer`; recording can start and stop at transport positions.
  - *Multitrack.* A host puts one recorder on each track's bus, arms them, and starts them at the same position. The resulting buffers are aligned stems.
  - *Compressed capture.* A second mode uses `MediaRecorder` for long takes where memory matters more than sample accuracy.
- **Input.** `input` wraps `getUserMedia` (modern promise API) with device selection. Overdubs are shifted by the reported input and output latency plus a user calibration offset.
- **Looper.** A macro built from the recorder and a buffer player: record a number of bars, play back in sync with the transport, overdub, undo the last layer.
- **Metering.** `meter` and `analyser` nodes, so hosts do not reach for native nodes to draw scopes and levels.
- **Export.** `engine.render({ bars })` on an offline engine returns the mix; recorders in the graph return stems. A WAV encoder is included.

### 3.9 MIDI

- Inputs and outputs, with hot-plug handled.
- Note, control change, pitch bend and program change on all channels. Multiple listeners per event type.
- `midi.learn(param)` maps the next incoming controller to a `Param`, scaled through the parameter's metadata.
- Notes out, sent with timestamps derived from the audio clock.
- **Clock in.** A `ClockSource` that follows external MIDI clock: 24 pulses per quarter note, start, stop, continue and song position. Tempo is estimated from pulse intervals and smoothed so the transport does not jitter.
- **Clock out.** Pulses are scheduled ahead with timestamps, offset by the reported audio output latency so external gear lines up with what is heard.

Browser MIDI timing has more jitter than audio scheduling. Tight sync to hardware needs a measured tolerance, which Phase 6 establishes before the feature is promised to users.

### 3.10 Offline rendering and tests

- An engine on an `OfflineAudioContext` runs the same graph and the same scheduler. With no real time passing, the scheduler runs through the whole render length before rendering starts, calling every callback with its audio time.
- Callbacks that depend on live input or wall-clock time cannot be rendered this way; that limit is documented.
- The library's tests render audio and assert on it: onset positions to the sample, levels, spectral measures within a tolerance, and stored reference renders for effects.
- Euclip gains the same ability: render a project headlessly and assert on the result.

### 3.11 What carries over from Cracked

| Cracked | cracked-up |
|---|---|
| Oscillators, filters, gain, panner, compressor, waveshaper, convolver | Ported as defined nodes with metadata |
| `delay`, `comb`, `reverb`, `overdrive`, `ring` | Ported as macros |
| `bitcrusher`, `script` | AudioWorklet |
| `noise` (white, pink, brown), `stepper`, `lfo` | Ported; generation uses the seeded generator |
| `sampler`, `buffer` | Redesigned (3.7) |
| `adsr`, `monosynth`, `polysynth`, `gang_of_oscillators` | Redesigned on macros and voices |
| `dac`, `out`, `multi_out`, `adc`, `in` | Buses, `output`, `input` |
| `attr`, `ramp`, setter shortcuts | `Param` API; `set` and `ramp` on selections |
| `loop`, `bind`, `unbind` | Transport (3.6) |
| `begin`/`end` macros | `defineMacro` |
| `midi_*` | Redesigned (3.9) |
| `scales`, `chords`, `pitch2freq`, `scale`, `random`, `chance`, `shuffle`, `fill_array` | Pure functions in `cracked-up/util` |
| `mouse_movement`, `key_press`, `random_interval`, `sequence()` (minute scheduler), `removeMacros`, type-check helpers, `_getNodeLookup` and other debug internals | Dropped |

### 3.12 Packaging

- TypeScript in strict mode, ES modules, separate entry points (`cracked-up`, `/nodes`, `/worklets`, `/util`, `/global`) so hosts bundle only what they use.
- Tests run in real browsers, since they need Web Audio: Chromium on every change, Firefox and WebKit before releases.
- Generated API docs and the exported node-metadata JSON are build outputs.
- Semantic versioning with a changelog. Euclip records the library version in each saved project.

## 4. cracked-up: phases

Each phase ends with something demonstrable and tested. Phases 5 and 6 can run in parallel once Phase 2 is done.

| Phase | Builds | Done when |
|---|---|---|
| 0. Foundations | Repo, build, browser test runner, CI, attribution, the offline render test helper. The public API written as TypeScript declarations only, reviewed by the owner before implementation | The owner has approved the declarations for engine, selection, params and transport; an empty engine renders silence in CI |
| 1. Graph core | Engine, `defineNode` and the registry, native node set, `Param`, connections and buses, scopes, selector parser, `Selection`, chains, disposal, `describe()` | A sampler, filter, gain chain renders the expected audio offline; selector grammar fully tested; two engines run side by side |
| 2. Transport | Clock source interface, look-ahead scheduler, tempo map, sequences, swing, `at`/`every`, display sync, offline scheduling, seeded randomness | A rendered 3-against-4 pattern has onsets at the exact expected samples; a tempo change mid-render lands correctly; a live soak test shows no dropped events under main-thread load |
| 3. Instruments and effects | Sampler voices, buffer store, slices, envelopes, macro system, synth macros, the ported effects, bitcrusher and meter worklets | Every node in table 3.11 exists with metadata and a render test |
| 4. Reconciliation | `scope.apply`, `scope.build`, introspection events | Re-applying a changed description while playing leaves untouched nodes running, verified by render |
| 4b. Remote | `cracked-up/remote`: the scripting API inside a sandbox, backed by commands and a mirrored snapshot; `linkRemote` on the host | A script run through the remote renders the same audio as the same script run locally; the sequence round trip is measured against the look-ahead |
| 5. Recording | Recorder worklet, input, latency compensation, looper, WAV encoding, stem export | Two recorders armed together return sample-aligned buffers; a looper overdub stays in phase for 100 cycles |
| 6. MIDI | Devices, messages, learn, notes out, clock in and out | Measured sync error against a hardware or virtual clock is documented and inside the agreed tolerance |
| 7. Release | Docs site, examples, `/global` entry, API freeze | 1.0 tagged |

**Early validation.** After Phase 2 and a minimal sampler from Phase 3, build a throwaway Euclip prototype: one sampler track, a step sequence, two sliders, state in memory. Its purpose is to find API mistakes before the remaining phases build on them. Expect to revise Phase 0's declarations once.

## 5. cracked-up: how the work is delegated

The core (engine, params, selection, transport) is designed and reviewed centrally, because every later piece depends on it. Once Phase 1 and 2 exist, much of the rest is well-specified, independent and testable in isolation, which suits smaller agents working in separate worktrees:

- The selector parser (pure function, table-driven tests).
- Each family of ported nodes in Phase 3 (the definition format and a render test are the contract).
- Each worklet processor.
- The WAV encoder; MIDI message parsing; unit conversions; the music-theory utilities.
- API docs and examples.

Each delegated task gets the relevant declarations, one finished node as a pattern, and the test it must pass. Work is merged only after its render tests pass in CI.

## 6. Initiative 2 outline: script API and parameter state

**Superseded on 2026-11-13 by [euclip-v2-code-and-ui.md](euclip-v2-code-and-ui.md)**, which is authoritative. In particular, chains are no longer stored as data with the script as a generated view: structure lives in code and values in the document. The outline below is kept for the record.

Designed in detail after cracked-up Phase 2, when `Param`, scopes and the transport are real. Direction:

**One source of truth per parameter.** The project document stores, per parameter: a base value, an optional per-step lane (today's multislider), and any range or unit override. The effective value is computed in a fixed order:

1. Base value (the slider).
2. Per-step lane, if present.
3. Script offset for the current event.
4. Audio-rate modulators (LFOs, envelopes).

The UI shows the base value and, separately, the effective value. Parameters are identified by a stable node id plus parameter name, not by `(type, attribute, order)`, so reordering a chain cannot orphan a control. A numeric literal in a script stops being a competing source: creation-time values are defaults for a new node, and after that the document owns the value.

**Script API.** A small typed surface (track, sequence event, controls, samples) published as TypeScript declarations that the editor uses for autocomplete and inline errors. Scripts are compiled once, not per step, and an error disables that script, not the whole project. The current docs describe helpers that do not exist (`playSample`, a bare `controls`, `step`); the new API is the point at which docs, autocomplete and behaviour are generated from one definition.

**Signal chains editable from the UI.** This is feasible, with one limit.

- A track's chain is stored as data: an ordered list of devices (a graph description, 3.5). The UI adds, removes, reorders and bypasses devices by editing that data, and cracked-up reconciles the audio.
- The setup "script" for such a track is a text view generated from the data. Editing the text re-parses it back into data as long as it stays within the declarative chain grammar, so both directions work.
- When a user writes setup code the parser cannot represent (loops, conditionals, nodes created from computed values), the track becomes code-owned. The UI still shows its nodes and generates controls for them from metadata, but structural edits (add, remove, reorder) are disabled for that track and the UI says why. This matches the stated assumption that scripts can always do more than the UI.
- The existing `signal-chain-creator.js`, which generates a whole setup script one way, is the starting point.

**Script security (D5, D7).** Scripts run in a sandbox that cannot reach the page, the session token or the API. The script API is therefore command-based: a script receives the event and a read-only view of its track, and returns or emits timed commands. The design doc chooses the sandbox mechanism and measures the round-trip time against the scheduler's look-ahead.

**Open questions for that design doc:** the sandbox mechanism; how snapshots store parameter state under the new model; how track types and presets are expressed as data.

## 7. Initiative 3 outline: project document and persistence

Ember stays; Ember Data goes.

- **Document.** A project is one JSON document with a schema version and migrations. Ids are generated on the client and are stable. It holds tracks (with chains, scripts and sequences), parameters, the sample pool, snapshots and the macros script. The server audit drafted the field list from today's tables; the new parameter model in section 6 changes the controls part of it.
- **Store.** A client service holds the document as tracked state. Every change is a named operation that produces a patch. That gives undo and redo, autosave by sending patches, and a feed for collaboration later (D5).
- **Logic that moves from Rails to the client:** project bootstrap (first snapshot, master track, default scripts), track creation from a track type (the type's scripts are not sent to the client today), duplication, ordering, sample-pool labelling, snapshot naming and ordering, and all validation.
- **Runs without a backend.** Projects persist to IndexedDB. Track types and presets ship with the client as data. Import and export as a file. The sound index needs either the existing search endpoint or a static prebuilt index; sample audio is already on a public bucket.
- **Server, when present.** Accounts, a project row holding the document, save and load of whole documents or patches, sharing, the sound index. Public and shared projects are modelled in the schema today but not implemented, so sharing is new work.
- **Realtime collaboration.** Hotwire's Turbo is built for server-rendered HTML and does not fit an Ember single-page app. The useful part is the layer beneath it, ActionCable, which can relay document operations between clients over a websocket. ActionCable is present in the server only as empty scaffolding, and production would need Redis. Whether operations are merged with a CRDT library or a simpler server-ordered scheme is decided when this is scheduled.
- **Tests.** The Playwright helpers depend on the page-global `__` and on Cracked internals, so they are rewritten against cracked-up's public introspection. Rendered-audio assertions become possible for the first time.

## 8. Branches and sequencing

The work in progress on `monorepo` was committed on 2026-11-11, so `v2` can branch from a clean state when Euclip work begins (step 4 below).

| Repo | Branch | Purpose |
|---|---|---|
| `cracked-up` (new) | `main`, short feature branches | The library. No legacy to protect |
| Cracked fork | existing | Frozen: fixes only, for the legacy app |
| Euclip | `master` / `monorepo` | The current app keeps working and deploying |
| Euclip | `v2` (long-lived, from `monorepo`) | All breaking work. Feature branches merge here. Deployed to a separate staging app |

**Order**

1. cracked-up Phases 0 to 2.
2. Throwaway Euclip prototype (section 4); revise the API.
3. In parallel: cracked-up Phases 3 and 4; the initiative 2 design doc; the document schema for initiative 3.
4. On `v2`: document store and local persistence first, with the audio layer behind one service interface. Then the new parameter model and script API on cracked-up. Then UI chain editing.
5. cracked-up Phases 5 and 6 with their Euclip UI (recording, looping, MIDI sync, export).
6. Server slimming, sharing, then collaboration.
7. `v2` replaces `master` when the Playwright suite, rewritten for v2, passes.

Steps 1 to 3 change nothing in the running app.

## 9. Risks

- **Size.** This is a rewrite of the audio layer, the state layer and the persistence layer. The prototype after Phase 2 and the long-lived `v2` branch exist to keep the current app usable throughout and to surface design mistakes early.
- **API churn.** Euclip's script API sits on cracked-up's. Freezing cracked-up too early locks in mistakes; too late and Euclip work stalls. The plan freezes at Phase 7 and accepts one planned revision after the prototype.
- **Offline rendering of interactive scripts.** Scripts that read live input or the wall clock cannot render deterministically. The script API in initiative 2 should make the deterministic path the default.
- **Browser differences.** Worklet loading under strict content security policies, timer throttling in background tabs (the reason the scheduler's timer is in a Worker), Web MIDI availability and timing. Each is checked in the phase that depends on it.
- **Recording memory.** Long multitrack takes held as PCM in memory will not scale. Phase 5 starts in memory and measures; streaming to disk is a follow-up if needed.
- **Sandbox latency.** Sandboxed scripts add a message round trip to every scheduled callback. If it approaches the look-ahead window, either the window grows (slower response to live edits) or simple scripts need a faster path. Measured in initiative 2 before the script API is fixed.

## 10. Ideas kept for later: pattern generators

Recorded 2026-11-12. The owner chose to build pattern transforms, binary patterns and sieves now (in `cracked-up/util`). The rest of the list is kept here for future consideration. Each would return a plain array like `euclid` does, and anything random would take the engine's seeded random source so offline renders repeat.

| Idea | What it gives | Notes |
|---|---|---|
| Turing machine (looping shift register) | A random pattern that repeats, with one control for how often a step mutates: 0 is a fixed loop, 1 is noise, in between it drifts | The strongest candidate. Needs state between cycles, so it is a small object with `next()`, not a pure function |
| Random walk ("drunk") | Each value is the last plus a small random step, kept inside a range. Melodies that move by step | Simple. Options: step size, range, reflect or wrap at the edges, quantise to a scale |
| Markov chain | New sequences with the same local habits as a transition table or a seed sequence | Order 1 first. Learning from a seed is the useful entry point |
| Cellular automata (rules 30, 90, 110) | A row derived from the previous row, so a pattern evolves bar by bar from a seed | Cheap; musically hit-and-miss |
| L-systems | Rewrite rules applied repeatedly (`a -> ab`, `b -> a`) give self-similar sequences | Useful for structure over longer spans |
| Thue-Morse and similar fixed sequences | Balanced, never-repeating on/off patterns from a one-line rule | Good for accents; deterministic |
| Smooth noise | Slowly wandering values for sweeps, velocity or density, with a threshold to make gates | Value noise is enough; no need for Perlin proper |
| Arpeggiator orders | Up, down, up-down, converge, random over a set of notes | Overlaps with `randomArpeggio`; decide on one shape |
| Phasing | A pattern against a copy that shifts by a step every n cycles (Steve Reich) | Could be a transport feature (sequence `offset` changed per cycle) rather than an array helper |

Considered and set aside:

- **Mutable Instruments "Grids"-style drum maps.** They depend on trained data tables, and the reference implementation is GPL.
- **A Tidal-style mini-notation.** It is a language of its own and deserves a separate decision, not a helper.

## Appendix A: audit findings this plan depends on

By reading the code on 2026-11-10/11; nothing was run.

**Cracked fork** (`../i_dropped_my_phone_the_screen_cracked`)

- `cracked` is the `find` function; all public methods hang off it. The bundle is one IIFE, concatenated by Grunt in a fixed file order.
- Selector lookup is an exact-string hash (`src/model.js`). No trimming after comma split; no compound classes; `#id` returns the first match only; a node inside a macro is indexed only under its full macro-prefixed key.
- A new node connects from the current selection if there is one, otherwise from `_previousNode` (`src/create.js`). `connect()` with several selected sources uses only the first.
- `stop()` rebuilds the native node from creation settings and reconnects only the last recorded input.
- Values are not tracked after being set. Reading a parameter whose value is 0 returns `null`.
- No `onended` handling anywhere.
- While the loop runs, `start`, `stop`, `attr` and `ramp` use the audio-clock time of the upcoming step. The callback trigger itself, sub-steps for rates of 1 and above, delayed `remove`, and polysynth voice cleanup use main-thread timers.
- A new Worker is created on each loop start and old ones are not terminated. The timer period may be computed from a stale value on start and after a tempo change. Unverified; worth a look if the legacy app shows timing drift.
- `createScriptProcessor` is used only by `script`, and `script` only by `bitcrusher`.
- MIDI: input only, exact status bytes for channel 1, one callback per message type, devices enumerated once.
- No recorder, analyser, `MediaRecorder` or `OfflineAudioContext` use.
- `parse-doc.js` produces the autocomplete data from JSDoc and is not wired into the build. Several JSDoc defaults disagree with the code.

**Euclip client**

- Scripts: `new Function` bound to a scope object rebuilt on every access; the play script is recompiled every step (`client/app/models/script.ts`, `client/app/models/track.ts`).
- Node discovery uses the fork's `onCreateNode` hook and writes selectors into the library's private lookup (`client/app/utils/cracked.ts`).
- Controls: matched by `(nodeType, nodeAttr, nodeOrder)` in three phases; created, saved and destroyed as a side effect of running a script (`setupTrackControls` in `track.ts`).
- Each step: clear one-step modulations, apply all control values, then run the play script.
- Parameter metadata: `utils/audio-node-config.js`, `utils/audio-param-config.js`, `utils/macros/`, and generated autocomplete files, all separate.
- Play rebuilds all audio and the macros.
- Samples decode once in the Cracked sampler and again in `services/sample-pool.ts`.
- Per-sequence rates are limited to 0.25, 0.5, 1, 2 and 4. No swing or triplets.
- Playwright tests check graph structure and spied `AudioParam` calls through the global `__`; none checks rendered audio.

**Rails server**

- Per-project tables: projects, tracks, scripts, sequences, track_controls, filepath_controls, project_samples, snapshots. Snapshot data is already an opaque JSON blob keyed by server track ids.
- Euclidean patterns are computed on the client. The server validates only.
- Track types are Ruby constants; their script text is used server-side at track creation and not sent to the client.
- Project and track creation defaults, duplication (via the `amoeba` gem) and renumbering are in models.
- No whole-project save or load endpoint.
- `access_level` and non-creator roles exist in the schema; nothing enforces or exposes them.
- ActionCable is required but has no channels; no Redis is provisioned.
- Sample audio is served from a Google Cloud Storage bucket; the server holds a search index of about 11,000 paths.
- No request specs cover project create, show, update or delete.
