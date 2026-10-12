# Snapshots and the project sample pool: refactor proposal

Status: decisions made (section 0); implementation in progress, phase by phase.
Audience: the project owner, and whoever implements the phases below.

## 0. Decisions (from the project owner)

1. **Edits always autosave on the current snapshot** (the "scenes" model, 7.2 option A). "Save snapshot" forks the active one.
2. **Tempo is per snapshot** (`snapshots.bpm`). The project-level `bpm` becomes a compatibility view of the active snapshot's.
3. **Sample pools are per project** and do not change across snapshots.
4. **Uploads come later**, after the file browser is refactored (the file-directory UI is rebuilt for the pool once snapshots are done).
5. **Switching happens on the next step**, always (not the next bar). Consequences: the swap itself must be tiny
   (bind listeners + start the fade, a few ms), so the target must be *staged before* the request: a switch to a
   snapshot that is not staged yet is queued and fires on the first step after staging finishes. Tempo changes at
   the swap (the loop interval is reconfigured), and the new snapshot continues at the current loop position
   (phase-aligned) rather than restarting.
6. The source/controls UI is being reworked by another session: the sample slot and pool UI here must not edit those
   components until that lands; server-side work and new files come first.

## 1. Goal

Let a user save **snapshots** of a project's state and switch between them quickly, even while the
project is playing, with no audible gap and no waiting on downloads or script execution.

Constraints that make this hard today:

- a new state can reference samples that are not downloaded or decoded yet;
- a new state means running arbitrary user scripts to rebuild the audio graph;
- the audio engine (cracked) is a single global graph with global selection state.

## 2. What exists today (verified in the code)

| Area | Today |
|---|---|
| Project state | `projects` row (title, bpm) plus tracks, each with scripts, sequences, controls, filepath controls. All state hangs off the project directly; there is no notion of "a state of the project". |
| Samples | A track's files live in `filepath_controls` (`node_order` = sampler slot, `control_value` = catalog path). The client-only `SoundFile` model downloads a path to a blob URL **per path, not per project**. |
| Decoding | cracked's `sampler`/`buffer` node fetches the blob URL by XHR and runs `decodeAudioData` **per sampler node**, again on every rebuild. There is no shared `AudioBuffer`. |
| Scripts | `this.files[slot]` is a per-track array of blob URLs (null until downloaded). Default scripts do `sampler({ path: this.files[0] })`. |
| UI | `SourceSelectButton` is rendered once per filepath control in the track row; "pick a sound" is a client-only, unsaved empty filepath control. The file picker writes straight into a track's filepath control. |
| Rebuilding audio | `project.initSignalChain()` = disconnect everything, run every track's init script, relink controls, start. **Measured: about 65-95 ms for 8 tracks / 76 nodes** (headless Chrome, end to end from clicking play). Too long to run synchronously between steps (the loop's lookahead is ~75 ms at 120 bpm / 8th notes). |
| Global names | Every track script connects to `#main-output`; node selectors per track are already unique (`.track-id-N`). cracked's selection (`_selectedNodes`) is global mutable state. |

## 3. Proposal in one paragraph

Introduce a project-wide **sample pool** (decode each sample once, share the `AudioBuffer`), make tracks
*reference* pool entries instead of owning files, and make a **snapshot** a complete, independent set of
tracks inside the project. Switching snapshots then means: all data and samples are already in memory
(prefetch), the target snapshot's audio graph is **built in the background into an isolated, silent
namespace**, and at the next bar boundary the loop listeners and a per-snapshot fader are swapped with a
short crossfade. No download, decode or script execution happens at switch time.

## 4. Sample pool

### 4.1 Data model

