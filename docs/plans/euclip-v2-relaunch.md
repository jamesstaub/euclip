# Euclip v2 relaunch plan

Written 2026-11-22, revised the same day with the owner's answers. Companion to `euclip-v2-code-and-ui.md` (how the app works) and `cracked-up-and-euclip-v2.md` (the library). This document reviews where v2 stands, names what must be fixed before a public launch, and orders the work after it.

The comparison with other tools in section 3 is from general knowledge and was not re-checked against their current releases.

## 1. Where v2 stands

`client-v2` is a client-only Ember app of about 26,000 lines with 481 passing tests. It has declared controls, step grids with generators, per-step lanes, a waveform editor with slicing, a synth editor, a signal chain that edits the script, a sound browser on the v1 library, a phone layout, and one project kept in the browser.

The owner has been using it and testing it on real devices. Coverage in Safari and Firefox should still be confirmed against the owner's findings before launch.

The model is sound and distinctive: structure in code, values in the project, controls declared by the script, and every UI edit of structure written back as code. Nothing in this plan changes that.

v1 is deprecated. There are no v1 projects to preserve and no conversion. The Rails app stays as the server and gains the `/v2` API.

## 2. Critical issues

### Must fix before anyone outside uses it

| Issue | Why it is critical | Fix |
|---|---|---|
| **One project, in one browser, with no way out** | There is no export, no import and no second project. Clearing site data loses everything. | Project file export and import, several local projects, and a visible "saved" state, before any cloud work. |
| **A script can freeze the tab** | Code runs as it is typed. `while (true)` hangs the page, and the endless-loop guard was never built. | A loop guard in script execution (instrumented loops or a time budget), with recovery to the last good version. |
| **cracked-up is a file link** | `"cracked-up": "file:../../cracked-up"` cannot be deployed. cracked-up is on GitHub, but both repos have unpushed work (46 commits in the library). | Push both. Until cracked-up is published, the deploy build must work from a git dependency or a packed tarball. Once stable, publish it to npm under a version, install it properly in Euclip in place of the file link, pin it, and keep the stored `crackedUpVersion` meaningful. |
| **Free-tier read costs** | Sounds are served from a storage bucket. Without limits on reads, bucket egress from the free tier, or from a scraper, can run up costs. | READ limits on storage, as designed in section 6 (signed URLs, rate limits, a daily byte budget for anonymous use, long cache lifetimes, a CDN). |

Audio output is not limited. A feedback delay or a widened range can be very loud, and users proceed at their own risk. No limiter is planned.

### Structural

- **Three files carry too much.** `app/audio/runner.ts` is 3,156 lines, `waveform/editor.gts` 2,431 and `signal-chain-pane.gts` 2,036. The runner holds building, stored values, per-step listeners, sync, lanes, sources and silence. Split it by concern before adding MIDI, snapshots and recording, all of which would land there.
- **v1 client code is still in the code base.** Remove it (Phase 0/1). The Rails app stays as the server.
- **Tests.** Lost browser tests are not a concern. The rule from now on: every new feature adds tests to the suite in the repo, and the suite runs in CI.
- **Scripts run in the page.** That is right for your own code. It is not acceptable for anyone else's. Opening a shared project must never run its script with access to the page, the session or the API. The library's sandbox exists; the app does not use it yet. This gates every sharing feature (section 6).
- **Stored values grow without bound.** Values are kept for nodes that no longer exist so undo can restore them. Add pruning on save, and a size budget for the document. Snapshots keep values for removed controls on purpose (section 6a), so the budget must count them.
- **The design doc is long and layered.** It records decisions in the order they were made, including reversed ones. Rewrite it as a current description plus a short decision log.

### Usability

- **Concept load.** A newcomer meets units, glide, per step, lanes, generators, source versus processors, seq versus signal, and four kinds of menu. There is no first-run path. Hints are all behind "?".
- **No undo or redo buttons**, and none at all on a phone. These are to be built, in the project toolbar (section 5).
- **Errors are for coders.** A non-coder who breaks a script through the UI sees a "!" on the Script button and nothing they can act on.
- **Icons carry too much.** The chain toolbar has ten similar icons with labels only on hover. A separate design pass will address the signal-chain toolbar icons later.
- **No arrangement.** Everything is one loop. There is no way to chain patterns or build a song. See section 6a.
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

