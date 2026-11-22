# Euclip v2 relaunch plan

Written 2026-11-22. Companion to `euclip-v2-code-and-ui.md` (how the app works) and `cracked-up-and-euclip-v2.md` (the library). This document reviews where v2 stands, names what must be fixed before a public launch, and orders the work after it.

The comparison with other tools in section 3 is from general knowledge and was not re-checked against their current releases.

## 1. Where v2 stands

`client-v2` is a client-only Ember app of about 26,000 lines with 481 passing tests. It has declared controls, step grids with generators, per-step lanes, a waveform editor with slicing, a synth editor, a signal chain that edits the script, a sound browser on the v1 library, a phone layout, and one project kept in the browser.

The model is sound and distinctive: structure in code, values in the project, controls declared by the script, and every UI edit of structure written back as code. Nothing in this plan changes that.

## 2. Critical issues

### Must fix before anyone outside uses it

| Issue | Why it is critical | Fix |
|---|---|---|
| **Never heard, never on a real device** | Every audio check so far was an offline render or a meter reading in headless Chromium. Safari, Firefox, iOS audio unlock and real touch are untested. | A manual test pass by ear on Chrome, Safari, Firefox, an iPhone, an Android phone and an iPad, with a written checklist. |
| **One project, in one browser, with no way out** | There is no export, no import and no second project. Clearing site data loses everything. | Project file export and import, several local projects, and a visible "saved" state, before any cloud work. |
| **A script can freeze the tab** | Code runs as it is typed. `while (true)` hangs the page, and the endless-loop guard was never built. | A loop guard in script execution (instrumented loops or a time budget), with recovery to the last good version. |
| **No output protection** | A feedback delay or a widened range can produce very loud output. | A safety limiter on the main output that cannot be removed by a script, and a visible clip indicator. |
| **Sample rights** | The library is drum-machine recordings served from the v1 bucket. A public relaunch with sharing needs a clear licence for each pack. | Audit the packs; keep only what can be redistributed; record the licence per pack and show it. |
| **cracked-up is a file link** | `"cracked-up": "file:../../cracked-up"` cannot be deployed or contributed to. Both repos have unpushed work (46 commits in the library). | Push both. Publish cracked-up to npm under a version, pin it, and keep the stored `crackedUpVersion` meaningful. |

### Structural

- **Three files carry too much.** `app/audio/runner.ts` is 3,156 lines, `waveform/editor.gts` 2,431 and `signal-chain-pane.gts` 2,036. The runner holds building, stored values, per-step listeners, sync, lanes, sources and silence. Split it by concern before adding MIDI, snapshots and recording, all of which would land there.
- **Browser tests live outside the repo.** The Playwright drivers that proved most features were written in a scratch folder and are gone. Only the layout sweep is kept. Put an end-to-end suite in the repo and in CI.
- **Scripts run in the page.** That is right for your own code. It is not acceptable for anyone else's. Opening a shared project must never run its script with access to the page, the session or the API. The library's sandbox exists; the app does not use it yet. This gates every sharing feature (section 6).
- **Stored values grow without bound.** Values are kept for nodes that no longer exist so undo can restore them. Add pruning on save, and a size budget for the document.
- **The design doc is long and layered.** It records decisions in the order they were made, including reversed ones. Rewrite it as a current description plus a short decision log.

### Usability

- **Concept load.** A newcomer meets units, glide, per step, lanes, generators, source versus processors, seq versus signal, and four kinds of menu. There is no first-run path. Hints are all behind "?".
- **No undo or redo buttons**, and none at all on a phone.
- **Errors are for coders.** A non-coder who breaks a script through the UI sees a "!" on the Script button and nothing they can act on.
- **Icons carry too much.** The chain toolbar has ten similar icons with labels only on hover.
- **No arrangement.** Everything is one loop. There is no way to chain patterns, mute scenes or build a song.
- **Accessibility has had no pass** beyond names on controls.

### Scale

- Performance was measured with four tracks. Set a budget (for example 16 tracks, 4 lanes each, signal view, on a mid-range phone) and test against it.
- Most rows re-render on every project revision. This was the cause of the menu bug; it will show up again as tracks grow.

## 3. Where it sits among peers

