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
| R2 | **Values are data.** Parameter values, step patterns, per-step lanes, slider modes and MIDI bindings are stored in the document, keyed by scope, node id and parameter name |
| R3 | **The UI is derived.** Controls come from cracked-up's parameter metadata; grids come from named sequences. A script can curate its UI (label, order, hide, suggested slider mode) only as plain data, so the same script works sandboxed and cannot inject markup |
| R4 | **UI edits never rewrite code**, with the two exceptions in R7 and section 5 |
| R5 | **Re-running never loses state.** A code edit rebuilds that script only: untouched nodes keep sounding, sequences keep phase, document values are reapplied, and a failed run leaves the previous version playing. This is cracked-up's `build` |
| R6 | **Identity is stable** (section 5) |
| R7 | **Non-coders never need the editor.** Structural actions (add a track, add an effect, add a sequence) are code edits Euclip makes from templates. Where a script is in a shape Euclip cannot locate the edit in, the action is disabled and says why |
| R8 | **Precedence is fixed and visible:** document value, then per-step lane, then what a sequence callback does for that event, then audio-rate modulators. A control shows its base value and its effective value |

## 3. Values written in the code

A value in the code is the default for that parameter. The document stores an override only once the user moves the control. Whichever was touched last wins:

| The user does | Result |
|---|---|
| Changes the value in the code | The override for that parameter is dropped; the control jumps to the new value |
| Moves the control (or a bound MIDI knob) | An override is stored; the code is untouched |
| Re-runs with the value unchanged | The override stays |

- The change is detected by comparing the value the script produced on this run with the previous run, not by reading the text, so it holds for computed values (`frequency: base * 2`).
- A control that differs from its code default is marked and has "reset to code".
- Snapshots keep their own overrides. A change in the code clears the override in the current state only.
- A `set` inside a sequence callback is the script playing the parameter: it wins for that event and the control shows it move. A callback that should ride on top of the slider uses an offset, not an absolute value.
- There is no "write this value into the code" action.

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
- A way for the host to hold a base value under what scripts set, so R8's order is enforced by the library, not re-sent by the app.
- Where a node or sequence was created in the script (line and column), for "jump to the line" and for the code edits in R7 and section 5.
- A plain-data way for a script to describe its UI (R3).

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