New table `project_samples` (one row per sample in a project's pool):

| column | notes |
|---|---|
| `project_id` | owner. The pool is project-wide and **does not change across snapshots**. |
| `path` | catalog path, as stored today (`/Roland/TR 808/kick.mp3`). Later: `asset_id` for user uploads. |
| `label` | short name scripts and UI can use (`kick`). Defaults to the file name; unique per project. |
| `position` | display order. |
| unique | `(project_id, path)` and `(project_id, label)`. |

Track assignment: keep the `filepath_controls` table but add `project_sample_id` (nullable at first), so a
track's slot `n` points at a pool entry. Backfill: for each filepath control, find-or-create the project's
`project_sample` for its path and set the reference. `control_value` stays for one release as a
denormalized copy so old clients and exports keep working, then is dropped.

Rules:

- a pool sample can be used by many tracks in many snapshots (cloning a snapshot copies *references*);
- removing a pool sample that is still referenced is refused, and the UI lists where it is used;
- the pool is shared by everyone who can edit the project.

### 4.2 Client runtime: one place that owns audio data

A plain-TypeScript `SamplePool` service (no Ember Data inside the loading/decoding code):

- `entry.state`: `idle | loading | decoding | ready | error`, plus `duration`, `buffer: AudioBuffer | null`;
- `load(entry)`: fetch once, `decodeAudioData` once, in-flight promise shared (this is the pattern that
  already fixed the `SoundFile` hang);
- `preload(entries)` for the union of samples referenced by **all snapshots**, started when the project opens
  (priority: active snapshot first);
- emits a "ready" event per entry so waiting nodes can bind late.

`SoundFile` and `filepath_control.fileDownloadError` are replaced by this; `AudioBuffer`s are shared, so a
sample used by 20 samplers costs one decode and one buffer.

### 4.3 cracked change (small)

cracked already supports data-sourced buffers (`loadBufferWithData(fn)`), so this works today
(`sampler({ fn: () => buffer })`) but is awkward. Add a first-class `buffer` parameter and **late binding**:

```js
__().sampler({ buffer: this.samples[0].buffer })   // AudioBuffer, or null: node is created silent
node.setBuffer(audioBuffer)                         // used when a pool entry becomes ready
```

The client subscribes each sampler node to its pool entry, so a sample that arrives after the node was built
starts sounding without a rebuild. `path` keeps working for scripts that still use it.

## 5. Scripts: redesigning `this.files`

`this.files` is per-track, positional, and exposes blob URLs, which is exactly the coupling to remove.

New script scope (all derived from the pool, nothing downloaded by scripts):

```js
this.samples            // this track's sample slots, in slot order: [{ id, label, path, buffer, duration, ready }, ...]
this.sample('kick')     // any pool sample by label (not tied to this track's slots)
this.pool               // read-only list of the project's pool
```

Compatibility: `this.files[i]` and `this.filepath` stay as deprecated shims (blob URL of the slot's pool
sample, as today) so existing scripts and presets keep working. The default scripts and the track types
switch to `buffer: this.samples[i].buffer`. `script-scope-docs.js` (the autocomplete docs) gets the new keys.
Because a not-ready sample gives `buffer: null` and binds late, scripts need no async handling.

## 6. UI

1. **Sample pool panel** (project-level drawer, next to the track list): list with name (editable label),
   waveform thumbnail (the `audio-waveform` modifier exists), load state, duration, and "used by": tracks and
   snapshots. Actions: add from the catalog (the existing drum-file sidebar becomes "Add to pool"), remove
   (guarded), preview (play the buffer), later upload. Drag a pool item onto a track slot to assign it.
2. **`SampleSlot` replaces `SourceSelectButton`**: `<SampleSlot @track @slot>` shows the pool sample assigned
   to that slot (name, state) and opens a pool picker popover (pool items first, "browse catalog..." second,
   which adds to the pool and assigns). The slots shown come from the track's **sampler nodes** (n samplers
   means n slots), not from stored filepath controls. This removes the client-only empty "ghost" filepath
   controls and the "No Source Node" / "Sampler failed" edge cases that came with them.
3. **Snapshot strip** (phase 4): a row of snapshot slots at the top of the project view with names, a state
   indicator per slot (ready / staging 40% / queued for next bar), save/fork, rename, delete, reorder, and
   keyboard shortcuts.

## 7. Snapshot data model

### 7.1 Recommendation: snapshots are rows, tracks belong to a snapshot

- `snapshots(id, project_id, name, position, bpm nullable, created_at)`;
- `tracks.snapshot_id`; `projects.active_snapshot_id`;
- migration: every existing project gets one snapshot "Main" containing its current tracks;
- **Save snapshot** = deep clone of the active snapshot (tracks, scripts, sequences, controls, track samples;
  the project already uses `amoeba` to duplicate tracks) pointing at the **same pool entries**;
- **Switch** = change `active_snapshot_id` (a pointer write, done in the background) plus the audio swap.

Why not store each snapshot as a JSON document: switching would then require hydrating records and diffing
against the live tables, which is the latency we are trying to avoid. With rows, every snapshot's records
are normal Ember Data records already in memory.

Loading: the project payload lists all snapshots; the active snapshot's tracks load first, the other
snapshots' records are fetched in the background right after first paint (a project is roughly 10 tracks x
15 controls = 150 records per snapshot).

### 7.2 Decision needed: editing semantics

- **A. Scenes (recommended to start):** edits always apply to the active snapshot and autosave (as today);
  "Save snapshot" forks the current one. Simple, no copy on switch, matches current behaviour.
- **B. Working copy + immutable snapshots:** edits go to a working copy; "Save" writes a snapshot; switching
  with unsaved changes needs a "modified" indicator and a revert. More work, supports "restore exactly what I
  saved". Can be layered on A later with a `parent_snapshot_id` and a "revert to saved" action.