1. Push both repos. Make the deploy build work from a git dependency or a packed tarball for cracked-up.
2. Confirm Safari and Firefox coverage against the owner's findings, and fix what they show.
3. Loop guard.
4. Local projects: several projects, export and import as a file, autosave state shown.
5. Undo and redo buttons in the project toolbar, including on the phone.
6. Split the runner. From now on every new feature adds tests to the repo suite, which runs in CI.
7. Remove the v1 client code from the code base.
8. First-run experience: three or four starter projects, a short guided tour, an in-app reference for the script functions.
9. Read limits and robots measures for the library and audio paths (section 6), before the library is public.

### Phase 1. Public launch of the client-only app at euclip.app

- Deploy stays on Heroku for euclip.app. The root address opens the app on a starter project. v1 is retired; there is no v1 path to keep.
- New top bar with a menu and the project toolbar (section 5).
- Audio export of the loop as a WAV, done for real with the library's offline render.
- Record button and a recordings list (section 5).
- More New Track presets, built as the same template format that sharing will use later.
- False-door prompts for the features that need accounts (section 7), with a mailing list behind them.
- Privacy-respecting usage counts and error reports, so the false doors and the crash rate can be read.
- cracked-up published to npm once stable, and installed properly in Euclip.

### Phase 2. Accounts and saving

- Sign-in, cloud save, My projects, private and unlisted projects.
- Uploads move from the browser to the account.
- Project versions and read-only share links that play in the sandbox, with "Remix" making a copy (section 6a).

### Phase 3. Community

- A listen page: published projects that play without opening the editor.
- Shared track templates, macros and sound packs, each with an author and a licence.
- Profiles, likes, follows, remix lineage, reporting and moderation.
- An embeddable player.
- A first-party forum at forum.euclip.app with single sign-on from Euclip accounts (section 6).
- Internationalisation: move text out of templates and code into translation files with ember-intl.

### Phase 4. Collaboration and premium

- Realtime editing of one project by several people.
- Premium launches once Phase 2 shows what people use.

## 5. Features to design

**Top bar and menu.** Left: logo and the project name, editable in place (it lost its home when the title left the project bar). Right: a menu button. The menu holds project matters (new, open, duplicate, export file, export audio, share) and personal ones (sign in, My projects, My sounds, MIDI, settings, help). On a phone the menu is the only item beside the logo.

**Project toolbar.** A new project-level toolbar, separate from the signal-chain toolbar. It holds undo and redo, project versions (save a version, browse and restore versions) and the share link (which points at one version). Undo and redo are built first, in Phase 0; versions and the share link follow with accounts. On a phone the toolbar stays reachable and undo and redo are always visible. The data model behind it is in section 6a.

**Record.** A record button beside Stop. It records the main output from the next bar until stopped, using the library's recorder on the main bus. A recording lands in My sounds under "Recordings", can be named, auditioned, downloaded, and used on a sampler like any sound. Later: record a single track or bus (stems).

**Snapshots.** The button already sits in the project bar. A snapshot is a named copy of the project's *values* (control values, patterns, lanes, grid options, sound choices), never its scripts, which fits the model exactly. The full design, including recall rules and how snapshots feed arrangement, is in section 6a.

**Swing.** A dial on the stepGrid UI, per sequence, stored with the grid's options like the Length dial. Time signature is not planned now; keep it as "later".

**MIDI.** A MIDI panel from the menu: input and output ports, clock in and out, and a table of current mappings. Learn from any control's menu ("Learn MIDI" is already a placeholder there); a mapping is stored with the control's options and jumps on first move, as agreed. Note input plays the selected track's source and can write into the synth's step strip. Mappings are part of the project, with a device profile kept per browser.

**New Track presets.** One format for a track template (script, starting values, required sounds, name, author, licence). Built-in presets, the user's own saved templates, and later shared ones are the same thing from three sources. A track-scope snapshot supplies a shareable preset's values (section 6a).

