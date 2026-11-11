# Euclip client + e2e audit (read-only)

All paths are relative to `/Users/jamesstaub/Repos/other/euclip/` unless absolute. `client/app` is abbreviated `app/`. `models/track.ts` is the hub: scope, build, bind, apply.

Caveat: I read `client/theory-of-operation.md` and `client/todo.md`, but several things they describe are stale or not in code (see section 11). Where docs and code disagree, I follow the code.

---

## 1. SCRIPT EXECUTION

**Compile and run**
- Scripts are compiled with `new Function(...)` and `.bind(scope)`. No `eval`, no sandbox.
  - Base class: `app/models/script.ts:68-71`.
  - Setup ("init") script: `app/models/init-script.ts:16-18`. Body is `safeCode`, `this` is `track.scriptScope`.
  - Play ("onstep") script: `app/models/onstep-script.ts:12-14`. Signature is `new Function('index','data','array','sequenceIndex', safeCode)`.
  - Macros script: `app/models/macros-script.ts:14-16`. `this` is `project.macrosScope`.
- `safeCode` is just the code the user last ran, echoed back by the server.
  - `server/app/controllers/v1/scripts_controller.rb:32-43` copies `code` into `safe_code`. A TODO there says sanitising is not implemented.
  - The client serializer does not send `safeCode` (`app/serializers/script.js:5`).
  - The three attrs are `code` (last submitted), `safeCode` (what runs) and `editorContent` (draft) (`app/models/script.ts:11-15`).
- Compile cost: `functionRef` (`script.ts:34-44`) is an uncached getter. The play script is re-compiled on every step.
- `track.scriptScope` (`models/track.ts:1024`) is a getter, so a fresh scope object is built per access (per step). That includes `liveControlsForScript`, which is rebuilt every step. `ScriptModel.scriptScope` (`script.ts:~17`) is declared but unused.

**Script types (3)**

| Type | Rails STI class | Where it runs | Notes |
|---|---|---|---|
| init / setup | `InitScript` | `track.setupAudioFromScripts` (`track.ts:464`) | Builds the chain |
| onstep / play | `OnstepScript` | `track.onStepCallback` (`track.ts:974`, calls `invokeFunctionRef(index,data,array,sequenceIndex)` at 1000) | Per step |
| macros | `MacrosScript` | `project.runMacrosScript` (`project.ts`), before any track's init | Project-wide; defines or declares macros |

- `OnstepScript.applyControlsSetting` (`onstep-script.ts:8`) is an unused attr.
- "Presets" are not a script type. They are just pairs of script text (`models/preset.ts`).

**Injected into the play script as arguments**
- `index`: step position (`onStepCallback`).
- `data`: the step value, a number 0..maxValue. 0 is a rest.
- `array`: the step array.
- `sequenceIndex`: which of the track's sequences fired.
- `step` is NOT injected, despite the docs. `controls` and `playSample` are not bare globals either (see section 11).

**Injected as `this`** (the `scope` object, `models/track.ts:1054-1128`; documented in `app/utils/script-scope-docs.js`)

| Key | Defined | Meaning |
|---|---|---|
| `declareControls(macroType, spec)` | track.ts:1057 | Macro control schema, per track |
| `state` | 1067 | Plain object (`scriptState`, track.ts:102) that persists across steps; reset on each rebuild |
| `bar` | 1068 | `max(barCount-1, 0)`; barCount increments when index===0 (track.ts:985) |
| `files` | 1069 | Array of 16 blob URLs or null, from `downloadedFilepaths` (track.ts:236-258) |
| `filepath` | 1070 | `files[0]` |
| `id` | 1071 | Track id |
| `trackSelector` | 1072 | `.track-N` (or `.track-master`) |
| `stepMs` | 1073 | `project.loopInterval` |
| `sequences` | 1075 | Proxy per sequence: array of steps plus `hits/steps/offset/kind/value/onSteps/offSteps/times/rate/maxValue`, and methods `euclidean/binary/onOff/set` (`scriptSequence`, track.ts:905-965) |
| `euclidean/binary/onOff` | 1077-1079 | Pure pattern generators |
| `setStep(index,value,seqIdx)` | 1081 | Writes live `boundSteps` in place and saves |
| `controls` | 1082 | `TrackControlModel.liveControlsForScript` (`track-control.ts`) |
| `sliders` | 1083 | Raw `trackControlData` |
| `selector(type)` | 1088 | `"type .track-id-N"` |
| `select(sel?)` | 1091 | `__("sel .track-id-N")`, or `__(".track-id-N")` |
| `playSourceNodes(attrs)` | 1099 | `.stop().attr(...).start()` on each source node |
| `playSourceNode(i,attrs)` | 1105 | Same, for one node |
| `playADSRNodes()` | 1113 | `__(uuid).adsr('trigger')` |
| `play(attrs)` | 1118 | ADSRs, then source nodes |
| `stop()` | 1123 | |

- `this.controls` (`track-control.ts` `liveControlsForScript`):
  - It is an array with one entry per TrackNode, also addressable by script `id` or by node type.
  - Reading returns the native-unit value at the current step.
  - Assigning calls `modulate()`: a one-step offset, written straight to the node and cleared at the start of the next step (`track.ts:996`).
  - Sampler entries also expose `sliceCount`, `slices`, and the `startSlice`/`endSlice` aliases.
- `this.defineMacro` and `this.declareControls` exist only in the macros script (`project.ts` `macrosScope`).
- Globals available to scripts: `__` and `cracked`, plus ordinary browser globals (`setTimeout` is used in presets).

**Errors**
- `invokeFunctionRef` (`script.ts:49-58`) wraps in try/catch. A syntax error comes from `functionRef` and is shown as "Syntax error: …"; a runtime error as "Problem Running Script: …".
- `onScriptError` (`script.ts:60-65`) stops the entire project: `project.stopLoop().resetLoop()`. After 100 ms it sets the tracked `alert`.
- Where the alert shows:
  - `script-editor.hbs:55-59`: inline in the editor.
  - `script-wrapper.hbs:11,14`: tab "beacon".
  - `track-list-item.hbs:36`: tooltip on the source button.
  - `track.scriptAlert`, `track.ts:177`.
- Alert side effects:
  - `setupTrackControls` treats `initScript.alert` as "script not OK" and then does not delete orphan controls (`track.ts:693,776`).
  - Sampler file-load errors also write `initScript.alert` (`track.ts:520`).
- No try/catch around the loop callback itself beyond `invokeFunctionRef`. An exception in `applyControls` or setup code outside the script propagates into cracked's loop.

**Editor**
- Run is `runCode` (`script.ts:82-103`). It waits for any pending draft save, sets `code = editorContent`, `save()`, then:
  - for init or macros scripts: `project.initSignalChain()`. If playing, it first calls `stopLoop()`, then `startLoop()` afterwards.
  - for onstep: nothing else. The new code is picked up on the next step because it is recompiled every call.