Tempo: global by default; `snapshots.bpm` optional (null = inherit the project's).

## 8. Runtime: switching without latency

### 8.1 Why staging is required

A full rebuild is ~65-95 ms of main-thread work. Doing it at a step boundary would delay the loop's timer
callbacks past the scheduling lookahead and glitch. So the target snapshot is built **before** the switch:

1. **Prefetch** (data + samples): done at project open, so a switch never waits on network or decoding.
2. **Stage**: when a snapshot becomes a likely target (user hovers it, queues it, or it is the "next"
   one), build its graph in the background, **chunked one track per idle slice (aim <= ~10 ms each)** so the
   loop never starves. The staged graph feeds a per-snapshot **fader** at gain 0 and is **not bound to the
   loop**, so it is silent and costs almost nothing while waiting.
3. **Swap** at the next bar boundary (immediately if stopped): bind the staged tracks' step listeners with
   the phase-aligned `loopIndex`, crossfade the faders (equal power, 10-50 ms), unbind the old snapshot's
   listeners. The old graph is disposed after its voices release; optionally an LRU of 2-3 recently used
   snapshots stays warm so switching back is instant.

### 8.2 What must be namespaced (the hard part)

| Global today | Needed |
|---|---|
| `#main-output` (every track script connects to it; the master script defines it) | Per-snapshot id (`main-output-<snapshotId>`). Expose `this.output` and migrate the default scripts; for existing scripts, rewrite the literal `'#main-output'` at function-build time. |
| Master chain ends in `.dac()` | Insert a per-snapshot **fader** gain between the master and the destination. Needs a small cracked helper (a `bus` option on `dac`) so it is not done by rewiring after the fact. |
| `__.reset()` / `disconnectAll()` | Scoped teardown: tag every node of a snapshot with `.snapshot-<id>` and remove by that selector. |
| cracked global selection | Already the cause of the polysynth `noteOff` bug; scripts must keep re-selecting. Staged builds must not interleave with the active snapshot's step scripts: build in whole-script units, never yielding mid-script. |
| Nodes created later by scripts (polysynth voices) | They carry no track tag today. A "build context" tag inherited by dynamically created nodes is needed so disposal catches them (also fixes a zombie-audio risk that exists now). |
| Track selectors | Already unique per track id, and tracks are distinct records per snapshot, so no change. |

Arbitrary scripts can still have side effects outside the graph (timers, `window` state). They cannot be
isolated; staged builds run inside per-track try/catch, and a snapshot whose staging failed shows an error
state instead of being swapped in.

### 8.3 Engine boundary

Phase 3 is the natural moment to extract the plain-TypeScript audio engine recommended in the first review:
a `SnapshotRuntime` class (build, bind, fade, dispose; no Ember Data imports) driven by thin adapters from
the models. It makes the staging logic unit-testable and keeps Ember Data out of the audio clock path.

## 9. Phases

Each phase is shippable and gets browser tests.

| Phase | Scope | Notes |
|---|---|---|
| 0. Spikes (~3 days) | (a) cracked `buffer` param + late binding; (b) prototype two snapshot graphs with namespaced output + fader + crossfade on 8 tracks; (c) measure step-timing jitter with chunked staging. | Go/no-go for staging. Fallback if (b)/(c) fail: quantized rebuild at a bar boundary, still with prefetch. |
| 1. Sample pool | `project_samples` + backfill; `SamplePool` service (decode once); `this.samples`/`this.sample`, `this.files` shim; pool panel; `SampleSlot`; file picker -> "add to pool". | Server tables and API can start now. Client changes to `track.ts`/controls must wait for the in-flight params refactor. |
| 2. Snapshot data | `snapshots`, `tracks.snapshot_id`, active pointer, clone endpoint, default "Main" migration; all queries scoped to the active snapshot. No switching UI yet. | |
| 3. Runtime | `SnapshotRuntime`: namespacing, fader, scoped teardown, staging, bar-quantized swap. | Depends on the params/order-of-operations refactor; needs its `applyControls` entry point. |
| 4. Snapshot UI | Snapshot strip, save/fork, rename, delete, reorder, staging indicators, shortcuts. | |
| 5. Polish | Pool usage tracking, uploads (needs object storage), bpm per snapshot, immutable snapshots + revert. | |

## 10. Testing

- **Server:** clone endpoint copies the whole graph and shares pool references; migrations/backfill
  (including duplicate paths and null `node_order`); delete guards.
- **Browser:** each sample fetched and decoded exactly once across snapshots; switching while playing keeps a
  continuous output level (analyser RMS) and uninterrupted step timestamps; disposed snapshots leave no
  nodes behind (extends the existing delete/audio-cleanup tests); late-binding sample starts sounding.
- **Timing budget:** a test that fails if any single staging slice exceeds the budget.

## 11. Coordination with the in-flight refactor

Another session is changing track controls, audio parameters and the order in which parameters are applied
in scripts. This plan touches the same code in phases 1 (track/slot code) and 3 (build/apply). Proposed
contract: phase 3 treats "apply this track's controls to its freshly built nodes" as a black-box function
owned by that refactor; phases 1-2 are written to not edit `setupTrackControls`/`applyAttrs`.

## 12. Open questions

1. Editing semantics: scenes (A) or working copy + immutable snapshots (B)?
2. Is tempo per snapshot wanted from the start, or global only?
3. Pool scope: per project (proposed). Should samples be shareable across a user's projects?
4. Uploads: needed in phase 1 (requires object storage; Cloudflare R2 is the candidate) or later?
5. How many snapshots are expected per project, and how many tracks? That sets the warm-cache size.
6. Is switching only quantized to the bar, or also on any step / immediately?