**My projects.** Local first (Phase 0), then the same list backed by the account. Each entry shows name, modified date, a small preview of its pattern, and whether it is saved to the cloud.

**Save to backend.** The project document is already one JSON value with a schema version. The server stores it as a versioned blob with assets (uploads, recordings) in object storage, referenced by content hash. Save is explicit plus autosave; every save keeps a revision so history and "restore" are cheap. Conflicts between two devices are resolved by revision number, with the losing copy kept as a duplicate. A project version (section 6a) is a revision that has been kept on purpose.

**Auth.** Passwordless email link plus one or two OAuth providers (the choice is still open, section 10). Session in an HTTP-only cookie. The app itself must hold no token that a script could read.

## 6. Architecture for the signed-in experience

**The hard rule.** Your own scripts run in the page, as now. Anything authored by someone else runs in the library's sandbox, in an iframe on a separate origin with no cookies and no network access except the audio it is handed. A shared link opens in the sandbox and does not make sound until the listener presses play. "Remix" copies the project into the listener's own space, where it becomes their code.

This rule must be in place before the first share link ships. It also bounds the cost of an XSS: the session cookie is not readable, and the sandbox origin has nothing to steal.

**Server and hosting.** Keep Rails, deployed on Heroku for euclip.app. Add a `/v2` API beside the existing endpoints with: accounts, projects (document blob, versions, visibility, parent for remixes), assets (hash, size, type, owner, licence), templates and macros (same shape as projects, smaller), and later follows, likes and reports. Audio is served from object storage with correct cross-origin headers for the app and the sandbox origins.

**Audio delivery and read limits.** The sample packs are all cleared (original synthesised sound-alikes), so rights are not the issue; cost is. The free tier needs read limits so that bucket egress does not run up costs. Design:

- Audio is served through short-lived signed URLs issued by the Rails API.
- Per-IP and per-account rate limits on issuing them.
- A daily byte budget for anonymous use.
- Long cache lifetimes on the audio, and a CDN in front of the bucket.
- The bucket is not publicly listable.

**Keeping crawlers and bots out.** As far as possible, crawlers and bots are kept out of the file storage and the sound-browser contents:

- `robots.txt` disallows the library API and the audio paths.
- Those responses carry `X-Robots-Tag: noindex`.
- No public bucket listing, signed URLs and rate limiting, as above.
- The library list is fetched by the app only after it loads, and is not in the HTML.

This deters well-behaved and casual crawlers. It does not stop a determined scraper; the rate limits and byte budget are what bound the cost of one.

**Sharing units.** Four things can be published, each with an author, a licence and a version of cracked-up it was written against: a project, a track template, a macro, a sound pack. A registry of these is what turns users into contributors.

**Collaboration.** The document splits cleanly into script text and values. Use a CRDT for both (script text as shared text, values as a shared map), with presence showing who is on which track. Every participant runs every script in the sandbox, since none of the code is solely theirs. This is why the earlier decision stands: the sandbox is for collaboration and sharing, direct execution is for solo work.

**Licensing (recommended, owner to confirm).** The app will be open source. Money is charged only for services that need operations: cloud storage and hosting. The recommendation:

- **Euclip app: AGPL-3.0.** Anyone hosting a modified version must publish their changes, which protects a project funded by services.
- **cracked-up: stays MIT.**
- **User projects and shared templates** need their own content licence choice. Suggest CC BY or CC0, chosen per shared item at the point of sharing.

**Contributors.** cracked-up is on GitHub and should be the public face for code contributors: published package, contribution guide, issue templates, the docs site, and a documented way to add a node type or a macro.

**Forum.** A first-party forum hosted on our own server, with single sign-on from Euclip accounts (Phase 3). Discourse with DiscourseConnect is the usual choice, but it is not supported on Heroku, because it needs its own Docker host. So the forum would be a separate small server at forum.euclip.app, with Euclip's Rails app as the sign-on provider. The cost and upkeep of that server are to be weighed against a lighter Rails-native forum engine. The choice is open (section 10).

**Internationalisation.** In Phase 3, text moves out of templates and code into translation files using ember-intl. From now on, new strings should be written so that they are easy to extract: no sentence building by concatenation.

