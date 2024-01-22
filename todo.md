# TODO LIST

go live list:
  - attempt to automatically use sampler filepath if not supplied

- ember-responsive fixes for small + touch screen
  - sidebar service to auto open-close when small
  - collapse track list items



### Scripts
BUG; if possible clear the "cmd-z"  undo state when changing tracks, since code mirror doesn't get re-initialized

Bug: sometimes updating a script (master specificall) re-initializes all the channelStrip node params (not the sliders)



#### Sampler / filepath


currently the selected filepath will occasionally get lost and revert to a default sound

#### scope + variables
 access to slider value in functions would effectively allow non-linear sliders

refactor docs and preset scripts once the loop.bind(selector) is fixed and working properly.
for samplers you still need to do `__('sampler').stop().start()` because `__.stop().start()` doesnt work correctly
but for other nodes you can do  `__.adsr()` to select only the adsr on that track etc

- add examples of __.ms2freq using the track tempo to control LFO speeds
- consider "applyTrackControls" as a public function so users can customize order in onstep scripts

- add a CMD+Click on valid cracked methods that opens the docs in a new tab

- consider refactoring the this.select() method to be a convenience method for 

```
// shorthand
exec('sine', {frequency: 440})
 
// instead of

cracked.exec(
  "frequency",
  200,
  cracked.filter("sine")
);

```


**Implement public api for controls + sequence in the scripts**
  - API getters could be `this.source`, `this.controls`, `this.sequence`
  - rename variables to match the tabs 
  (source.filepath instead of this.filepath)
  - `source.slices[]`
  - controls instead of this.controls
  - `sequence.array` ? 
  - sequence.hits, steps, offset
  can these be settable?


- implement variables in script scope to access TrackControl values
  - - This could use existing selectors to access track nodes for controls.
  - -  you could do `{speed: controls('.sampler').speed + __.rand()}`


## Cracked Library Updates:
- Modify the class selector lookup to attempt permutations of the order for multiple classnames

- implement `onCreateNodeError` in the library to gracefully handle failures



### Presets

- new track dropdown menu options (different script presets)
  - build preset models in rails
  - a preset can have one of each script type
  - the preset menu should overlay the scripts sidebar and use a material ui table with checkboxes indicating which scripts
  - a toggle should default to "replace existing script"
  - users can save their own scripts to their "collections"

  give an example of why this doesn't work:
    ```setTimeout(()=>{
        this.play();
        }, 50)
    ```
  Proves that the callback is quantized to the loop,
  TODO: look into how to schedule different times around the step for nudging or alternative sequences


### Track Footer
  
  - Source editor for dealing with sample start/end and loop settings. 
  - - create an array structure for segmenting an audio sample
  - - implement an onset detection + sample chopper
  the add a namespace for array of timestamps for slice points, 

  Source tab should have a toggle to sync to loop (proxy to speed track control with LOOPSTEPS function)
  A macro controller with speed, start, end and loop should be able to switch from absolute to tempo relative
  for all controls with one setting, by default it detects if a sample has multiple transients

  ```
  __this.select('sampler')__.attr({start: this.slices[0], end: this.slices[1]})
  or 
  __.attr({speed: .1}) 

  ```
  
 
implement a "uiState" object on track models which hold currentTabIdx values for various tabs
to keep recent state in tact when returning to a track

### Track Nodes
  - hover over node tabs to show cracked uuid and selectors
  - info menu should show example of how to mutate track controls
  
  - if an audio node fails to create (passed in bad parameters), it causes the whole track to disappear.
   there should be some instrumentation in place to check that intended nodes were created properly and if not handle it gracefully

### Track Controls

## Model
  - add "enabled/disabled" state
  - Cache Node Connections for LFOS, TrackControls:
      add callbacks **.onConnectNode **.onDisconnectNode which get called with the return value from node.connect() in the cracked script.
      in the model, pass in this callback which will save the connection to the TrackNode model.
      When a setup script is run, look for modulators connected to each node and auto-disable the TrackControl for that paramer, indicate that is disabled to allow the LFO
      Then in onStepCallback when onStepCallback gets the `attrsForNodes` it can exclude trackControls that are turned off.


  - detect if a param is manually being set in the script, show a warning on the TrackControl UI
  - add a property: "apply on: step/all"

  - Refactor model to subclasses.
  - the start/end attrs for sampler will fail if set outside sampler range. validate and reconcile this with the custom functions (or just hardcode for start/end)

  - control menu could contain a text input for the target selector of a track control. By default this should populate with the related TrackNode's unique selector
  but could be a dropdown of all selectors (filtered by those that are controllable by this control type)
  with track control selectors implemented, the track attrOnStep can use the selector method  



## UI
  - fix bugs in min/max/default/stepSize settings. they wonky.
  - design error states for project/track/controls/script/sequence components that use
     the built in error states like "model.isValid" and "model.errors"

    refactor the login flow validation errors like this too    


  - finish implementing Track Control unit functions (hz to steps etc). 
  - - when selecting a unit option for the Track Control it also sets a range of min/max/default vals
  - - LOOPSTEPS function for sampler speed: 
      sets the playback rate so the duration is x steps.
        - must update when tempo changes, sequence changes or sample changes