| Tool | What it is best at | Where Euclip differs |
|---|---|---|
| **TidalCycles / Strudel** | Pattern language of great depth; Strudel runs in the browser, shares by link and has a large community. | Euclip is graph-and-control first, not pattern-first. Its step grid is far simpler than Tidal's patterns, and its UI is far richer. |
| **ChucK / WebChucK** | Sample-accurate timing as a language feature; teaching and research. | Euclip hides timing behind sequences and has no comparable language depth. |
| **Sonic Pi** | Teaching, live performance, very gentle start. | Euclip has no curriculum or tutorial yet. |
| **Gibber, Glicol** | Browser live coding with audio graphs; Gibber annotates code with live values. | Closest in spirit. Euclip goes further in turning code into a full control surface. |
| **Estuary, Flok** | Shared live coding in a browser. | Euclip has no collaboration yet. |
| **Audiotool, BandLab, Soundtrap** | Browser DAWs with accounts, publishing and listening. | They have community and no code. Euclip has code and no community. |
| **Bespoke Synth, VCV Rack, Max** | Patching with scripting. | Desktop, patch-first. |

The open position is the one the goal names: **a tool a non-coder can play like a drum machine and a coder can open up completely, with the same project.** Strudel proves the appetite for share-by-link and remix. Audiotool proves listeners will come to a browser music site. Nobody has joined the two with a UI that non-coders can use.

What the leaders have that Euclip lacks: share by link, a gallery of examples, a tutorial, a pattern language, and a community place to talk.

## 4. Order of work

### Phase 0. Make it safe to show (before launch)

1. Push both repos; publish and pin cracked-up.
2. The manual test pass by ear, and fixes from it.
3. Loop guard, output limiter, clip indicator.
4. Local projects: several projects, export and import as a file, autosave state shown.
5. Undo and redo buttons, including on the phone.
6. Split the runner; end-to-end tests in the repo and in CI.
7. Sample licence audit.
8. First-run experience: three or four starter projects, a short guided tour, an in-app reference for the script functions.
9. A converter for v1 projects, or a clear statement that v1 stays available at its own address.

### Phase 1. Public launch of the client-only app at euclip.app

- The root address opens the app on a starter project. v1 moves to its own path or subdomain and keeps working.
- New top bar with a menu (section 5).
- Audio export of the loop as a WAV, done for real with the library's offline render.
- Record button and a recordings list (section 5).
- More New Track presets, built as the same template format that sharing will use later.
- False-door prompts for the features that need accounts (section 7), with a mailing list behind them.
- Privacy-respecting usage counts and error reports, so the false doors and the crash rate can be read.

### Phase 2. Accounts and saving

- Sign-in, cloud save, My projects, private and unlisted projects.
- Uploads move from the browser to the account.
- Read-only share links that play in the sandbox, with "Remix" making a copy.

### Phase 3. Community

- A listen page: published projects that play without opening the editor.
- Shared track templates, macros and sound packs, each with an author and a licence.
- Profiles, likes, follows, remix lineage, reporting and moderation.
- An embeddable player.

### Phase 4. Collaboration and premium

- Realtime editing of one project by several people.
- Premium launches once Phase 2 shows what people use.

## 5. Features to design

**Top bar and menu.** Left: logo and the project name, editable in place (it lost its home when the title left the project bar). Right: a menu button. The menu holds project matters (new, open, duplicate, export file, export audio, share) and personal ones (sign in, My projects, My sounds, MIDI, settings, help). On a phone the menu is the only item beside the logo.

**Record.** A record button beside Stop. It records the main output from the next bar until stopped, using the library's recorder on the main bus. A recording lands in My sounds under "Recordings", can be named, auditioned, downloaded, and used on a sampler like any sound. Later: record a single track or bus (stems).

**Snapshots.** The button already sits in the project bar. A snapshot is a named copy of the project's *values* (control values, patterns, lanes, sound choices), never its scripts, which fits the model exactly. Recall is one undo step. Later: recall on a bar boundary, and morph between two snapshots. This is also the cheapest route to arrangement: a list of snapshots played in order is a song.

**MIDI.** A MIDI panel from the menu: input and output ports, clock in and out, and a table of current mappings. Learn from any control's menu ("Learn MIDI" is already a placeholder there); a mapping is stored with the control's options and jumps on first move, as agreed. Note input plays the selected track's source and can write into the synth's step strip. Mappings are part of the project, with a device profile kept per browser.

**New Track presets.** One format for a track template (script, starting values, required sounds, name, author, licence). Built-in presets, the user's own saved templates, and later shared ones are the same thing from three sources.

**My projects.** Local first (Phase 0), then the same list backed by the account. Each entry shows name, modified date, a small preview of its pattern, and whether it is saved to the cloud.