- Drafts autosave via `updateScriptTask` (restartable, 1000 ms debounce for `editorContent`) (`script.ts:106-118`).

---

## 2. SIGNAL CHAIN LIFECYCLE

**Entry points** (all end in `track.setupAudioFromScripts`, `track.ts:464`)
- `project.initSignalChain()` (`project.ts:130-136`): `disconnectAll()`, then `runMacrosScript()`, then the master track's setup, then `downloadTrackSamples()`, then every other track's setup. Called from route `afterModel` (`routes/user/creator/project.js:23`), controller `play()` (`controllers/user/creator/project.js`), `runCode`, and my-projects play.
- Single track: new track (`project.ts` `setupTrack` and `setupAndSaveNewTrack`, passing `unbindBeforeCreate=false`), `setFile` (`track.ts:393`), `clearSound` (`utils/sampler-files.ts`), `updateTrackTask`, and a destroy rollback.

**Discovery of nodes** (`track.ts:481-533`)
- Cracked is a fork with a `__.onCreateNode(node, type, creationParams, userSettings)` hook, installed per build via `extendOnCreateNode` (`utils/cracked.ts:119`) and cleared in `finally` (`track.ts:555`). It is a single global slot.
- For each created node the hook records `{uuid, nodeType, userSettings, parentMacro}` into `track.settingsForNodes`. This happens only if `__.isFun(cracked[type])` and the node is not inside a macro container.
- Selectors are tagged via `addCustomSelector` (`utils/cracked.ts:45-50`), which pokes cracked internals (`_getNodeLookup`/`_setNodeLookup`, `node.selector_array`). Selectors per node:
  - `.track-N` or `.track-master`
  - `.track-id-<trackId>` (the stable one)
  - `"<type> .track-N"`
  - `"<type> .track-id-<id>"` (what `this.select` uses)
  - the node UUID (bare string)
- Two file-load hooks:
  - `userSettings.callback = ({buffer,error})` (cracked-fork addition) sets `fileLoadState` and calls `trackNode.setSamplerControlsToBuffer` (`track.ts:507-525`).
  - `node.ui = userSettings.ui` is "hacked on" (`track.ts:526-531`, "see cracked.js line 330").

**TrackNode records** (`models/track-node.ts`; client-only, never saved; adapter throws on save, `adapters/track-node.js`)
- After the script runs, all existing TrackNode records for the track are unloaded (`track.ts:560`) and recreated by `createTrackNodeRecords` (`track.ts:615-678`).
- `id = uuid`, `nodeUUID`, `nodeType`, `order` (creation index among top-level nodes), `parentMacro` (a cracked node, `@attr` hack), `isChannelStripChild`.
- Only channelStrip children of macros get TrackNodes; other macro internals are skipped.
- Transient: `userSettingsForControl` (numeric literals, booleans as 0/1, macro choice indices) and `scriptId` (the `id:` the script passed).
- `uniqueSelector` is just the uuid.
- `applyOrderOfType` (`track.ts:580`) computes `orderOfType` per node type. This is the sampler "slot" used for filepath controls.

**TrackControl linking** (`setupTrackControls`, `track.ts:689-793`)
- A control is matched to a node by `(nodeType, nodeAttr, nodeOrder)`.
- Phase 1: exact match. Phase 2: if the script changed and order shifted, adopt a same-type/attr unclaimed control and heal `nodeOrder`. Phase 3: create a new control from `node.defaultControlParams(attr)` (`track-node.ts`) and save it.
- Controls whose node is gone are destroyed, but only if the script ran cleanly (`!initScript.alert`).
- Samplers get a `FilepathControl` per slot (`findOrCreateWith`, an empty client-only record when no file).
- `updateDefaultValue()` implements "script literal is the source of truth": if the numeric literal in the script differs from the stored `scriptValue`, the control resets to it (`adoptScriptValue`); otherwise user edits are kept (`track-node.ts`).
- Ends with `applyControls(this.trackControls)` (the bulk push to audio).

**Which attrs get controls:** `TrackNodeModel.controlAttrsFor(nodeType)` reads the hand-written `AudioNodeConfig` (`utils/audio-node-config.js`). `path` is excluded. For macros it uses the schema (`utils/macros/library.ts`). A node type absent from `AudioNodeConfig` gets no controls.

**Teardown and rebuild**
- `unbindAndRemoveCrackedNodes` (`track.ts:967`): `__(".track-id-N").unbind('step')` plus `.remove()`. This runs at the start of every rebuild (default `unbindBeforeCreate=true`).
- Project level: `disconnectAll` is `__('*').unbind('step'); __.reset()` (`utils/cracked.ts:96-99`).
- Track delete: `destroyAndCleanup` (`track.ts:131`) sets `isTearingDown`, removes cracked nodes, waits for in-flight saves, `destroyRecord` (server cascades), unloads child records, and sweeps again in `finally`. On failure it rolls back and rebuilds.
- Duplication caveat: `.track-N` is not stable after renumbering. A TODO at `track.ts:1008` asks for a `trackCreatedOrder`. Internals use `.track-id-N`.

**Connection to the main output**
- The master track (`is_master`, hidden "Main Output") default setup is (`server/app/models/init_script.rb:14-21`): `__().compressor({release:.1,id:'main-output'}).channelStrip().dac()`.
- Other tracks end with `.channelStrip().connect('#main-output')`. This is a global id selector (`#main-output`).
- It works because the master is built first (`project.ts:130-136`).
- A comment in `server/app/models/track_type.rb` warns that id selectors are page-global, so duplicated tracks collide. The workaround is `this.selector('gain')`.
- `channelStrip` is a macro defined in the app via `cracked.channelStrip = function…` (`utils/cracked.ts:26-33`). `begin('channelStrip').gain().panner().end()`. It is installed in the project controller constructor (`controllers/user/creator/project.js`).
- `nodeToVisualize` (oscilloscope) is the channelStrip's native node (`track.ts:431`).

---

## 3. CONTROLS AND PARAMETER STATE

**TrackControl model** (`models/track-control.ts`). Attrs:
- `nodeOrder`, `nodeType`, `nodeAttr`, `interfaceName`, `currentUnitTransformIdx`, `min`, `max`, `stepSize`, `defaultValue`, `controlValue`, `scriptValue`, `applyHitsOnly`, `controlArrayValue` (per-step array), `sequenceOrder`.
- Transient: `modulation`.
- Relations: `track`, `trackNode`.

**Interface names:** `slider`, `multislider`, `toggle`, `select`. The `dial`/`piano`/`position`/`envelope` entries in `audio-node-config.js` are declared but only these four are handled in the model. Slider/multislider/number/piano/waveform surfaces are in `app/components/controls/`, built on NexusUI (`nexus-*`, `modifiers/nexus-ui*.js`).
- `isBinary` is a single unit named "Boolean", which gives a toggle.
- `isSelect` is a macro choice setting.
- "Number box" exists as `components/controls/number-box.js`.

