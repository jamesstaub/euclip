# Euclip v2: how code and UI work together

Status: model agreed with the project owner on 2026-11-13. Nothing is built yet.
Audience: the project owner, and whoever implements Euclip v2.
This is the design doc that section 6 of [cracked-up-and-euclip-v2.md](cracked-up-and-euclip-v2.md) promised. Where the two differ, this one is authoritative.

## 1. The model in one paragraph

**Structure lives in code; values live in the project document.** A script creates nodes, chains and sequences. Running it tells Euclip what exists, and Euclip draws a control for every parameter and a step grid for every sequence. Moving a control or editing a grid changes the document and the live sound, and never rewrites the code. The default project is ordinary generated code, so everything it does can be read and changed.

Arbitrary two-way editing between code and UI was considered and rejected: a loop or a computed value has no UI edit that maps back to text. The earlier plan (chains stored as data, with the script as a generated text view) is dropped for the same reason.

## 2. Requirements

| # | Requirement |
|---|---|
| R1 | **The script is the only definition of structure.** Nodes, chains, sequences and their callbacks exist because code created them. Sequencer construction is in the script, not hidden as it was in v1 |
| R2 | **Values are data.** Control values, step patterns, per-step lanes, slider modes and MIDI bindings are stored in the document, keyed by scope, node id and parameter name |
| R3 | **The UI is declared.** A control exists where the script declares one (section 3); grids come from named sequences. Declarations are plain data, so the same script works sandboxed and cannot inject markup |
| R4 | **UI edits never rewrite code**, with the two exceptions in R7 and section 5 |
| R5 | **Re-running never loses state.** A code edit rebuilds that script only: untouched nodes keep sounding, sequences keep phase, document values are reapplied, and a failed run leaves the previous version playing. This is cracked-up's `build` |
| R6 | **Identity is stable** (section 5) |
| R7 | **Non-coders never need the editor.** Structural actions (add a track, add an effect, add a sequence) are code edits Euclip makes from templates. Where a script is in a shape Euclip cannot locate the edit in, the action is disabled and says why |
| R8 | **Precedence is fixed and visible:** document value, then per-step lane, then what a sequence callback does for that event, then audio-rate modulators. A control shows its base value and its effective value |

## 3. Controls are declared in the code

Decided 2026-11-13. It replaces two earlier designs: "last touched wins" between a number in the code and an automatically made slider, and control markers written inside a node's options (which needed the library to treat those parameters specially). Where sections below still speak of overrides, this section wins.

A control exists only because the script declares one, on its own line, bound to a node by selector. Nodes are built as they always are.

```js
__()
  .sampler({ id: 'kick', buffer: 'kick' })
  .lowpass({ id: 'filter', frequency: 2000, q: 6 })
  .gain({ id: 'level', gain: 0.8 })
  .to('channel');

slider('#filter', 'frequency');
knob('#level', 'gain', { label: 'Level' });
```

- **`slider`, `knob` and `toggle`** are functions Euclip puts in scope: a selector, a parameter name, and optional plain-data options (label, slider mode, range overrides). More kinds may follow. cracked-up knows nothing about them.
- **Moving a control** calls `set` on the selected nodes and stores the value in the document. The script does not re-run and no node is rebuilt.
- **When the script re-runs,** the declaration line does the same `set` with the stored value, so the value passes through the script as an ordinary `set` and the rebuild ends on it by the library's normal rules.
- **The number in the node is the default:** it applies when nothing is stored, and it is what "reset" returns to. A parameter with no control is fixed by the code.
- **Range, unit and curve** come from the parameter metadata of the node the selector finds.
- **Identity** is the selector plus the parameter name. A selector may match several nodes (`slider('.voice', 'detune')`), which gives one control for all of them. A selector that matches nothing is shown as a warning on that line.
- **`controls()`** with no arguments is the one "create all the UI" call: a control for every parameter of every node the script has made so far (a section per node), a waveform editor for every sampler, and a step grid for every named sequence of the script (grids are added when the script has run to its end, so the sequence may come after the call). An explicit `slider`, `stepGrid` or `waveform` for the same thing, before or after, is used instead, with no duplicate. **`controls('#kick')`** is narrower: the parameters of those nodes and nothing else; `controls('#kick', ['speed', 'start'])` for those named.
- **A control with no node:** `const density = slider('density', { min: 0, max: 1 })`, read as `density.value`.
- **Changing a value from code** can be done two ways:
  - `__('#filter').set({ frequency: 900 })` moves the parameter and not the control. The control shows that the parameter is away from its value (R8).
  - A declaration returns the control: `const cutoff = slider('#filter', 'frequency'); cutoff.set(900)` moves the control and the parameter together, as if the user had moved it. Inside a sequence callback the change lands on the step, like any other `set`, and the control is redrawn at that moment. Changes made this way are stored but are not undo steps.