**Save to backend.** The project document is already one JSON value with a schema version. The server stores it as a versioned blob with assets (uploads, recordings) in object storage, referenced by content hash. Save is explicit plus autosave; every save keeps a revision so history and "restore" are cheap. Conflicts between two devices are resolved by revision number, with the losing copy kept as a duplicate.

**Auth.** Passwordless email link plus one or two OAuth providers. Session in an HTTP-only cookie. The app itself must hold no token that a script could read.

## 6. Architecture for the signed-in experience

**The hard rule.** Your own scripts run in the page, as now. Anything authored by someone else runs in the library's sandbox, in an iframe on a separate origin with no cookies and no network access except the audio it is handed. A shared link opens in the sandbox and does not make sound until the listener presses play. "Remix" copies the project into the listener's own space, where it becomes their code.

This rule must be in place before the first share link ships. It also bounds the cost of an XSS: the session cookie is not readable, and the sandbox origin has nothing to steal.

**Server.** Keep Rails. Add a `/v2` API beside v1 with: accounts, projects (document blob, revisions, visibility, parent for remixes), assets (hash, size, type, owner, licence), templates and macros (same shape as projects, smaller), and later follows, likes and reports. Audio is served from object storage with correct cross-origin headers for the app and the sandbox origins.

**Sharing units.** Four things can be published, each with an author, a licence and a version of cracked-up it was written against: a project, a track template, a macro, a sound pack. A registry of these is what turns users into contributors.

**Collaboration.** The document splits cleanly into script text and values. Use a CRDT for both (script text as shared text, values as a shared map), with presence showing who is on which track. Every participant runs every script in the sandbox, since none of the code is solely theirs. This is why the earlier decision stands: the sandbox is for collaboration and sharing, direct execution is for solo work.

**Contributors.** cracked-up is MIT and should be the public face for code contributors: published package, contribution guide, issue templates, the docs site, and a documented way to add a node type or a macro. Decide Euclip's own licence before launch. Start one community place (a forum or a chat server) at Phase 1, not later.

## 7. False doors

Use them where the feature needs an account, and say so plainly. A false door that pretends to fail costs trust.

| Action | What happens at launch | Prompt |
|---|---|---|
| **Save** | Saves locally, for real. | "Saved on this device. Want it on all your devices? Get notified when accounts open." |
| **New project** | Works locally, for real. | None, until a local limit is reached, if one is set. |
| **Upload sounds** | Works locally, for real, with the size limit. | "Kept in this browser. Cloud sound storage is coming." |
| **Export** | WAV of the loop works. | Stems and long renders: "coming, tell me when". |
| **Share** | Not available. | "Sharing by link is coming. Leave your email to be first." |
| **My projects on other devices** | Not available. | The same. |

Count each prompt shown and each sign-up. Those numbers decide the order of Phase 2 and what premium contains.

## 8. Premium

Do not design it in detail yet. Principles: the instrument is free and complete; publishing and listening are free; premium sells storage, privacy and heavy work. Candidates: more cloud storage for sounds and recordings, private projects beyond a small number, revision history beyond a few days, stems and long renders, larger collaboration rooms, a custom domain or embed without branding. Paid sound packs are a separate question tied to the licence audit.

## 9. What else

Not in the list given, and needed:

- **Arrangement**: scenes or a song mode. Without it projects stay eight-bar loops and the listen page will be thin.
- **A mixer view**: all channel strips and meters side by side.
- **Swing and time signature** at project level.
- **Audio input**: record from a microphone into My sounds.
- **Sync**: MIDI clock both ways first; Ableton Link is not available to browsers.
- **Offline use**: install as a web app, with the built-in sounds cached.
- **Keyboard shortcuts and a command palette.**
- **A performance view**: full-screen, large controls, snapshots on pads.
- **Version history and restore** for a project.
- **Moderation and takedown** before the listen page opens.
- **Localisation readiness**: strings are inline today.
- **A pattern mini-language** for step values, if the aim is to be taken seriously by live coders. cracked-up already parses pattern strings; exposing more of that in the grid is cheap.
- **An assistant that writes scripts from a description**, as a later premium candidate. The script API is small and documented, which suits it.

## 10. Decisions needed from the owner

1. Where v1 lives after launch, and whether v1 projects are converted.
2. Euclip's licence, and whether the app itself is open source.
3. Which sample packs can stay.
4. Whether arrangement (scenes) is in Phase 1 or Phase 2.
5. Sign-in methods.
6. The community place: forum or chat.