**Value layers** (comment at `track-control.ts:~52`):
1. `defaultValue`: the script's literal, or the spec default.
2. `controlValue`: user setting.
3. `modulation`: one-step script offset.
- Multislider mode reads `controlArrayComputed[stepIndex]`, padded with `defaultValue` and trimmed to the sequence length.
- `effectiveValue(i) = modulation ?? attrValueForType(i)`.

**Units:**
- Each attr has a unit list (`unitOptionsForNode`, `utils/audio-param-config.js:403`), e.g. speed is `[Play Rate, Half Steps, Cents, Loop Sync]`.
- Each unit has a `func(value, {intervalMs, sampleLenSec, seqSteps, sliceBoundaries})` and its own min/max/step/default (`defaultNodeParamsByUnit`, line 434).
- `transformCurrentUnit` converts UI value to native units. The transform is one-way (UI to native); there is no inverse. `modulatedUiValue` can only draw markers for identity units.
- Min/max/default when first created: `defaultParams` (generic per attr, `utils/audio-node-config.js:244`), overridden by `defaultNodeParamsByUnit[nodeType][attr][firstUnit]` (`track-node.ts` `defaultControlParams`).

**Storage:**
- Server table `track_controls`, unique on `(track_id, node_type, node_order, node_attr)` (`server/db/schema.rb`).
- Also copied into snapshots (see section 5).
- Controls have no id that survives a script change except via the `(type, attr, order)` key matching.

**When values are applied to audio** (there is no function literally named `applyTrackControls`; the equivalent is `track.applyControls`, `track.ts:800`)
- `TrackControlModel.getAttrsForNodes(controls, index, sequenceSteps)` builds `{uniqueSelector: {attr: value}}`.
  - Skips channelStrip nodes on step ticks.
  - Skips multisliders with `applyHitsOnly` on rest steps.
  - Skips controls whose `trackNode.nodeType` no longer matches.
- `applyNodeAttrs` (`utils/cracked.ts:144`) writes with `__(uuid).attr(attrs)`, or `__(uuid)[macroType]('update', attrs)` for macros.
- Triggers:
  - After rebuild: `setupTrackControls` (`track.ts:792`).
  - Every step: `onStepCallback` clears modulations (`track.ts:996`), then `applyControls(controlsForThisSequence, index, sequence.sequence)` (997), then runs the play script (1000).
  - On UI edit: `setValue` (`track-control.ts`) calls `applyToAudio` for non-array values.
  - Snapshot switch: `applyControls` in `snapshot-runtime.ts`.
- Samplers are special: they are re-created on every `start()`, so `playSourceNode` re-sends all control values with `.stop().attr(...).start()` (`track.ts:1037-1050`).
- `toAudioAttrs` strips the euclip-only `snap` (`track-node.ts`).

**Script read and override**
- Read: `this.controls.<type|id|index>.<attr>`.
- Override: assign for the current step only. It cannot change the slider.
- Alternative: `__(...).attr()` directly. The sliders are reapplied at every step start, so a direct `.attr()` set in the previous step is overwritten (template text at `track_type.rb` SAMPLER onstep; `todo.md`).
- A script literal changing resets the control (`updateDefaultValue`; the e2e `params.spec.ts` "only editing the script resets a control the user changed" covers this).
- Not found: a way for a script to mark a param as script-owned or to disable its control. `todo.md` lists these as TODO ("enabled/disabled", LFO-driven auto-disable).

**Param metadata sources (hand-maintained plus generated docs)**
- `app/utils/audio-node-config.js` (529 lines): `AudioNodeConfig` (node to attrs `[min,max,default,interfaces]`), `defaultParams` (per attr), `supportedAudioNodes`. Its own comment at lines ~36-39 says this should become the single source of truth but is not yet.
- `app/utils/audio-param-config.js` (584 lines): units and transforms. Calls `cracked.pitch2freq` at lines 245,248.
- `app/utils/macros/{library.ts,schema.ts,define.js,cracked-overrides.js}`: macro schemas (polysynth, monosynth, siren, wobble examples). Settings have `{label, role, unit, min, max, step, scale, default, type:'choice', choices}`.
- Autocomplete and docs: `app/utils/autocomplete/{object-completions.js,arg-completions.js}` are headers-commented "Parsed JSDocs from cracked repo parse-doc.js" (generated from the Cracked repo, checked in). `supplemental-args.js` is hand additions. Also `components/cracked-node-docs.js`.
- `app/utils/script-scope-docs.js`: hand-written docs for `this.*`. Dev-only `warnUndocumentedScopeKeys` (`track.ts:1130`) warns when `scriptScope` keys lack docs.
- The three metadata stores (`AudioNodeConfig`, `defaultParams`, `audio-param-config`) plus autocomplete data are separate and can disagree. None reads param metadata from the live Cracked nodes.

---

## 4. SEQUENCER / TRANSPORT

**Sequence model** (`models/sequence.ts`)
- Attrs: `order`, `kind` (`euclidean|binary|onoff`), `hits`, `steps`, `offset`, `value`, `onSteps`, `offSteps`, `times`, `rate` (one of 0.25,0.5,1,2,4 in `CLOCK_RATES`), `maxValue`, `customSequence` (hand-made steps; overrides the generated pattern if non-empty).
- `get sequence()` (line ~70) returns `customSequence` if set, else `binaryPattern`/`onOffPattern`/`E(hits,steps,offset)`.
- Server columns match (`sequences` table). `custom_sequence` is `float[]`.
- Multiple sequences per track are implemented (unique `(track_id, order)`). `todo.md` says "Implement hasMany sequence" and is stale.
- `applySequenceChange` (`track.ts:293`) clears `customSequence` whenever a pattern-shaping param changes (except `customSequence`, `rate`, `maxValue`).

**Euclidean computation:** `app/utils/euclidean.js`, a vendored algorithm. `E(hits, steps, offset)` calls `getPattern(...).rotate(offset)` (line 95). It also monkey-patches `Array.prototype.rotate` globally (line 5). Other patterns: `app/utils/sequence-patterns.js` (`MAX_PATTERN_STEPS = 64`).

**Binding to the Cracked loop**
- `track.bindToSequencer` (`track.ts:829`) calls, per sequence, `bindToLoopStep(stableSelector, cb, stepsArray, {loopIndex, rate})` (`utils/cracked.ts:106-116`), i.e. `__(".track-id-N").bind('step', cb, array, options)`.
- `rate` and `loopIndex` are fork options (theory doc says `loopStep` divides ticks).
- `loopIndexFor` (`track.ts:813`): when a track rebinds mid-play, the loop position is derived from `project.stepIndex` (last tick of the master) so it stays phase-aligned.
- All of a track's listeners share the stable selector, so one `unbind('step')` removes them all.
- `boundSteps` is the array the listener walks. `setStep` mutates it in place; there is no rebind mid-step.
- `queueSequenceChanges`/`flushSequenceChanges` (`track.ts:868-897`): script changes made through `this.sequences` are held until the step is over, then rebound; a changed sequence that just ended restarts from step 0.
- `onStepCallback` (`track.ts:974`): primary sequence sets `track.stepIndex`; master also sets `project.stepIndex`.

