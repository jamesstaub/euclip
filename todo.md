# TODO LIST

investigate cracked's `ignoreGrid` property to investigate scheduling bugs

go live list:
  - attempt to automatically use sampler filepath if not supplied
  - add `connect()` to channelStrip

- finish node config refactor (add ADSR, fix compressor threshold)
- ember-responsive fixes for small + touch screen
  - sidebar service to auto open-close when small
  - collapse track list items


### Scripts
BUG; if possible clear the "cmd-z"  undo state when changing tracks, since code mirror doesn't get re-initialized

#### Sampler / filepath
Problem: if filepath not provided, the sampler will not call the onCreateNode callback.
potentially monkey patch it in cracked lib so it uses silent.mp3 if no filepath is provided, then the onCreateNode can check for the absence of `path: this.filepath` and
manually set it to `this.localFilePath || this.filepathUrl`s


#### scope + variables

refactor docs and preset scripts once the loop.bind(selector) is fixed and working properly.
for samplers you still need to do `__(this.trackSelector).stop().start()` because `__.stop().start()` doesnt work correctly
but for other nodes you can do  `__.adsr()` to select only the adsr on that track etc

LFOs on samplers are a weird case 
```**('lfo').connect('sampler').start()
if (data) {
**(this.trackSelector).stop().start()
}
```


- rename variables to match the tabs 
  (source.filepath instead of this.filepath)
  - `source.slices[]`
  - controls instead of this.controls
  - `sequence.array` ? 
  - sequence.hits, steps, offset
  can these be settable?


- implement variables in script scope to access TrackControl values
  - - This could use existing selectors to access track nodes for controls.
  - API getters could be `this.source`, `this.controls`, `this.sequence`


  - -  you could do `{speed: controls('.sampler').speed + __.rand()}`
- Fix brittle use of order for track selectors:s  See not note on `uniqueSelector` in models/track-node.js


## Cracked Library Updates:
- Modify the class selector lookup to attempt permutations of the order for multiple classnames
  
#### helpers
- - access to slider value in functions would effectively allow non-linear sliders
- add examples of __.ms2freq using the track tempo to control LFO speeds
- the `playSample()` helper should be responsible for calling `applyTrackControls` internally, but can take an options argument to override/mutate them.

- new track dropdown menu options (different script presets)
  - build preset models in rails
  - a preset can have one of each script type
  - the preset menu should overlay the scripts sidebar and use a material ui table with checkboxes indicating which scripts
  - a toggle should default to "replace existing script"
  - users can save their own scripts to their "collections"


### Track Footer
  
  - Source editor for dealing with sample start/end and loop settings. 
  - - create an array structure for segmenting an audio sample
  - - implement an onset detection + sample chopper
  the add a namespace for array of timestamps for slice points, 
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

  - control menu could contain a text input for the target selector of a track control. By default this should populate with the related TrackNode's unique selector
  but could be a dropdown of all selectors (filtered by those that are controllable by this control type
  with track control selectors implemented, the track attrOnStep can use the selector method  



## UI
  - fix bugs in min/max/default/stepSize settings. they wonky.
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
  - despite the matrix data structure, different track sequence lengths can be supported in this view
  by overlaying a length-slider on each row of the matrix. 
  the computed value of this matrix model which ultimately gets saved on the track can
  get trimmed to a given duration

- implement "undo delete" 
- - use ember-concurrency to wait before calling save on the deleted record, show a "toast" with restore button

### Files
  - drag and drop UI for local sounds
  - set filepath local for library 
  - waveform UI control for slicing (array of start times)
  - support a dropbox URL or local folder

  - File listings should have a preview button
  - Search results should also have a "go to folder" button
  

### Misc featurs:
  - multiplayer websocket editing
  - contributor chat box
  - "assistant" in chat window suggesting next steps with actions


### Other ideas
- key bindings and tab-navigation. look at ember-focus-trap

- create a  "mixer view" for mixing all tracks that have a `channelStrip` macro

- Sequence
  - - add a sequence BPM divider
  - - add reverse/pingpong mode for tracks
  - - ability for track to have many chainable sequences (perhaps with their own script editor for the chaining logic!?)

  - - in addition to Euclidean tab, add some sorta generative/evolving/automated UI
  - - add a "Binary" sequence which converts 1-127 into a binary sequence

- Separate the `offset` from the euclidean algo. 
  offset should work for custom rhyhtms

### bugs



- - need more solid sequencer-awareness when adding/removing tracks (use generators to start on a particular beat)

- Sequencer UI bug:
  stepIdx displays on the last step first when starts playing.
  refactor the stepIndex that gets passed into Control::Multislider and SequencePagination. should be logic in those components to not render the current step if the value is -1 and had just started playing

-- when deleting a track, the script sidebar closes but property is not re-set so the button to re-open sidebar disappears

  - use the LFO example, then add an additional gain node
  - - result is the channelStrip gain not working anymore
      which reads `this.id` internally, allowing you to duplicate tracks an preserve their unique inner-references
  - when a node is initialized with attributes eg.
  - verify if `.remove()` is needed in init scripts (or do they all get torn down)
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