## Node Specific features
  - Oscillators also get Track Controls to control their waveform type. (if the script contains a generic oscillator macro)

  - Implement Envelope node : breakpoint nexus element or group of sliders. Uses ramps instead of steps
  - multidimensional controls (XY slider, breakpoint)
  - use for filters, LFOs,



### Presets:
  - finish implementing, include all node attributes in presets
    (at least for one section of them to learn the nodes)

  - preset ideas:
    mutate this.controls (or `controls()` perhaps?) for sampler start/end time to create granular loops that
    are subdivisions of the BPM or slices of a loop file

### Project
  - my-projects should not initially load all relations, too much if there are many projects.
  - - instead, load the project name only then relations on play
  - - unload project from store when exiting
  - Save "Snapshots" (need to plan this out to work with concurrent editing, permissions)
  - Arrange mode: chain multiple projects together
  - Rails Action Cables for live editing

  - Refactor Project model into "Pattern", create an arranger view for chaining patterns together. A Project wraps many patterns.

### Sequences

Implement `hasMany` sequence relationship on tracks, add UI to manage sequences.

- Refactor MultiSliderArray on The track control to be a new related model `ControlSequence`
- For each `Sequence` on a given track, each TrackControl has one `ControlSequence` of the same size

- Add new Sequence UIs:

  - Euclidean
  - Binary
  - Random
  - Manual

- implement an `this.updateSequence()` method to mutate it from code. it should have the same API as the euclidean/binary/random inputs, or can take an array directly

  ```
  this.seqeunce.euclidean(3,8,0)
  this.sequence.binary(127)
  this.sequence.random(16: len)
  this.sequence.set([1,0,1,0,1,0,1,0])
  ```

  - alias `data` variable to `step` for clarity in PLAY function

  - implement a "Matrix View", which replaces the standard track list with an intanace of
    nexus sequencer with rows for each track. inherit the Nexus matrix model to allow use of
    nexus matrix mutation functions.


  - - add a sequence BPM divider
  - - - This could be a "fake" multisequencer, where the callback only gets called on every N steps of the master sequence. The master sequence would be in "ticks", the default track rate would be every 16 ticks.

  - - - also investigate whether it could be possible to send offsets to the _loopListener time values for swing, triplets etc


  - - add reverse/pingpong mode for sequences?

  - - ability for track to have many chainable sequences (perhaps with their own script editor for the chaining logic!?)

  - - in addition to Euclidean tab, add some sorta generative/evolving/automated UI
  - - add a "Binary" sequence which converts 1-127 into a binary sequence

- Separate the `offset` from the euclidean algo.
  offset should work for custom rhyhtms


### Files
  bug: url parse error for path https://localhost:4200/v1/files/WAV%20hh+filterloops

  
  - drag and drop UI for local sounds
  
  - recently +  favorites used menus for files
  - - Rethink the filepath track-control. It could be a container of many filepaths, with an interface to change the file within a sequence. filesearch sidebar can be less coupled with the existance of a source node. 
  - - the new filepath track-control could have it's own little sequencer matrix for each file:
  
  ```
    kick.wav:  [x][ ][x][ ][x][ ][ ][ ]
    snare.wav: [ ][x][ ][ ][x][ ][ ][ ]
  ```
  - - the pre-download step would look at all the urls in the track-control.
  
  
  - custom url for files
  - support a dropbox folder of samples
  - need a pipeline to ingest new audio files:
    - create a SearchableFile record
    - upload to cloud storage (manage access permissions to gcloud storage)
    - implement upload limits per user 

  - set filepath local for library 
  - waveform UI control for slicing (array of start times)
  - support a dropbox URL or local folder

  - File listings should have a preview button
  - Search results should also have a "go to folder" button

  - file analysis:
      detect BPM if there are more than 2 transients and length is greater than 1 second
      if a file has a bpm, add a button under "sources" to set the current tempo
      and add an option to the track controls for that track to be sample-relative (as well as bpm relative)
  

### Misc featurs:
  - multiplayer websocket editing
  - contributor chat box
  - "assistant" in chat window suggesting next steps with actions


### bugs

- Sequencer UI bug:
  stepIdx displays on the last step first when starts playing.
  refactor the stepIndex that gets passed into Control::Multislider and SequencePagination. should be logic in those components to not render the current step if the value is -1 and had just started playing

-- when deleting a track, the script sidebar closes but property is not re-set so the button to re-open sidebar disappears

#### Initialize nodes with attrs
when a node is initialized with attributes eg.
  ```
  .filter({
    frequency: 440,
    q: 20
  })
  ```
  then the track-controls should also be initialized with those as the default values


## Platform improvements

implement a Forum with Threaded

optimize with dynamic imports https://github.com/embroider-build/ember-auto-import


also look at Kofi https://ko-fi.com/gold?ref=home

Mobile UI:
on phones, the verticle view should be simple play controls 
and message to rotate phone to horizontal. there it should be a minimal track list and
footer view

Current Track selection could be a native dropdown menu

### USER Roles/premium plan
given DB row limit, must enforce project and track limitations per user


### Ergonomics, UX, accessibility

- key bindings and tab-navigation. look at ember-focus-trap
and https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex

- implement "undo delete"
- - use ember-concurrency to wait before calling save on the deleted record, show a "toast" with restore button


- create a "mixer view" for mixing all tracks that have a `channelStrip` macro