**Transport and tempo**
- `project.loopInterval = 60000 / (bpm*2)` ms (`project.ts:126`): one step per eighth note. `bpm` is the active snapshot's `bpm` (project getter/setter, `project.ts:~40`).
- `startLoop` (`utils/cracked.ts:55-60`): `__.loop('start'); __.loop(interval); __('dac').start()`.
- `stopLoop`: `__.loop('stop'); __('*').stop(); stopDelays()` (ramps delay/comb feedback and gain to 0).
- `resetLoop`: `__.loop('reset')`. `project.resetLoop` also sets all `stepIndex = -1` and `barCount = 0`.
- Play sequence (`controllers/user/creator/project.js` `play`): `stopLoop`, `resetLoop`, `await initSignalChain`, `startLoop`. Every play rebuilds all audio (and macros).
- BPM changes (`updateProject`, same controller): sets the model, calls `startLoop()` again if playing (reconfigures the loop interval), saves after 1000 ms.
- Clock rate: per-sequence `rate`. The master always runs at 1 (`clockRateOf`, `track.ts:821`).
- Swing, triplets, bars and beats: not found. `todo.md` lists them as TODO.
- Snapshot hook: `__.loop({interval}, () => onStep(), [])` registers a once-per-step hook that cracked calls before step listeners (`snapshot-runtime.ts:195`).

---

## 5. SNAPSHOTS and MACROS

**Snapshot model** (`models/snapshot.ts`): `name`, `position`, `bpm`, `data` (a `json-string` transform), `createdAt`. `belongsTo project`. `project.activeSnapshot` is a belongsTo with `inverse: null`. The data shape (`SnapshotData`) is `tracks[trackId] = {controls: {"type:order:attr": {…9 fields}}, sequences: […], onstep?: {safeCode, editorContent}}`.
- Not captured: init scripts, macros script, filepath/sample assignments, track list. Per `models/project.ts` comment and `docs/plans/snapshots-and-sample-pool.md`: tracks, init scripts and the sample pool are shared by all snapshots.

**snapshot-runtime service** (`services/snapshot-runtime.ts`)
- `capture(project)` reads the current model state into `data`.
- `apply(project, snapshot)` writes it back: controls (and `applyToAudio` for non-multislider), sequences (create/update/delete, then `track.rebindSequences()`), onstep script (`safeCode` and editorContent; saves).
- `saveCurrent` creates a new snapshot copying the active one's captured data. `switchTo`: stopped means immediate; playing means queued and applied on the next step via the `__.loop` hook (`snapshot-runtime.ts:187-222`). The swap also calls `__.loop(interval)` to retime the tempo and POSTs `/v1/snapshots/:id/activate` via raw `adapter.ajax`.
- Every control/sequence/script write in `apply` fires its own `save()`, so a switch can issue many PATCHes (`snapshot-runtime.ts:121,157,181`).
- `swap` saves the old snapshot's `data` on every switch.
- A track added after a snapshot was saved keeps its current settings when that snapshot is applied.

**"Macros" in this UI** means cracked macros (instruments made of several nodes), not performance macro knobs.
- `channelStrip` (gain + panner) is the built-in one.
- The Macros menu (`components/macro-menu.js`) lists `MACRO_EXAMPLES` (`utils/macros/library.ts`): polysynth, monosynth, siren, wobble examples. Choosing one loads a documented example into the track's init and onstep scripts, and its schema declaration into the project macros script (`script-wrapper.js` `applyMacro`).
- Users can register their own with `this.defineMacro(name, {controls, create, update, methods})` in the project macros script (`utils/macros/define.js`). `define.js` overwrites `cracked[name]` globally and restores it via `undefineMacros`.
- `utils/macros/cracked-overrides.js` wraps cracked's `polysynth` and `monosynth` at app boot (`initializers/macros.js`) to add `update` support.
- The project-wide macros script tab ("macros") is in the script panel.
- Not found: any "macro knob that maps one control to many parameters".

---

## 6. CRACKED API SURFACE ACTUALLY USED

**A. By app code** (grep of `app/`, excluding autocomplete and docs data)

| Cracked API | Files |
|---|---|
| `__(sel)` selection, `.attr()` | `utils/cracked.ts:141,151`, `models/track.ts` |
| `.remove()` | `track.ts:162,969` |
| `.start()`, `.stop()` | `utils/cracked.ts:58,65,73`, `track.ts:1046-1049,1125` |
| `.bind('step', cb, array, {loopIndex, rate})` (fork options) | `utils/cracked.ts:115` |
| `.unbind('step')` | `utils/cracked.ts:97,129` |
| `.ramp(0, t, 'feedback'/'gain')` | `utils/cracked.ts:88-89` |
| `.adsr('trigger')` | `track.ts:1115` |
| `__(uuid)[macro]('update', attrs)` | `utils/cracked.ts:146` |
| `.polysynth/.monosynth/.siren/.wobble(...)` | `utils/cracked.ts`, `utils/macros/*` |
| `__.loop('start'/'stop'/'reset'/ms)` | `utils/cracked.ts:56-57,72,81`, `snapshot-runtime.ts:215` |
| `__.loop({interval}, fn, [])` | `snapshot-runtime.ts:195` |
| `__.reset()` | `utils/cracked.ts:98` |
| `__.begin/.end` | `utils/cracked.ts:27-29` |
| `__.exec`, `__.each` / `cracked.each`, `cracked.exec` | `utils/macros/library.ts:231-241`, `utils/macros/cracked-overrides.js:18,23,68`, `define.js:10` |
| `el.search(name)`, `el.getParams().settings` | `cracked-overrides.js:19-22,40,68`, `define.js:65` |
| `__.isFun` | `track.ts:493` |
| `__.isStr` (as `cracked.isStr`) | `modifiers/nexus-ui.js:127` |
| `__.pitch2freq` / `cracked.pitch2freq` | `utils/audio-param-config.js:245,248`, `utils/macros/library.ts:241` |
| `cracked.getContext()` | `services/sample-pool.ts:86` (decodeAudioData for the pool; previews connect straight to `context.destination`) |
| `__.onCreateNode` assignment (fork) | `utils/cracked.ts:120` |
| `__._getNode`, `_getNodeLookup`, `_setNodeLookup` (fork internals) | `utils/cracked.ts:16,45,48,173`, `track.ts:435,489`, `components/signal-chain-creator.js:161` (commented) |
| Node methods: `getUUID`, `getNativeNode`, `isMacroComponent`, `getMacroContainerUUID`, `getType`, `selector_array`, `.ui` | `track.ts:483-503,657`, `track-node.ts:222`, `components/script-variables-list.js:91` |
| `__('dac')` | `utils/cracked.ts:58` |
| `__('delay,comb')`, `__('*')` | `utils/cracked.ts` |
| `__.size()` | tests only |
| `cracked.channelStrip = …` (adds a method) | `utils/cracked.ts:26` |
| `__.random/chance/scales/chords` | `utils/macros/library.ts` (inside macro example script strings; also `__.fill_array`, `__.shuffle` in track_type scripts) |
| `__().sampler({filepath})` + `.play()` | `utils/cracked.ts:164` (preview helper; uses key `filepath`, not `path`) |