- **In the sandbox** nothing differs: the `set` is an ordinary command and the declaration is plain data sent to the host.
- **In the UI,** a node lists its declared controls. "Add control" lists the node's other parameters and writes the declaration line into the code; "remove control" deletes the line. These are code edits of the same kind as R7.
- **A sampler's speed can be synced to a sequence:** the unit `sequence-sync` ("Sequence sync" in the control's menu, with one item per named sequence of the track's own script when there are several). In it the control holds a multiplier, not a speed: 1/4, 1/3, 1/2, 1, 3/2, 2, 3 or 4 passes of the whole sound per pass of the sequence (shown as `1/2× seq`), and the speed is `multiplier × sound length ÷ sequence length`, worked out by the runner from the library's own timing of the sequence's options and applied again on every build and whenever the tempo, the sequence, the sound or the unit changes, with no document write and no undo step. The choice is stored with the control's other unit choice (`options: { mode: 'sequence-sync', sequence: 'slices' }`); in a script, `slider('#sampler', 'speed', { mode: 'sequence-sync', sequence: 'slices' })`, and without `sequence` the script's first named sequence. With no such sequence, or no sound yet, the speed is 1 and the control says it has nothing to sync to; the stored choice is kept and recovers. Changing unit into or out of it keeps the speed as near as the multipliers allow (one undo step). Nothing switches to it implicitly; the sliced-loop template declares it.
- **A sampler's region and loop points change roles when crossed:** start taken past end (or end past start; likewise the loop's two points) does not stop: it becomes the other end, so start is always the lower and end the higher, both written in the gesture's one undo step, never nearer than 1 ms. The same by dragging a handle, dragging or stepping a value box, the keys on a handle, and typing.
- **Smoothing and glide are two things.** *Smoothing*: every move of a control on a continuous audio parameter (a channel strip's level and pan, a bus level, a declared slider or knob) is sent to the library as `set(value, { glide: 0.02 })`, 20 ms from wherever the parameter has got to, so a moving fader has no steps in it. It is always on, never shown and not configurable. What should jump is set at once: toggles, selects, stepped units (stepped, notes, semitones, slices, a synced speed), a sampler's places in its sound, values applied by a build, a synced speed retuned by a tempo change. The library decides per parameter what can be swept (audio-rate numbers); the app keeps no list. Undo and redo of a strip's level or pan are smoothed too; a declared control's undo is a rebuild and lands at once. *Glide*: a time the person chooses, a secondary attribute of each slider and knob on a parameter that can glide: `slider('#filter', 'frequency', { glide: 0.3 })` (seconds; the script's number is the default), or a "Glide" entry in the control's menu that opens a time box (0 to 5 s on a cubic travel, ms below a second), stored with the control's unit choice (`options.glide`), one undo step per change, with its own "Reset glide". When it is above 0 it takes the place of the smoothing for that control, wherever the control moves its parameter (drag, keys, typed value, value box, and a script's `control.set`, which then starts on its step and sweeps). The option also takes a control of the script's own, read at every move (`const glide = slider('glide', { min: 0, max: 2 }); slider('#filter', 'frequency', { glide })`); the menu then says which control it follows. On something that cannot glide the option is a warning on its line and the menu has no entry. The control on screen is where it was put at once; nothing animates along the glide. A row whose control glides says so with a small mark. The channel strip has smoothing only.
- **Step grids are declared too:** `stepGrid('steps')`, placed after the `__.transport.sequence('steps', …)` call it belongs to, gives that sequence a grid. **The grid can be the only source of a pattern:** a sequence made with a count, `{ steps: 16 }`, and given a grid (by `stepGrid` or `controls()`) has no pattern in its script; the grid owns it, starts empty (all rests are applied during the build; nothing is written to the document until a step is set), and a changed count keeps the stored steps as far as they go and adds rests. The rule is exact, read from the library's `sequence.options.steps` being a number. A sequence made with an array or pattern string is as before: those steps are the default (an explicit all-ones array shows every step on) and a pattern edited in the grid is stored in the document and applied by the `stepGrid` line when the script runs. A count with no grid is untouched and fires every step. The templates and the default project use the count form, with their starting patterns in each track's stored values. A sequence with no `stepGrid` line (and no `controls()`) has no grid. (The function was first called `sequencer`; it was renamed because that read too much like `transport.sequence`. Stored scripts are migrated on load and the old name is not an alias.)
- **`waveform('#sampler')`** declares a waveform editor for a sampler, shown in the footer's source pane: a view over the sampler's ordinary controls (start, end, loop points, loop, reverse, speed) and the sound it plays. A script with several `waveform` lines gets one editor at a time, chosen from a list of them.

## 4. Scripts and where things live

One script per track, plus one project script. There is no init/onstep split: a track's script holds its chain, its sequences and their callbacks, and any modulation, in that conventional order. A track script is one cracked-up scope, which is the unit of rebuilding, error isolation and sandboxing.

Whether something belongs in a script is decided by one question: would someone change it to make different music?

| Lives in | What | How the user sees it |
|---|---|---|
| Track script | The track's chain, sequences, callbacks, modulation | Its editor |
| Project script | Buses, the master chain, shared macros, project-wide sequences or modulation | Its editor. The default is a few lines |
| Document settings | Tempo, the sample pool, MIDI bindings, snapshots, control values and modes | Panels: the sidebar pool, the footer transport, a MIDI panel. Scripts refer to them by name (`buffer: 'kick'`) |
| Provided by Euclip to every script | The names in scope (`__`, `track`, `midi`, helpers), each track's scope and output wiring, running and rebuilding | Read-only: hover docs and Cmd-click open the real source in the editor's source panel; the inspector shows the resulting graph |

The last row is the only "magic". The rule for it: host plumbing only, and readable in full. A script cannot replace it, but can do anything inside it, including ignoring the default output.

Navigation between the pieces: a control or grid can jump to the line that created it, and a read-only view can show every script of the project in order.

### Code runs as it is typed

There is no Run button and no draft. A change to a script is submitted automatically after a short pause in typing, as in the cracked-up demo.

- The text in the editor is the script in the document. There is one copy, and undo is how a change is taken back.
- If the new text has a syntax error, or throws while building, the previous version keeps running and the error is shown beside the script until it is cleared. The version still running is held in memory only.
- A project opened with a script that has an error therefore has nothing to run for that track: the track is silent and marked until the script is fixed.
- An error thrown later, inside a sequence callback, disables that callback and is shown the same way; the rest of the track and project carry on.
- Text that is valid part-way through typing does run (a number half typed, for example). The pause before submitting is the guard against that.
- A script that never returns (an endless loop) would freeze the page when run directly. The run needs a guard for this; in the sandbox the runner can simply be stopped and restarted.

The editors are `cracked-up/editor` instances sharing one catalog. Direct execution is used for a user's own project and the sandbox (`cracked-up/remote`) in collaboration mode; the script text is the same in both.

## 5. Identity

A control's configuration follows the node's identity, not its place in the chain.

- **A node with an id** keeps its configuration wherever it moves. Generated code always includes ids.
- **A node without an id** is identified by type and creation order ("the first lowpass in this track"), which is how cracked-up matches un-id'd nodes on a rebuild. Inserting a different node type does not disturb it. Adding or removing an earlier node of the same type does.
- **Automatic ids.** The first time the user configures a control on a node with no id (sets a slider mode, learns MIDI, or moves the control), Euclip adds an id to the code: `.lowpass()` becomes `.lowpass({ id: 'lowpass' })`. This is a visible code edit of the same kind as R7.
- If the script is in a shape Euclip cannot edit, the control works by position and is marked as such.
- Configuration whose node disappears from the code is kept dormant, so undoing the code edit restores it.

## 6. Slider modes

A mode maps slider position to parameter value. The user chooses it by right-clicking the control.

- Modes to start with: linear, exponential, MIDI note (the slider moves in note numbers, converted to Hz), decibels for gains, and stepped (whole numbers or a list of values).
- The stored value stays in the parameter's own unit, so switching mode changes how the slider travels and what it displays, not the sound.
- The default mode comes from the node's metadata. A script may suggest one (R3); the user's choice overrides it and can be reset.
- Per-step lanes use the same mapping as their control.

## 7. MIDI learn

Right-click a control, choose Learn, move a knob. The document stores a binding from that channel and controller to the parameter.

- The knob goes through the control's slider mode.
- A knob move is a slider move: it sets the document value under the rule in section 3.
- The parameter jumps to the knob's position; there is no soft takeover.
- Bindings are listed in the MIDI panel, where they can be changed or removed.
- The project stores channel and controller. The port is chosen per machine, so a shared project works with each person's own controller.
- A script can also bind MIDI itself with `midi.bind`. Those appear in the same panel, marked as made by the script and read-only.

## 8. What this needs from cracked-up

Already there: `build` reconciliation, parameter metadata, named sequences with `update`, `midi.learn` and `midi.bind`, `midi.session`, the editor and its catalog, the inspector, the sandbox.

Likely additions, to confirm when implementation starts:

- A shared set of named curves, so a slider, a lane and a MIDI binding use one mapping.
- Nothing for controls (section 3): they are Euclip functions that call `set`. One behaviour is relied on and pinned by a test in the library: a re-run that ends in a `set` to the value a parameter already has causes no jump.
- Where a node or sequence was created in the script (line and column), for "jump to the line" and for the code edits in R7 and section 5.

## 9. The v2 app

Decided by the project owner on 2026-11-13:

- **Same monorepo** (Rails and Ember), unless a strong reason appears.
- **A new node module of its own in the monorepo**, beside `client/`, with its own `package.json`, dependencies and build. It shares no code or build with the current app, which keeps running unchanged for comparison.
- **Ember stays.** Svelte 5 was considered and judged a slightly better technical fit, but not by enough to outweigh familiarity. The document store is plain classes with reactive fields and would look much the same in either.
- **Built from scratch on current Ember practice:** TypeScript throughout, Glimmer components in template-tag files, Vite. No Ember Data.
- **Same look and feel.** The sidebar for browsing and choosing audio files, the track list and the footer are carried over, rebuilt on CSS grid.

- **The module is `client-v2/`.**
- **No backend at first.** Projects are saved in the browser (IndexedDB). Rails is wired in later under a `/v2` API namespace.
- **cracked-up is a local link** (`../../cracked-up`) while both change quickly, and becomes a pinned release once the app's needs from the library settle.
- **No NexusUI.** v2 builds its own controls (slider, multislider, step grid, toggle, dial if needed) as Glimmer components on pointer events, so they can carry slider modes (section 6), show base and effective values (R8), open the control menu, and work by touch. Icons and the logo are copied from the old app as needed.
- **Every UI decision must work on phones and tablets as well as desktop.** In practice:
  - Layouts are designed at phone, tablet and desktop widths from the start, not adapted afterwards.
  - Nothing is reachable only by hover or right-click. A right-click menu (slider modes, MIDI learn) is also opened by a long press or a visible button.
  - Touch targets are at least 44 px, and controls work with pointer events, not mouse events.
  - The code editors must be usable with an on-screen keyboard, and the app must be fully usable without opening one (R7).

- **Layout follows v1:** transport in the project bar at the top; the footer is the selected track's detail, and becomes a bottom sheet on small screens.
- **Poppins is shipped with the app** (self-hosted).
- **Hints are behind a "?".** Nothing in the app explains itself by default. An interface that has something to say about how it works (the waveform editor, the controls, step grid and source panes, the channel strip, the sound browser) has a small "?" button that opens a popover with the hints; it opens on a click or a tap (never on hover alone), and closes on a second one, on Escape, or on a press elsewhere. It is one shared component (`ui/hint`), built in the app, and every interface uses it rather than writing help into its layout. What is going on now is not a hint and stays where it applies: errors and warnings, a count or a value, a label, a control being out of step with its parameter, "this script declares no controls".
- **Deferred, by decision:**
  - Drag handles to resize most containers (wanted eventually; the grid areas should be sized by custom properties so handles can be added).
  - A limited UI for very small screens (around 320 px), to be planned separately. Until then, layouts are simply as responsive as they can be.
  - Scopes, visualisations and metering, which will be rethought rather than ported from v1.

### Where a script is shown

Decided 2026-11-13, replacing an earlier three-view design (UI / Code / Split, with scripts inline in the track list), which let the same script appear in two places.

- A script is shown in one place only: the footer, for the selected track.
- The bar above the footer has a script button. When it is on, the script editor replaces the whole footer UI (channel strip, menu and panes); when off, the footer shows the UI. The choice belongs to the person and the device, not the project.
- Track rows carry no script and no script button. There is no project-wide view switch.
- The Main Output row houses the project script: selecting it shows the project script in the footer the same way.
- Not available for now: a track's UI and script side by side, and every script at once. A right sidebar for the script is the likely way to bring side by side back if it is missed.
- On short windows the footer is not shrunk; collapsing it is enough until drag handles exist.
- All corners are square, app-wide. An off step is a grey chosen to contrast with the cyan of an on step.

Open, to settle before UI work starts:
- The control and track layout on the grid.
- The document schema that holds everything in R2 (initiative 3 in the main plan).