## 6a. Snapshots, arrangement and versions: data model

Four different things, kept separate:

- **Undo** is this session's edit history. It is not stored.
- **Versions** are full immutable copies of the whole project document: scripts, values, snapshots and arrangement. A version is made on save or explicitly. A share link points at one version.
- **Snapshots** are named copies of values only, never scripts.
- **Arrangement** is snapshots placed in time.

### Snapshot

```json
{
  "id": "snap_3",
  "name": "Breakdown",
  "scope": "project",
  "createdAt": "2026-11-22T10:15:00Z",
  "values": {
    "trk_1": {
      "controls": { "cutoff": 820, "gain": 0.7 },
      "patterns": { "kick": [1, 0, 0, 1, 0, 0, 1, 0] },
      "lanes": { "pitch": [0, 0, 7, 0, 5, 0, 3, 0] },
      "grid": { "length": 8, "step": "1/8", "swing": 0.2 },
      "sound": "pack1/kick_03"
    }
  }
}
```

`scope` is `'project'` or a track id. `values` has the same shape as the project's stored values, keyed by track id and then control key: control values, step patterns, lane (per-step) values, grid options (length, step, swing) and sound choice. Tempo is not in a snapshot by default; it belongs to the project.

Recall rules:

- A key the snapshot lacks (a control added since) keeps its present value.
- A key whose control no longer exists is ignored and kept, so it returns if the script does.
- A track added since is untouched.
- A sound choice is preloaded before recall, so recall never waits.
- Recall while playing is quantised to the next bar by default.

A track-scope snapshot is also the basis of a shareable track preset's values.

### Arrangement

One per project to start.

```json
{
  "loop": true,
  "sections": [
    { "id": "sec_1", "snapshotId": "snap_1", "bars": 8 },
    { "id": "sec_2", "snapshotId": "snap_3", "bars": 4, "mutes": ["trk_2"] },
    { "id": "sec_3", "snapshotId": "snap_1", "bars": 8 }
  ]
}
```

- Sections refer to snapshots by id. Several sections may reuse one snapshot.
- Deleting a snapshot that sections use asks first.
- Playback walks the sections, recalling each at its bar boundary. Loop mode (no arrangement playing) is today's behaviour.
- Editing values while a section plays edits the live values, not the snapshot, until "update snapshot" is pressed.

### Not in the first version

- Automation curves between sections.
- Per-section tempo.
- Several arrangements per project.
- Scripts per section. Scripts are never per-section: structure is one thing per project version.

### Open question

Whether mutes belong in the snapshot values or on the section. The sketch above puts them on the section.

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

Do not design it in detail yet. Principles: the instrument is free and complete; publishing and listening are free; money is charged only for services that need operations (cloud storage, hosting). Candidates: more cloud storage for sounds and recordings, private projects beyond a small number, version history beyond a few days, stems and long renders, larger collaboration rooms, a custom domain or embed without branding.

## 9. What else

Not in the list given, and needed:

- **Arrangement**: see section 6a. Without it projects stay eight-bar loops and the listen page will be thin.
- **A mixer view**: all channel strips and meters side by side.
- **Time signature**, later. Swing is covered in section 5.
- **Sync**: MIDI clock both ways first; Ableton Link is not available to browsers.
- **Offline use**: install as a web app, with the built-in sounds cached.
- **Keyboard shortcuts and a command palette.**
- **A performance view**: full-screen, large controls, snapshots on pads.
- **Moderation and takedown** before the listen page opens.
- **A pattern mini-language** for step values, if the aim is to be taken seriously by live coders. cracked-up already parses pattern strings; exposing more of that in the grid is cheap.
- **An assistant that writes scripts from a description**, as a later premium candidate. The script API is small and documented, which suits it.

## 10. Decisions still needed from the owner

1. Whether arrangement is in Phase 1 or Phase 2.
2. Sign-in methods.
3. Confirmation of the licence recommendation (AGPL-3.0 for the app, MIT for cracked-up, a content licence per shared item).
4. Forum software and hosting: Discourse on its own server at forum.euclip.app, or a lighter Rails-native engine.
5. Whether mutes belong in the snapshot values or on the arrangement section (section 6a).