**B. Fork-specific Cracked features the app depends on** (these must be reproduced by the new library or replaced)
- `__.onCreateNode` hook.
- `_getNodeLookup`/`_setNodeLookup`/`selector_array` custom selectors.
- Sampler `callback({buffer,error})` and a `ui` attribute on nodes.
- `bind('step', …, {rate, loopIndex})`.
- `__.loop({interval}, fn, [])` once-per-step hook.
- `isMacroComponent`/`getMacroContainerUUID`.
- Macro `update`.
- `size()`.
- Source: `client/vendor/cracked.min.js`, built from the external repo `i_dropped_my_phone_the_screen_cracked` (`client/ember-cli-build.js` comment).

**C. Used by built-in preset/example scripts** (presets live in the Rails server, not the client)
- Sources: `server/app/models/track_type.rb` (10 track types, the "New Track" menu), `server/db/seeds.rb` (the 4 "Sampler" collection presets; the other 5 `PresetCollection`s are created empty), `server/app/models/init_script.rb` and `onstep_script.rb` (defaults), `server/app/models/macros_script.rb`, plus `app/utils/macros/library.ts` (macro examples, client-side), and `app/components/signal-chain-creator.js:74-82` (generated script).
- Chain methods used: `sampler({path, loop, reverse, speed})`, `sine({frequency})`, `lowpass({frequency,q})`, `gain({gain})`, `adsr('fast')`, `compressor({release,id})`, `polysynth({…})`, `channelStrip()`, `connect('#main-output')`, `connect(this.selector('gain'))`, `.dac()`, `.start()`, `.stop()`, `.attr()`, `.adsr('trigger')`.
- `__.*` helpers: `random`, `chance`, `scales`, `fill_array`, `shuffle`. Also `__.chords`, `__.pitch2freq` in the macro library (`library.ts:266,241`).
- `.polysynth('noteOn'/'noteOff', {pitch,velocity,envelope})` via `this.select('polysynth')`.
- Pure JS: `setTimeout` is used in the polysynth scripts (so note-offs are not quantised to the loop).
- All track scripts depend on `this.files[n]`, `this.controls`, `this.play*`, `this.select/selector`, `this.sequences`, `this.state`, `this.bar`, `this.stepMs`, `this.setStep`, `this.euclidean`.

---

## 7. DATA LAYER

**Stack:** ember-data ^5.3.0 (`package.json`), JSON:API adapters (`adapters/application.js`: prefixes `/v1`, Bearer header, content-type `application/vnd.api+json`). Rails 7-ish API with `jsonapi-serializer` and Devise-JWT.

**Models** (`app/models/`)

| Model | Attrs | Relationships | Persisted? |
|---|---|---|---|
| project | `title`, `slug`, `stepIndex` (not serialised, `serializers/project.js`) + getter `bpm` (via activeSnapshot); tracked `isPlaying` | `creator`→user, `tracks`, `snapshots`, `activeSnapshot` (inverse null), `projectSamples`, `macrosScript` | yes |
| track | `isMaster`, `trackType`, `order`, `stepIndex`, `state` (client-only meaning but declared `@attr`) | `project`, `initScript`, `onstepScript`, `audioFileTree`, `trackNodes`, `trackControls`, `filepathControls`, `sequences` | yes |
| init-script / onstep-script / macros-script (extend script) | `code`, `safeCode`, `editorContent`; onstep also `applyControlsSetting` | `track` (macros: `project`) | yes; `safeCode` not serialised |
| sequence | `order`, `kind`, `value`, `onSteps`, `offSteps`, `times`, `hits`, `steps`, `offset`, `rate`, `maxValue`, `customSequence` | `track` | yes |
| track-control | `nodeOrder`, `nodeType`, `nodeAttr`, `interfaceName`, `currentUnitTransformIdx`, `min`, `max`, `stepSize`, `defaultValue`, `controlValue`, `scriptValue`, `applyHitsOnly`, `controlArrayValue`, `sequenceOrder` | `track`, `trackNode` | yes |
| track-node | `userDefinedInterfaceName`, `nodeUUID`, `nodeType`, `order`, `parentMacro` (a live cracked node as an attr), `isChannelStripChild` | `track` (inverse named `trackNode`, not `trackNodes`, a quirk), `trackControls`, `filepathControl` | NO (adapter throws on save) |
| filepath-control | `nodeOrder`, `controlValue` | `track`, `trackNode`, `projectSample` (inverse null) | yes; empty slots are client-only (server refuses empty path) |
| project-sample | `path`, `label`, `position`, `onsetThreshold`, `usages` (server-computed) | `project` | yes |
| snapshot | `name`, `position`, `bpm`, `data`, `createdAt` | `project` | yes |
| sound-file | `filePathRelative`, `downloadedURI`, `order`; tracked state/duration/errorMessage | none | NO (client-only; `store.createRecord` + fetch) |
| audio-file-tree | tracked `directoryTree` | `track` | NO; fetches `/v1/files…` |
| preset, preset-collection | `title`, `initScript`, `onstepScript` / `title` | `presetCollection` / `presets`, `creator` | yes (read-only in practice) |
| user | `username`, `email`, `avatar`, `password` (write-only) | `projects` | yes |

- Orphan/duplicate: `models/filepath-control.ts` and `models/track-control.ts` have commented-out older versions in the class body. `models/track.ts` has `// FIXME: move this to the filepathControl record?` twice.
- Transforms: custom `json-string` (`app/transforms/json-string.js`, used by snapshot `data`), plus overrides of boolean/number/string.
- Types: `types/model.d.ts` is the registry.

**Adapters** (`app/adapters/`)
- `application.js`: prefix, headers.
- `project.js`: `queryRecord` to `/users/:creatorId/projects/:slug`, `findAll` to `/users/:userId/projects?include=…` with a long include string (`projectIncludeParams`: creator, snapshots, project-samples, tracks, tracks.sequences, tracks.track-controls, tracks.filepath-controls, tracks.init-script, tracks.onstep-script, macros-script). Create appends the same include.
- `track.js`: create goes under `/projects/:slug/tracks?include=…`. For `duplicateId` the response is an array of renumbered tracks, which the adapter splits and `pushPayload`s, with a "HACK" JSON clone for an Ember Data proxy bug (`adapters/track.js:30-60`). `deleteRecord` pushes the renumbered payload. `createMultipleTracks` is a custom bulk call (`/v1/projects/:slug/tracks/bulk`; note it hardcodes `/v1` and bypasses `buildURL`).
- `track-node.js`: throws on create or update.
- `user.js`: overrides `ajax` with raw `fetch` (login/registration endpoints; `/login` and `/registration` have no `/v1` prefix).
- `project-sample.js`, `snapshot.js`: nested URLs for create and query.
- `track-control.js`: empty.
- Serializers: `application.js` (JSONAPI, `creator`→`user`), `script.js` (skips `safeCode`, deletes null attrs), `project.js` (skip `stepIndex`), the rest are empty subclasses.

**save/destroy call sites (non-trivial)**
- Debounced/queued:
  - `TrackControlModel.saveTrackControl` (restartable, 1000 ms; `track-control.ts:~538`) uses `store.saveRecord(this)`.
  - `track.saveTrackSequence` (keepLatest, 1000 ms, batches a `Set`; `track.ts:323-332`).
  - `script.updateScriptTask` (restartable, 1000 ms for editorContent).
  - `controller.updateProject` (keepLatest, 1000 ms).
  - `sample-pool.setOnsetThreshold` (runloop `debounce`, 500 ms).
  - `file-picker/search.ts` (200 ms timeout on search input, not a save).
- Immediate saves:
  - `track.save` (project.ts:100,185).
  - `track.updateTrackTask` (track.ts:345).
  - `track.setFile` (filepath-control save; track.ts:397).
  - `addSequence`/`removeSequence` (track.ts:359,374).
  - Script `runCode` (script.ts:86).
  - Controller: `updateName`, snapshot rename/delete.
  - `routes/user/new.js:16` creates the project.
  - `components/track-footer-container.ts:114` `updateControlAttr`.
  - Snapshots: `snapshot-runtime.ts` (many).
  - Delete: `track.destroyAndCleanup`, `controls.destroyRecord` in `setupTrackControls` (track.ts:779), `sampler-files.ts:83`, `my-projects` controller.
- `unloadRecord` use: `track.ts:149,560,778,786`.
- Note: `setupTrackControls` creates and saves controls as a side effect of running a script (every rebuild may POST/DELETE).

**Project route load** (`routes/user/creator/project.js`)
- `model`: `store.queryRecord('project', {slug, creatorId, include})` (one request, everything via `include`).
- `afterModel`: `await project.initSignalChain()`.
- `setupController`: `fetchAudioFileTrees` (creates `audio-file-tree` records per track, each fetching `/v1/files/<path>`), a default tree, `getPresets` (`findAll('preset-collection', {include:'presets'})`), `samplePool.preload(project)` (background fetch and decode, 3 at once), `trackTypes.load()` (`/v1/track-types`).
- The child route `routes/user/creator/project/track.js` does `store.findRecord('track', id, {adapterOptions:{slug}})`, an extra fetch that `track.js` adapter hits at `/projects/:slug/tracks/:id`.
- `my-projects` route loads every project with the full include list (`todo.md` flags this).

**Server-computed or server-owned things the client depends on**
- `safe_code` (copied from `code`; defaults per script type).
- Default scripts per track and master (`init_script.rb`, `onstep_script.rb`, `track_type.rb`, `macros_script.rb`).
- Track `order` renumbering on create/duplicate/delete (client relies on pushed payload).
- Track-type defaults (`TrackType`, `GET /v1/track-types`; the client `applyTrackTypeControls` applies `controls` such as `{'sampler.speed': {unit:'Loop Sync'}}` after the first build).
- Project: slug uniqueness, initial `Main` snapshot, `active_snapshot`, macros script, first track and master track creation (`Project.create_with_relations!`, `project.rb:~40`). Project `bpm` mirrors the active snapshot (server `sync_bpm_to_active_snapshot`).
- `project_sample.usages`, auto label, auto path normalisation, auto-add to pool when a filepath_control is created (`track.rb:40`).
- `meta.created` on duplicate responses.
- Track duplication uses `amoeba` deep clone (`track.rb:~16`).
- Permissions via CanCan `Ability`/`UserRole`.
- Not found client-side: any computed attribute for controls (the client computes `min/max/default`).

---

## 8. AUTH / OFFLINE

- Auth: ember-simple-auth ^6 with the Devise authenticator (`app/authenticators/euclip-auth.js`): POST `/login` (`identificationAttributeName = 'login'`), DELETE `/logout`. Token is a Devise-JWT Bearer token held in the ESA session (localStorage key `ember_simple_auth-session`; e2e reads it, `helpers.ts`). Server: devise-jwt, allowlist table `allowlisted_jwts`, 30-day expiry (`server/config/initializers/devise.rb:29-43`).
- `ApplicationAdapter.headers` adds `Authorization: Bearer <token>` (`adapters/application.js`).
- Route guard: `routes/user.js` `beforeModel` calls `currentUser.load()` (a `findRecord('user', id)`); `afterModel` redirects to `login` if not authenticated. `routes/application.js` calls `session.setup()`. Everything except `login`, `signup`, `about`, `styleguide` is under `user` (router.js).
- `ENV.APP.API_HOST` is declared but not used by the adapter (`API_PREFIX='/v1'` is relative); `contentSecurityPolicy connect-src: *`.

**What breaks with no backend** (reading code; not run)
- Every route under `/` requires auth. With no session you are sent to `/login`, and login needs the server.
- All projects, tracks, scripts, controls, sequences, snapshots and the track-type list come only from the API. There is no local persistence layer in the client.
- Default scripts and track types exist only on the server (`TrackType`, `init_script.rb`), so a new track cannot be created offline. `trackTypes.load` falls back to a single plain sampler entry (`services/track-types.ts` FALLBACK) but the track itself still needs `POST`.
- Sound browsing (`/v1/files/*`, `/v1/files/search`) is served from the server's DB (`SearchableFile`/`SearchableDirectory`). Sample audio itself is fetched from a Google Cloud Storage CDN (`ENV.APP.AUDIO_CDN_ROOT` and `DRUMMACHINES_CDN_PATH`, `config/environment.js`), not from the server.
- Works without the server: `/styleguide`, `/about` (these are the only routes outside `user`).
- Samples decode locally (`SamplePool`), but the pool list and paths come from the API.
- The `/new` route creates a project via `POST` (`routes/user/new.js`).
- Autosave is optimistic only for in-memory state; failed saves are logged to console in most places (`logSaveError`, `console.error`) with `track.updateTrackTask` rolling back.

---

## 9. SOUND FILES

- Catalog browse: `AudioFileTreeModel.fetchDirectory` (`models/audio-file-tree.ts`) GETs `/v1/files<encodedPath>` or `/v1/files/search?q=&page=`. Responses are cached by the `request-cache` service (`services/request-cache.ts`). One `audio-file-tree` record per track, plus a default one.
- Server source: `server/app/controllers/v1/files_controller.rb`, tables `searchable_directories`/`searchable_files`, seeded from `server/db/seeds/mp3filepaths.txt`.
- UI: `components/file-picker/*`, `components/sounds/{list,target-card}.ts`, `components/source/{container,node-tabs,sampler-rack}.ts`. Drag-and-drop via modifiers `draggable-sound.js` and `sound-drop.js`. Keyboard navigation is in the sound-browser (per the e2e spec).
- Reference format: a catalog path string such as `/Korg/Korg 01W/AGG.mp3`, normalised to a leading slash.
  - Stored in `filepath_controls.control_value` and `project_samples.path`.
  - `filepath_controls.node_order` is the sampler slot.
  - `filepath_controls.project_sample_id` links to the pool entry.
- It is not an id or URL. Scripts see blob URLs, not paths: `this.files[slot]`, `this.filepath`.
- Download: `SoundFileModel.findOrDownload` (`models/sound-file.ts`) creates a client-only `sound-file`, fetches the CDN URL `DRUMMACHINES_CDN_PATH + encodeFilePath(path)`, checks the blob MIME (mp3/wav only), and keeps `URL.createObjectURL(blob)` as `downloadedURI`. In-flight requests are de-duped by path. `ASSETS_PATH='/assets'` paths bypass the CDN prefix (`sound-file.ts:~85`).
- Mapping slots to scripts: `track.downloadedSoundFiles` (`track.ts:236`) builds a 16-slot array by matching `filepathControl.controlValue` to downloaded sound files. Before a download finishes, entries are null, so samplers are created without a path and are silent until loaded.
- Decoding: cracked's sampler node fetches and decodes the blob URL itself, per sampler node, on every rebuild (`docs/plans/snapshots-and-sample-pool.md` section 2). The `SamplePool` service (`services/sample-pool.ts`) separately decodes each path once with `cracked.getContext().decodeAudioData` for UI use (waveforms, previews, onsets). Two parallel decode paths, and the pool's buffer is not shared with the cracked sampler.
- Slices and onsets: `utils/onsets/engine.ts` wraps `public/workers/onsets.js` (worker with a main-thread fallback). `SamplePool.analyzeOnsets` runs it after decode. `PoolAudio.boundaries = [0, ...onsets, duration]`. Threshold per sample is stored as `project_samples.onset_threshold` and saved after a 500 ms debounce. `TrackNode.sliceBoundaries`/`sliceCount`/`sliceIndexFor`, and the "Slice" unit for `start`/`end` (`audio-param-config.js`). Scripts get `controls.sampler.slices`/`sliceCount`/`startSlice`/`endSlice`. A `wasm/` Rust crate and `public/wasm/` exist; I found no import of it under `app/`, so it appears unused for onsets (not verified beyond grep).
- Pools: `project_samples` per project, a unique `(project_id, path)` and `(project_id, label)`. The pool is shared across snapshots. Removal is refused while referenced (`has_many :filepath_controls, dependent: :restrict_with_error`).
- Uploads: not found. Docs say "later".
- Known issues from `todo.md`: multiple filepath controls per track race; `https://localhost:4200/v1/files/WAV%20hh+filterloops` URL bug (the server comment in `files_controller.rb` says it now handles `+`).

---

## 10. E2E COVERAGE (`e2e/tests`, Playwright, Chromium, 1 worker, real stack, no mocked API)

Config: `e2e/playwright.config.ts`. Runs against `E2E_BASE_URL` or `http://localhost:4200`. Logs in as the seeded `james` user (`helpers.ts`). Chrome launched with `--autoplay-policy=no-user-gesture-required`.

| Spec | One-line summary |
|---|---|
| `controls.spec.ts` | Channel-strip gain edited in the UI survives play and reload; asserts `__('channelStrip .track-1').attr('gain')` |
| `deprecations.spec.ts` | Skipped unless `E2E_DEPRECATIONS=1`; lists unique Ember deprecations (report only) |
| `file-browser.spec.ts` | Folder breadcrumb navigation, source-tab sampler cards, node-tab selection sync, second-sampler targeting, long-id layout |
| `files.spec.ts` | A track with two filepath controls builds two samplers (`__('sampler').size()===2`), loads both, no extra controls |
| `macros.spec.ts` | Polysynth settings become controls and `update` the macro; script reads/offsets a macro control; Macros menu example; `declareControls` editing; project-level macros script and `defineMacro` ("siren") |
| `multislider.spec.ts` | 32-step multislider values persist across both pages and reload |
| `node-controls.spec.ts` | Compact param-row layout, horizontal scroll, "Reset all", settings menu contents, unit label display |
| `onsets.spec.ts` | Onset detection draws slice markers, threshold changes slice count and is saved, snap, loop colouring, `startSlice/endSlice` aliases, Slice unit, legacy slice controls migrate |
| `params.spec.ts` | Play script reads controls live and modulates one step without moving the slider (asserted by spying `AudioParam.setValueAtTime`); only editing the script resets a user-changed control |
| `qunit.spec.ts` | Skipped unless `E2E_QUNIT=1`; runs the legacy `/tests` QUnit suite |
| `sample-pool.spec.ts` | Pool shelf in the sound browser, load and preview, put a sample on a slot (then in use, not removable), rename/remove unused, two shelves |
| `scripts.spec.ts` | Script panel tab switch between setup and play |
| `sequences.spec.ts` | Multiple sequences all step and the script gets `sequenceIndex`; clock rate double and half; step values to maxValue with click/right-click; `this.setStep`; `this.sequences` dials and generators |
| `snapshots.spec.ts` | New project has an active "Main" snapshot; saving copies; tracks shared; active persists across reload; rename/delete; switch while playing on the next step keeps loop position and swaps script, sequence, tempo; switching does not rebuild audio; edits kept; control values restored and saved |
| `sound-browser.spec.ts` | Browser target card, audition, keyboard nav, Use and Undo, kit filling, search, "From sounds…" multi-select, drag-drop onto cards/rows/New Track, rack cards, clear with Undo, wrapping |
| `source-surfaces.spec.ts` | Oscillator piano sets frequency; sampler waveform start/end handles; playhead cursor; Loop Sync default for samples over 2 s; source button variants in track list |
| `track-types.spec.ts` | Every server track type: menu list, sampler low-pass wide open, multi-sample kit values, evolving rhythm rewrites dials, humanize/filter sweep/arp semantics (spying), sliced and chopped loops, ADSR isolation across tracks, looped sampler, kit duplication bus isolation, polysynth voices release, persistence after reload |
| `tracks.spec.ts` | New project builds and plays a sampler; deleting a playing track removes its audio (counts `__(selector).size()`); cleanup after renumbering |
| `ui-layout.spec.ts` | Footer, param row, sequencer and phone layout checks, colour, snapshot bar toggle |
| `ui-library.spec.ts` | `/styleguide` renders every atom, one yellow, base font |

Also: `client/tests/` holds legacy Ember QUnit unit/integration tests (helpers, sound-file, project serializer, by-key, cracked-autocomplete, encode-file-path, macro-examples, onsets, param-scale, sequence-patterns), which the e2e suite can run via `E2E_QUNIT=1`.

**What is tested about audio output:** nothing renders or listens to real samples. No test inspects an output signal or an analyser.
- Graph structure: counts nodes via `__(sel).size()` and checks sampler-to-gain connections by wrapping `AudioNode.prototype.connect` (`spyOnSamplerConnections`).
- Scheduled values: wraps `AudioParam.setValueAtTime` (`spyOnParams`), `linearRampToValueAtTime` (`spyOnRamps`), `OscillatorNode.start` (`spyOnOscillatorStarts`), and the `loopStart` setter (`spyOnLoopStarts`).
- `params.spec.ts` comments say reading `.value` back never moves in a headless context.
- One reads `__('channelStrip .track-1').attr('gain')` (cracked state, not signal).
- Playback timing is asserted only coarsely (counting steps or polling for node sizes, "keeps loop position" in snapshots).
- Helpers rely on Cracked internals and a page global `__`, so they will all need rewriting for a new library.

---

## 11. SURPRISING / FRAGILE

**Docs vs code mismatches**
- `playSample()`, `this.slider`, `uniqueSelector` helper, and a bare `controls` variable: NOT FOUND in code (only mentioned in `client/theory-of-operation.md`). `step` is also not injected (doc and `todo.md` say "alias `data` to `step`").
- `applyTrackControls` is not a function name; `applyControls` is (`track.ts:800`). `todo.md` ("consider applyTrackControls as a public function") is still open: scripts cannot control apply order.
- `todo.md` still lists `hasMany sequence` and snapshots as TODO; both are implemented.
- Doc says the Play script "is responsible for applying the value of your Track Controls". In code the app applies them before invoking the script (`track.ts:997`).
- Doc: "if the PLAY script is modifying an audio node's property it will override whatever state the slider is in". True only for that step, since controls are reapplied at the start of the next one.

**Cracked quirks and workarounds**
- Selection is global shared state. Presets comment: select right before every call, including inside `setTimeout` (`track_type.rb` POLYSYNTH).
- Samplers are rebuilt on each `start()`, so params must be re-sent after `.stop()` and before `.start()` (`track.ts:1037-1050`). `todo.md`: `__.stop().start()` "doesnt work correctly" for samplers.
- Sources make no sound until started: an oscillator preset calls `this.select('sine').start()` explicitly; polysynth must not call `.play()` in the loop (voice allocator trips). `todo.md`: polysynth cannot have multiple instances.
- `setTimeout` is not quantised to the loop; a todo says it "proves the callback is quantized" while the polysynth presets use it for note-off.
- A node that fails to create "causes the whole track to disappear" (`todo.md`). `onCreateNode` is async (`track.ts:481`) but cracked is not awaiting it.
- `cracked.channelStrip` is redefined by the app (`utils/cracked.ts:26`). `cracked.polysynth`/`monosynth` are monkey-patched at boot (`cracked-overrides.js`). `defineMacro` overwrites `window.cracked[name]` and restores on undefine.
- `utils/euclidean.js` monkey-patches `Array.prototype.rotate` globally.
- `todo.md`: "channelStrip gain gets reset on play" (bug); "clear mouse_move handler on init signal chain".

**UI vs audio drift risks**
- `ScriptModel.alert` stops the entire project for any script error (`script.ts:60`). The error also cancels the user's playing state without updating `isPlaying`: `stopLoop` on the project sets it false via `project.stopLoop()`, which is fine, but the unbind happens on the cracked side via `__.loop('stop')` only (not all `bind('step')` listeners). I did not trace this further.
- Every Play rebuilds the whole graph (`controller.play`). The plan doc measures 65-95 ms for 8 tracks / 76 nodes.
- Controls are created, matched and destroyed server-side as a side effect of script execution (`setupTrackControls`). Renaming or reordering nodes in a script changes the `(type, attr, order)` match key. Phase 2 heals this heuristically.
- Per-step `modulate()` writes go direct to the node, outside the Ember Data record. The UI shows the modulated value only via `modulatedUiValue`, which exists for identity units only.
- Three metadata sources (AudioNodeConfig, defaultParams, audio-param-config) and a parallel set of macro schemas. Controls only exist for node types listed in `AudioNodeConfig`.
- Sample decode happens twice (cracked sampler, `SamplePool`); sample-length-dependent controls rely on `fileLoadState` callbacks and `soundFile.duration`, with a "Loop Sync stays 1 until decoded" fallback (`track-control.ts` `transformCurrentUnit`).
- `files` has a hard cap of 16 (`track.ts:238`).
- Sequence rebind is deferred until step end (`queueSequenceChanges`), so script sequence edits take effect next step. `setStep` is clamped and wraps.
- `stepIndex` on track and project are both `@attr`/ember-data attributes but are runtime state (`project.stepIndex` is excluded from serialisation; track's `stepIndex`/`state` are not).
- `snapshot-runtime.swap` writes captured data back on every switch and issues several PATCHes.
- `Track.duplicate` and `deleteRecord` rely on `pushPayload` of renumbered sibling tracks.
- `track-node.ts` relationship `inverse: 'trackNode'` on `track` does not match `Track.trackNodes` naming.
- `project.setupAndSaveNewTrack` is marked `@deprecated`; `createSingleTrack` is the new path, and `createMultipleTracks`/`createMultipleTracksInBulk` coexist.
- Auth: `UserRoute._loadCurrentUser` invalidates the session on any load error.
- ESLint complexity rule in `euclidean.js` and Glint/TS present but much code is `.js` with `@ts-ignore`s.

**Replacement map for the planned refactor**
- (a) Cracked replacement touches: `utils/cracked.ts` (the single intended seam, though `track.ts`, `track-node.ts`, `track-control.ts`, `snapshot-runtime.ts`, `sample-pool.ts`, `macros/*`, `script-variables-list.js`, `signal-chain-creator.js`, `modifiers/nexus-ui.js` and `audio-param-config.js` also call Cracked directly), and all server-side seed/preset script text, the `this.*` scope, `onCreateNode`-based discovery, string-selector tagging, `bind('step')` clock, and both `audio-*-config.js` tables plus autocomplete data.
- (b) Single source of truth per parameter: currently split across the script literal (`userSettingsForControl` to `scriptValue`/`defaultValue`), `TrackControl.controlValue`, `modulation`, the cracked node's own state, and snapshot copies.
- (c) Two-way UI to script: only a one-way UI-to-script path exists (`signal-chain-creator.js`, which regenerates a whole init script; its `signalChainGeneratedCode` property is transient, and the code has a `REFACTOR` comment about saving node arrays instead).
- (d) Ember Data removal touches every adapter/serializer, route loaders, the `store.*` calls in `track.ts`, `project.ts`, `sample-pool.ts`, `snapshot-runtime.ts`, `track-types.ts`, plus server-owned behaviours listed in section 7 (default scripts, track types, project bootstrap, order renumbering, pool `usages`, sample auto-pool, permissions), and auth/session.

Not found / not verified: any client-side persistence (localStorage beyond the ESA session), any offline mode, a Cracked changelog or version string (the vendor file was not analysed per instructions), and whether `client/wasm` is used by the app.